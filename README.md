# Wellbeing Journal (React Front‑End)

This is the front‑end for your Wellbeing Journal. It connects to your Google Apps Script backend.

## Setup

1. Deploy the Apps Script (see the canvas message in ChatGPT for the code) and copy the **deployment URL**.
2. Create a `.env` file in this folder from `.env.example` and set your values.
3. Install and run:

```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Notes
- Front‑end login is **not secure**; for production, use Firebase Auth or a proper backend.
- The History tab is read‑only and fetches recent entries with `action=list`.

