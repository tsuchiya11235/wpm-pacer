# tessdata

Place Tesseract language data files here so the backend OCR endpoint
(`POST /api/ocr`) can run.

At minimum, download the English model and save it as `eng.traineddata` in
this directory:

- https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata (recommended, smaller)
- https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata (full)

The path and language are configurable via `wpm-pacer.ocr.datapath` /
`wpm-pacer.ocr.language` (or the `WPM_PACER_OCR_DATAPATH` /
`WPM_PACER_OCR_LANGUAGE` environment variables). By default the backend looks
in `./tessdata` relative to the process working directory.

`*.traineddata` files are git-ignored (they are large binaries), so each
environment downloads its own copy.
