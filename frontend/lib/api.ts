import type { OcrResult } from "@/lib/types";

const DEFAULT_BASE_URL = "http://localhost:8080";

/** Resolves the backend base URL from the public env var, with a dev default. */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}

/** Error carrying the backend's HTTP status and any field-level details. */
export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Reads a failed response body (the backend's uniform ApiError shape) and
 * throws an {@link ApiError}. Falls back to a generic message when the body is
 * not JSON.
 */
async function throwApiError(response: Response): Promise<never> {
  let message = `Request failed (${response.status})`;
  let details: string[] = [];
  try {
    const body = await response.json();
    if (body && typeof body.message === "string") {
      message = body.message;
    }
    if (Array.isArray(body?.details)) {
      details = body.details;
    }
  } catch {
    // Non-JSON error body; keep the generic message.
  }
  throw new ApiError(message, response.status, details);
}

/** Wraps fetch to normalise network errors into {@link ApiError}. */
async function safeFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (cause) {
    throw new ApiError(
      "Could not reach the server. Is the backend running?",
      0,
    );
  }
}

/** Sends an image to the backend OCR endpoint and returns the extracted text. */
export async function extractOcr(image: File): Promise<OcrResult> {
  const form = new FormData();
  form.append("image", image);

  const response = await safeFetch(`${getApiBaseUrl()}/api/ocr`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    await throwApiError(response);
  }
  return (await response.json()) as OcrResult;
}
