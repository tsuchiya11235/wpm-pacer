# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The MVP is scaffolded and implemented: a Next.js + TypeScript frontend
(`frontend/`) and a Spring Boot + Java backend (`backend/`). See `README.md`
for the full setup guide. All code, package names, and docs use `wpm_pacer`.

## Architecture (implemented)

- **frontend/** — Next.js 14 (App Router) + React 18 + TypeScript.
  - `app/page.tsx` orchestrates state (`text`, `wpm`, caret position) and wires
    the three input methods + the WPM control + the reading stage together.
    "Save" is a client-side "Download as .txt" of the current text — it does
    **not** call the backend Passage API (see note below).
  - `components/` — `AccordionItem` (generic collapsible section),
    `TextInputPanel` (forwardRef, exposes the `<textarea>` + caret position via
    `onCursorChange`), `FileImportControl`, `OcrUploadPanel` (file upload *or*
    live camera capture, with a retake/confirm step before OCR), `WpmControl`
    (30–1000 WPM, lives under the page title), `ReadingStage` (playback
    controls + a user-selectable highlight color picker).
  - The three input methods (`TextInputPanel`/`FileImportControl`/
    `OcrUploadPanel`) live inside collapsible `AccordionItem` sections in a
    sidebar (`<aside className="layout__col">`), and each inserts text at the
    last known caret position (`insertAtCursor` in `page.tsx`) instead of
    overwriting the textarea — existing content is never deleted by an import.
  - `lib/pacer.ts` — pure, timestamp-based pacing math (unit-tested).
  - `hooks/usePacer.ts` — rAF playback with drift-free re-anchoring on WPM change.
  - `lib/api.ts` — backend calls (OCR + Passage CRUD; the Passage calls are
    currently unused by the UI, see below); `lib/text.ts` — tokenization/counts.
  - Progressive highlight uses the Selection API + `::selection` CSS; the
    highlight color is a CSS custom property (`--highlight-bg`) set inline by
    `ReadingStage` from its color picker.
- **backend/** — Spring Boot 3 (Java 17), package root `com.wpmpacer`.
  - `controller/` `service/` `repository/` `entity/` `dto/` `config/` `exception/`.
  - Flyway migrations at `src/main/resources/db/migration/` (`V1` creates the
    `passages` table; `V2` widens the WPM check constraint to 30–1500 — never
    edit an applied migration, always add a new `Vn__...sql`).
  - PostgreSQL for dev/prod (JPA `validate`); H2 for tests and the `h2` profile.
  - OCR via Tess4J (`OcrService`) — real server-side image→text processing.
  - **Note:** the Passage persistence API (`/api/passages`, `PassageService`,
    the `PassageHistoryList` frontend component) is intentionally kept in the
    codebase but is no longer called from the frontend UI — "Save" was
    changed to a client-side `.txt` download instead of DB persistence. The
    backend code is left in place (and still tested) specifically so the
    SQL/JPA/Flyway work continues to demonstrate backend experience; don't
    delete it without checking with the user first.

## Common commands

Backend (from `backend/`, uses the bundled Maven Wrapper):

```bash
./mvnw test                                            # run tests (H2, no native Tesseract needed)
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2   # quick run without PostgreSQL
./mvnw spring-boot:run                                 # run against PostgreSQL (see README env vars)
./mvnw -q -DskipTests package                          # build jar
```

Frontend (from `frontend/`):

```bash
npm install
npm run dev          # dev server on :3000
npm run lint         # ESLint (next/core-web-vitals)
npm run type-check   # tsc --noEmit
npm test             # Jest (ts-jest, jsdom)
npm run build        # production build
```

Health check: `GET http://localhost:8080/api/health` should return 200.

## Conventions

- Schema changes go through a new Flyway migration (`V2__...`, etc.) — never edit
  an applied migration. The JPA entity must stay in sync (Hibernate runs `validate`).
- Keep `lib/pacer.ts` free of React/DOM so it remains unit-testable; put timers
  and rendering in `hooks/usePacer.ts` / `components/ReadingStage.tsx`.
- Frontend↔backend contract lives in `frontend/lib/types.ts` and the backend DTOs;
  update both together.
- The backend base URL is configured via `NEXT_PUBLIC_API_BASE_URL`; CORS origins
  via `wpm-pacer.cors.allowed-origins`.
- All work happens on a `feature/...` branch off `main`, opened as a PR, then
  merged and cleaned up (branch deleted locally and on origin) — never commit
  directly to `main`. Note GitHub does not allow a PR author to approve their
  own PR, so review/merge is done by the repo owner via the GitHub UI.

## Project concept (from requirement.md)

`wpm_pacer` is a planned web app portfolio piece, built specifically to satisfy the technical requirements of a developer-experience-required internship application. Requirements to keep in mind when scaffolding and building:

- **Purpose**: input English text and progressively colorize it (via CSS `::selection`, coloring the text background) at a selected WPM (words-per-minute) reading pace.
- **Text input methods**: manual typing, copy/paste, file import, and OCR from a photo (character recognition from an image).
- **Backend requirement**: must demonstrate experience with one of Java, PHP, JavaScript, TypeScript, HTML, CSS, SQL, etc., using a framework such as Spring or Laravel — plus git/GitHub version control usage.
- **Frontend requirement**: must demonstrate experience with JavaScript, TypeScript, HTML, CSS, using a framework such as React, Next.js, Vue.js, Nuxt.js, Electron, or Node.js — plus git/GitHub version control usage.

Since the explicit goal is to satisfy both backend and frontend experience requirements, the eventual architecture should include a real backend (not just a static frontend app) alongside the frontend.
