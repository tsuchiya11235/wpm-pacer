"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { ApiError, extractOcr } from "@/lib/api";

interface OcrUploadPanelProps {
  /** Called with recognised text so the parent can put it in the textarea. */
  onExtract: (text: string) => void;
}

type InputMode = "upload" | "camera";

/**
 * Gets recognised text from a photo, either an uploaded image file or a
 * photo taken live with the device camera. Shows a preview, a loading state
 * during extraction, and clear error messages (OCR is imperfect, so the user
 * always gets to review/correct the result upstream).
 */
export default function OcrUploadPanel({ onExtract }: OcrUploadPanelProps) {
  const [mode, setMode] = useState<InputMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Keep the object URL in sync with the selected file and revoke it on change.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError(
        "Could not access the camera. Check permissions and try again.",
      );
    }
  }, []);

  // Release the camera whenever we leave camera mode, and on unmount.
  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, stopCamera]);

  // Start the camera whenever we're in camera mode with no photo captured
  // yet. Driving this from an effect (rather than calling startCamera()
  // directly from the button click) guarantees the <video> element below
  // has already been mounted - and its ref populated - by the time the
  // async getUserMedia() call resolves and tries to attach the stream.
  // Calling it straight from the click handler raced the first render and
  // silently dropped the stream (black screen until a second click, when
  // the video element from the first attempt happened to already exist).
  useEffect(() => {
    if (mode === "camera" && !file && !cameraActive) {
      void startCamera();
    }
  }, [mode, file, cameraActive, startCamera]);

  const handleModeChange = (next: InputMode) => {
    setError(null);
    setStatus(null);
    setFile(null);
    setMode(next);
  };

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setStatus(null);
    const selected = event.target.files?.[0] ?? null;
    if (selected && !selected.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPEG, etc.).");
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Could not capture a photo. Please try again.");
          return;
        }
        setError(null);
        setStatus(null);
        setFile(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  // Discards the captured photo and asks whether to retake it, per the
  // product spec: a live photo is never sent for OCR without confirmation.
  // Clearing `file` while still in camera mode re-triggers the start-camera
  // effect above.
  const handleRetake = () => {
    setFile(null);
    setError(null);
    setStatus(null);
  };

  const handleExtract = async () => {
    if (!file) {
      return;
    }
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await extractOcr(file);
      if (result.text.trim().length === 0) {
        setStatus("No text was found in the image. Try a clearer photo.");
        return;
      }
      onExtract(result.text);
      setStatus(
        `Extracted ${result.characterCount} characters. Review and edit above.`,
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "OCR failed unexpectedly. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div aria-label="Extract text from image (OCR)">
      <div className="row" style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          className="btn btn--ghost"
          aria-pressed={mode === "upload"}
          onClick={() => handleModeChange("upload")}
        >
          Upload image
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          aria-pressed={mode === "camera"}
          onClick={() => handleModeChange("camera")}
        >
          Use camera
        </button>
      </div>

      {mode === "upload" && (
        <input
          className="file-input"
          type="file"
          accept="image/*"
          onChange={handleSelect}
          aria-label="Choose an image"
          disabled={loading}
        />
      )}

      {mode === "camera" && !file && (
        <div>
          {cameraError && (
            <p className="error" role="alert">
              {cameraError}
            </p>
          )}
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              width: "100%",
              maxHeight: 320,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "#000",
              display: cameraActive ? "block" : "none",
            }}
          />
          {!cameraActive && !cameraError && (
            <p className="status">Starting camera…</p>
          )}
          {cameraActive && (
            <div className="row" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleCapture}
              >
                Capture photo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden off-DOM canvas used only to grab a frame from the live video. */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {previewUrl && (
        <div style={{ marginTop: "0.75rem" }}>
          {/* Unoptimised: the source is a transient client-side object URL. */}
          <Image
            src={previewUrl}
            alt="Selected image preview"
            width={320}
            height={200}
            unoptimized
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          />
        </div>
      )}

      <div className="row" style={{ marginTop: "0.75rem" }}>
        {mode === "camera" && file && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleRetake}
            disabled={loading}
          >
            Retake
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void handleExtract()}
          disabled={!file || loading}
        >
          {loading ? "Extracting…" : "Extract text"}
        </button>
      </div>

      {status && <p className="status">{status}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
