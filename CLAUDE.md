# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The MVP is scaffolded and implemented: a Next.js + TypeScript frontend
(`frontend/`) and a Spring Boot + Java backend (`backend/`). See `README.md`
for the full setup guide. All code, package names, and docs use `wpm_pacer`.

## Architecture (implemented)

- **frontend/** — Next.js 14 (App Router) + React 18 + TypeScript.
  - `app/page.tsx` orchestrates state (text, wpm, sourceType, save/history).
  - `components/` — `TextInputPanel`, `FileImportControl`, `OcrUploadPanel`,
    `WpmControl`, `ReadingStage`, `PassageHistoryList`.
  - `lib/pacer.ts` — pure, timestamp-based pacing math (unit-tested).
  - `hooks/usePacer.ts` — rAF playback with drift-free re-anchoring on WPM change.
  - `lib/api.ts` — backend calls; `lib/text.ts` — tokenization/counts.
  - Progressive highlight uses the Selection API + `::selection` CSS.
- **backend/** — Spring Boot 3 (Java 17), package root `com.wpmpacer`.
  - `controller/` `service/` `repository/` `entity/` `dto/` `config/` `exception/`.
  - Flyway migration at `src/main/resources/db/migration/V1__create_passages_table.sql`.
  - PostgreSQL for dev/prod (JPA `validate`); H2 for tests and the `h2` profile.
  - OCR via Tess4J (`OcrService`) — real server-side image→text processing.

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

## Project concept (from requirement.md)

`wpm_pacer` is a planned web app portfolio piece, built specifically to satisfy the technical requirements of a developer-experience-required internship application. Requirements to keep in mind when scaffolding and building:

- **Purpose**: input English text and progressively colorize it (via CSS `::selection`, coloring the text background) at a selected WPM (words-per-minute) reading pace.
- **Text input methods**: manual typing, copy/paste, file import, and OCR from a photo (character recognition from an image).
- **Backend requirement**: must demonstrate experience with one of Java, PHP, JavaScript, TypeScript, HTML, CSS, SQL, etc., using a framework such as Spring or Laravel — plus git/GitHub version control usage.
- **Frontend requirement**: must demonstrate experience with JavaScript, TypeScript, HTML, CSS, using a framework such as React, Next.js, Vue.js, Nuxt.js, Electron, or Node.js — plus git/GitHub version control usage.

Since the explicit goal is to satisfy both backend and frontend experience requirements, the eventual architecture should include a real backend (not just a static frontend app) alongside the frontend.
