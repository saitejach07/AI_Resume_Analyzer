# AI Resume Analyzer

AI Resume Analyzer is a full-stack resume-to-job-description matching app. Users upload a PDF or DOCX resume, paste a job description, and receive an ATS-style match report with advanced resume optimization actions.

## Features

- Upload PDF, DOC, or DOCX resumes.
- Parse resume summary, skills, key highlights, and work experience.
- Compare resumes against any job description, not only software roles.
- Detect job role and professional domain dynamically.
- Separate required and preferred JD skills.
- Calculate required, preferred, and overall ATS match percentages.
- Show missing required and preferred skills.
- Generate targeted bullet points for missing skills.
- Identify low-value work experience bullets for a specific JD.
- Animated React + Tailwind UI with advanced overview controls.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4

### Backend

- Node.js
- Express
- Multer
- OpenAI API
- `pdfjs-dist` for PDF text extraction
- `mammoth` for DOCX text extraction

## Project Structure

```text
client/
  src/
    App.tsx
    main.tsx
    index.css
    pages/
      AnalyzerPage.tsx

server/
  server.js
  routes/
    analyzeRoutes.js
  controllers/
    analyzeController.js
  services/
    aiJDClassifier.js
    aiSkillExtractor.js
    matchEngine.js
    openaiClient.js
    resumeOptimizer.js
    resumeParser.js
    resumeStructurer.js

docs/
  PROJECT_DOCUMENTATION.md
```

## Setup

Install dependencies separately for the backend and frontend.

```bash
cd server
npm install
```

```bash
cd ../client
npm install
```

## Environment Variables

Create `server/.env`:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=5011
```

Do not commit `.env` files. They are ignored by `.gitignore`.

## Running Locally

Start the backend:

```bash
cd server
npm run dev
```

Backend runs at:

```text
http://localhost:5011
```

Start the frontend:

```bash
cd client
npm run dev
```

Frontend runs at:

```text
http://127.0.0.1:5173/
```

## API Endpoints

### Analyze Resume

```http
POST /api/analyze
```

Multipart form fields:

```text
resume: PDF/DOC/DOCX file
jobDescription: full job description text
```

Returns:

- resume summary
- resume skills
- detected role
- job domain
- required skills
- preferred skills
- required match
- preferred match
- overall match
- missing required skills
- missing preferred skills

### Generate Missing Skill Bullets

```http
POST /api/analyze/generate-bullets
```

Multipart form fields:

```text
resume: PDF/DOC/DOCX file
jobDescription: full job description text
analysisContext: JSON string from the current analysis result
```

Returns targeted bullet point suggestions and the work experience section where each bullet should be added.

### Identify Unwanted Bullets

```http
POST /api/analyze/unwanted-bullets
```

Multipart form fields:

```text
resume: PDF/DOC/DOCX file
jobDescription: full job description text
analysisContext: JSON string from the current analysis result
```

Returns low-value work experience bullets that are unlikely to reduce ATS score if removed.

## Match Scoring

Current scoring formula:

```text
requiredMatch = matchedRequired / totalRequired * 100
preferredMatch = matchedPreferred / totalPreferred * 100
overallMatch = requiredMatch * 0.7 + preferredMatch * 0.3
```

Required skills contribute 70% of the overall score. Preferred skills contribute 30%.

## Resume Parsing Notes

Both PDF and DOCX files are normalized through the same `resumeStructurer` pipeline after text extraction.

Current parser behavior:

- Keeps summary separate.
- Keeps key highlights separate from work experience.
- Extracts skill keywords from skills and highlights.
- Groups work experience by client/company.
- Preserves role heading and tech stack per experience.
- Handles PDF wrapped lines.
- Handles DOCX paragraph-style bullets.

## Verification

Frontend:

```bash
cd client
npm run build
npm run lint
```

Backend syntax checks:

```bash
node --check server/services/resumeParser.js
node --check server/services/resumeStructurer.js
node --check server/services/matchEngine.js
node --check server/services/resumeOptimizer.js
node --check server/controllers/analyzeController.js
```

Backend module load check without real API calls:

```bash
OPENAI_API_KEY=test node -e 'require("./server/routes/analyzeRoutes"); console.log("server modules loaded")'
```

## Documentation

Detailed project documentation is available here:

[docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)

## Known Limitations

- Scanned/image-only PDFs require OCR and are not currently supported.
- DOC files are rejected by the parser; upload DOCX instead.
- Generated resume bullets should be reviewed before being used.
- Scoring is intentionally simple and does not yet weight individual skills by importance.

## GitHub Notes

This repository should not include:

- `node_modules/`
- `client/dist/`
- `.env`
- local Codex metadata
- credentials or secrets
