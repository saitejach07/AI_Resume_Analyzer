# AI Resume Analyzer

AI Resume Analyzer is a full-stack resume-to-job-description matching app. Users upload a PDF or DOCX resume, paste a job description, and get an ATS-style score with missing skills, role detection, AI-generated resume bullet suggestions, and low-value bullet cleanup guidance.

## Contents

- [Current Status](#current-status)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [How The App Works](#how-the-app-works)
- [API Endpoints](#api-endpoints)
- [Frontend Architecture](#frontend-architecture)
- [Match Scoring](#match-scoring)
- [Security And Cost Notes](#security-and-cost-notes)
- [Performance Notes](#performance-notes)
- [Roadmap](#roadmap)
- [Verification](#verification)
- [Full Documentation](#full-documentation)

## Current Status

The project is currently a functional local MVP/alpha.

What works now:

- PDF and DOCX resume text extraction.
- Resume structuring into summary, skills, key highlights, and work experience.
- Job-description analysis through OpenAI.
- Domain-neutral role and skill extraction for software and non-software jobs.
- ATS-style required, preferred, and overall match scoring.
- Missing required and preferred skill detection.
- Advanced overview UI.
- AI-generated bullet points for missing skills.
- AI-assisted unwanted bullet detection for JD-specific cleanup.
- Dark professional React/Tailwind frontend with componentized UI sections.
- Focus-results toggle that hides/shows resume and JD inputs after analysis.

Not production-ready yet:

- No authentication or saved user history.
- No OCR for scanned/image-only PDFs.
- No formal automated test suite yet.
- No deployment configuration yet.
- No rate limiting or API cost protection yet.
- AI-generated bullet suggestions must still be reviewed by the user for truthfulness.

## Tech Stack

Frontend:

- React 19
- TypeScript
- Vite
- Tailwind CSS v4

Backend:

- Node.js
- Express
- Multer
- OpenAI API
- `pdfjs-dist` for PDF extraction
- `mammoth` for DOCX extraction

## Quick Start

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

Create `server/.env`:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=5011
```

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend:

```bash
cd client
npm run dev
```

Local URLs:

```text
Backend:  http://localhost:5011
Frontend: http://127.0.0.1:5173/
```

## Project Structure

```text
Ai_Resume_Analyzer/
  client/
    src/
      App.tsx
      main.tsx
      index.css
      pages/
        AnalyzerPage.tsx
      components/
        analyzer/
          ActionTile.tsx
          AdvancedInsightsPanel.tsx
          AnalyzeActionBar.tsx
          AnalyzerHeader.tsx
          AnalyzerInputForm.tsx
          Chip.tsx
          EmptyInsightState.tsx
          GeneratedBulletsPanel.tsx
          InsightTabButton.tsx
          JobDescriptionCard.tsx
          MetricCard.tsx
          ResumeUploadCard.tsx
          RoleSummaryCard.tsx
          ScoreRing.tsx
          ScoreSummaryCard.tsx
          SkillGroup.tsx
          StatPill.tsx
          UnwantedBulletsPanel.tsx
          WorkspaceToolbar.tsx
      types/
        analyzer.ts

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

## How The App Works

Primary analysis flow:

```text
User uploads resume + pastes JD
  -> frontend builds multipart FormData
  -> POST /api/analyze
  -> resumeParser extracts PDF/DOCX text
  -> resumeStructurer builds structured resume data
  -> aiJDClassifier detects role, domain, required skills, preferred skills
  -> aiSkillExtractor normalizes skill phrases
  -> matchEngine performs deterministic + AI semantic matching
  -> frontend renders score, role, skills, and missing skills
```

Generated bullet flow:

```text
User clicks generate bullets
  -> frontend sends resume, JD, and current analysisContext
  -> POST /api/analyze/generate-bullets
  -> backend reuses visible missing skills from analysisContext
  -> resumeOptimizer generates bullets under existing work experience sections
  -> backend validates exact keyword coverage
  -> frontend renders generated bullets and covered skill chips
```

Unwanted bullet flow:

```text
User clicks identify unwanted bullets
  -> frontend sends resume, JD, and current analysisContext
  -> POST /api/analyze/unwanted-bullets
  -> backend reviews work experience bullets only
  -> backend aligns AI results back to full parsed resume bullets
  -> frontend renders low-risk cleanup suggestions
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
- required match percentage
- preferred match percentage
- overall match percentage
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
analysisContext: JSON string from the current /api/analyze result
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
analysisContext: JSON string from the current /api/analyze result
```

Returns low-value work experience bullets that are unlikely to reduce the ATS score for the current JD.

## Frontend Architecture

`AnalyzerPage.tsx` owns workflow state and API calls. UI sections live in focused components under `client/src/components/analyzer`.

Important state in `AnalyzerPage.tsx`:

| State | Purpose |
| --- | --- |
| `resumeFile` | Uploaded resume file |
| `jobDescription` | JD textarea content |
| `result` | Main `/api/analyze` response |
| `isLoading` | Primary analysis loading state |
| `advancedAction` | Tracks generate or cleanup action loading |
| `showAdvanced` | Shows/hides advanced overview |
| `isInputPanelCollapsed` | Focus-results mode toggle |
| `activeInsightTab` | Skills, generated, or cleanup tab |
| `generatedBullets` | Generated bullet endpoint response |
| `unwantedBullets` | Unwanted bullet endpoint response |

Key components:

| Component | Purpose |
| --- | --- |
| `AnalyzerHeader` | Product header and top stat pills |
| `WorkspaceToolbar` | Hide/show input workspace after analysis |
| `AnalyzerInputForm` | Resume, JD, errors, and analyze button wrapper |
| `ResumeUploadCard` | Resume file picker |
| `JobDescriptionCard` | JD textarea with word count |
| `ScoreSummaryCard` | Overall, required, and preferred score display |
| `RoleSummaryCard` | Detected role and advanced overview toggle |
| `AdvancedInsightsPanel` | Skills/generated/cleanup tab workspace |
| `GeneratedBulletsPanel` | Generated missing-skill bullets |
| `UnwantedBulletsPanel` | Low-risk cleanup bullet suggestions |

## Match Scoring

Current scoring formula:

```text
requiredMatch = matchedRequired / totalRequired * 100
preferredMatch = matchedPreferred / totalPreferred * 100
overallMatch = requiredMatch * 0.7 + preferredMatch * 0.3
```

Required skills contribute 70% of the overall score. Preferred skills contribute 30%.

## Security And Cost Notes

Current local MVP risks:

- No authentication.
- No authorization.
- CORS is currently open through `cors()`.
- No rate limiting.
- No request quota protection around OpenAI calls.
- API URL is hardcoded in the frontend.
- Uploaded files are processed in memory and are not stored.

Recommended before public deployment:

- Add rate limiting for `/api/analyze` and advanced endpoints.
- Restrict CORS to the deployed frontend origin.
- Add request body limits for `jobDescription`.
- Add basic API authentication or user accounts.
- Remove or reduce verbose OpenAI debug logging.
- Avoid logging raw resume or JD content in production.

## Performance Notes

Current bottlenecks:

- Primary analysis can make multiple sequential OpenAI calls.
- Advanced endpoints re-parse the resume file.
- No caching exists for repeated resume/JD combinations.

Practical improvements:

- Run required/preferred skill normalization in parallel with `Promise.all`.
- Cache parsed resume structure by file hash for a short period.
- Add a parse-only endpoint for debugging uploads without spending OpenAI tokens.
- Add progress indicators for long-running AI requests.

## Roadmap

Priority 1: reliability and cost control

1. Add backend unit tests for parser, structurer, matcher, and optimizer.
2. Add rate limiting and request size limits.
3. Add a parse-only/debug endpoint.
4. Make frontend API URL configurable through environment variables.

Priority 2: user workflow

1. Add copy buttons for generated bullets.
2. Add export controls for suggestions.
3. Add a reset button.
4. Add clearer grouped output by company/client.

Priority 3: production readiness

1. Add OCR support for scanned PDFs.
2. Add deployment configuration.
3. Add auth/history only if users need saved analyses.
4. Add monitoring and privacy-safe logging.

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

## Full Documentation

Detailed handoff documentation is available here:

[docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)

## GitHub Safety Notes

This repository should not include:

- `node_modules/`
- `client/dist/`
- `.env`
- local Codex metadata
- credentials or secrets
- uploaded resumes
