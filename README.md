# HSBC Team4 — Opportunity Matching

A compact project providing a Next.js frontend and a Python backend for matching opportunities and running matching logic as a service.

**Contents**
- [About](#about)
- [Sample data](#Sample-data)
- [Python script](#Python-script)
- [How to run](#how-to-run)
- [Tech stack](#tech-stack)
- [Files to know](#files-to-know)

## About

This repository contains a React/Next.js frontend and a Python-based matching service. The frontend serves the UI and developer experience; the Python service performs the matching logic and can be run as a local HTTP service. Additionally, there are instructions on how to generate the sample data and python script.

## Sample data

Prerequisites (found in documents folder)
1. the specification document
2. Clean Power Ecosystem pdf file
3. HSBC X FDM AI Hackathon description pdf file

Navigate to Copilot Agent. For the prompt, give in the Prerequisites and tell it to generate the sample data in the form of a csv file, with the columns being: Company Name,Ecosystem Position,City,Country. You can specify the number of desired entries.

## Python script

Prerequisites (found in documents folder)
1. the specification document
2. Clean Power Ecosystem pdf file
3. HSBC X FDM AI Hackathon description pdf file

Navigate to Copilot Agent. Upload the prerequisites. For the prompt, the agent needs to generate a python script that takes in and score the metrics listed in the spec file and add weightings for different valid matching pairs. It should generate two output files: best matching pair and opportunity briefs. Both must follow the same format describled in the specification as well.


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
