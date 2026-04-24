# HSBC Team4 — Opportunity Matching

A compact project providing a Next.js frontend and a Python backend for matching opportunities and running matching logic as a service.

**Contents**
- [About](#about)
- [How to run](#how-to-run)
- [Tech stack](#tech-stack)
- [Files to know](#files-to-know)

## About

This repository contains a React/Next.js frontend and a Python-based matching service. The frontend serves the UI and developer experience; the Python service performs the matching logic and can be run as a local HTTP service.

## How to run

Prerequisites
- Node.js 18+ (or compatible)
- Python 3.10+
- Git

Run the frontend

Install dependencies and start the dev server (npm):

```bash
npm install
npm run dev
```

Or using pnpm if you prefer:

```bash
pnpm install
pnpm dev
```

The frontend will be available at http://localhost:3000 by default.

Run the backend (Python)

Create and activate a virtual environment, install requirements, then run the service on port 8080.

Windows (PowerShell):

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python opportunity_matching.py --mode serve --port 8080
```

Windows (cmd.exe):

```cmd
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python opportunity_matching.py --mode serve --port 8080
```

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python opportunity_matching.py --mode serve --port 8080
```

After starting the backend, the service will listen on port 8080.

## Tech stack

- Frontend: Next.js, React, TypeScript
- Styling: Tailwind CSS
- Backend: Python 3.x (matching service logic)
- Dev tooling: Node/npm (or pnpm)

## Files to know

- [package.json](package.json) — frontend scripts and dependencies
- [requirements.txt](requirements.txt) — Python dependencies for the backend
- [opportunity_matching.py](opportunity_matching.py) — main Python entrypoint for matching and serving

## Contributing

Found an issue or want to improve docs or code? Open a PR or an issue describing the change.

---

If you want, I can also add environment variable examples to [`.env.example`](.env.example) or add a small README section describing the API endpoints exposed by the Python service.
