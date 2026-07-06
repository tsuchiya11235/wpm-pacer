# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains only `requirement.md` and `plan_wpm_pacer.md` — no source code, no commits, and no build tooling exist yet. There are no build/lint/test commands to run because no project has been scaffolded. When code is added, this file should be updated with the actual commands and architecture.

Note: the project directory has been renamed to `wpm_pacer` on disk. All code, package names, README, and documentation should use `wpm_pacer`.

## Project concept (from requirement.md)

`wpm_pacer` is a planned web app portfolio piece, built specifically to satisfy the technical requirements of a developer-experience-required internship application. Requirements to keep in mind when scaffolding and building:

- **Purpose**: input English text and progressively colorize it (via CSS `::selection`, coloring the text background) at a selected WPM (words-per-minute) reading pace.
- **Text input methods**: manual typing, copy/paste, file import, and OCR from a photo (character recognition from an image).
- **Backend requirement**: must demonstrate experience with one of Java, PHP, JavaScript, TypeScript, HTML, CSS, SQL, etc., using a framework such as Spring or Laravel — plus git/GitHub version control usage.
- **Frontend requirement**: must demonstrate experience with JavaScript, TypeScript, HTML, CSS, using a framework such as React, Next.js, Vue.js, Nuxt.js, Electron, or Node.js — plus git/GitHub version control usage.

Since the explicit goal is to satisfy both backend and frontend experience requirements, the eventual architecture should include a real backend (not just a static frontend app) alongside the frontend.
