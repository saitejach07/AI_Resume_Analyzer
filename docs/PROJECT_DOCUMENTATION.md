# AI Resume Analyzer Project Documentation

Last updated: 2026-06-11

## Contents

1. [Project Summary](#1-project-summary)
2. [Current Project Status](#2-current-project-status)
3. [Repository Structure](#3-repository-structure)
4. [Runtime Requirements](#4-runtime-requirements)
5. [Environment Variables](#5-environment-variables)
6. [Running Locally](#6-running-locally)
7. [High-Level Architecture](#7-high-level-architecture)
8. [End-To-End Request Flows](#8-end-to-end-request-flows)
9. [Backend Architecture](#9-backend-architecture)
10. [Frontend Architecture](#10-frontend-architecture)
11. [API Contracts](#11-api-contracts)
12. [Scoring Logic](#12-scoring-logic)
13. [User Experience Flow](#13-user-experience-flow)
14. [Major Issues Fixed](#14-major-issues-fixed)
15. [Security And Cost Posture](#15-security-and-cost-posture)
16. [Performance Analysis](#16-performance-analysis)
17. [Current Known Limitations](#17-current-known-limitations)
18. [Prioritized Recommendations](#18-prioritized-recommendations)
19. [Verification Commands](#19-verification-commands)
20. [Handoff Notes](#20-handoff-notes)

## 1. Project Summary

AI Resume Analyzer is a full-stack local web application that compares a resume against a job description and returns an ATS-style match report.

The user flow is:

1. Upload a resume as PDF or DOCX.
2. Paste a job description.
3. Click `Analyze ATS score`.
4. Review the overall match, required match, preferred match, detected role, and missing skills.
5. Open the advanced workspace for detailed skill lists.
6. Generate suggested resume bullets for missing skills.
7. Identify low-value work experience bullets that are unlikely to hurt the score if removed.

The app uses deterministic parsing and matching where possible, and uses OpenAI for role extraction, semantic matching, and advanced resume optimization suggestions.

## 2. Current Project Status

The project is currently a functional local MVP/alpha.

Completed so far:

- Backend Express API is implemented.
- Frontend React/Vite app is implemented.
- PDF parsing has been fixed so PDF resumes populate `resume.summary` and `resume.skills`.
- DOCX and PDF resumes now run through the same resume structuring pipeline after text extraction.
- `KEY HIGHLIGHTS` are kept separate from the summary and work experience.
- Skill extraction has been improved to avoid polluted skills such as `Languages Java` or `Tailwind CSS Backend NodeJS`.
- JD parsing is domain-neutral and is no longer hardcoded only for software jobs.
- Matching supports deterministic exact/alias checks before OpenAI semantic matching.
- Required/preferred skill duplicates are removed, with required skills taking priority.
- Main endpoint `/api/analyze` is functional.
- Advanced endpoint `/api/analyze/generate-bullets` is functional.
- Advanced endpoint `/api/analyze/unwanted-bullets` is functional.
- Advanced endpoints use the current frontend `analysisContext` to avoid mismatch between visible missing skills and generated results.
- Frontend has a dark professional workspace theme.
- Frontend has a focus-results toggle that hides/shows the resume and JD input area after analysis.
- Frontend has been refactored into reusable components instead of keeping all UI inside `AnalyzerPage.tsx`.

Current quality level:

- Good for local demos, iteration, and portfolio review.
- Not ready for production deployment yet.
- Needs automated tests, OCR support, deployment setup, and production security hardening before public release.

## 3. Repository Structure

```text
Ai_Resume_Analyzer/
  README.md
  .gitignore

  client/
    index.html
    package.json
    vite.config.ts
    eslint.config.js
    tsconfig.json
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
    package.json
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

## 4. Runtime Requirements

Backend:

- Node.js
- OpenAI API key
- Default port: `5011`

Frontend:

- Node.js
- Vite dev server
- Default port: `5173`

## 5. Environment Variables

Create `server/.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5011
```

Rules:

- Never commit `.env`.
- Never commit API keys, passwords, or tokens.
- If a credential was ever shared in chat or committed by mistake, rotate it before public use.

## 6. Running Locally

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

Start backend:

```bash
cd server
npm run dev
```

Backend URL:

```text
http://localhost:5011
```

Start frontend:

```bash
cd client
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173/
```

## 7. High-Level Architecture

```text
React Frontend
  |
  | multipart/form-data
  v
Express API
  |
  |-- resumeParser
  |     |-- PDF text extraction with pdfjs-dist
  |     |-- DOCX text extraction with mammoth
  |
  |-- resumeStructurer
  |     |-- summary
  |     |-- skills
  |     |-- key highlights
  |     |-- work experience
  |
  |-- aiJDClassifier
  |     |-- detected role
  |     |-- job domain
  |     |-- required skills
  |     |-- preferred skills
  |     |-- responsibilities
  |
  |-- aiSkillExtractor
  |     |-- role/domain-aware skill normalization
  |
  |-- matchEngine
  |     |-- deterministic matching
  |     |-- alias matching
  |     |-- OpenAI semantic matching for unresolved skills
  |     |-- scoring
  |
  |-- resumeOptimizer
        |-- missing-skill bullet generation
        |-- unwanted bullet detection
```

## 8. End-To-End Request Flows

### 8.1 Primary Analysis Flow

```text
User
  -> uploads resume
  -> pastes job description
  -> clicks Analyze ATS score

Frontend AnalyzerPage.handleSubmit
  -> validates resumeFile and jobDescription
  -> builds FormData with resume and jobDescription
  -> POST http://localhost:5011/api/analyze

Backend analyzeRoutes
  -> Multer validates file field, MIME type, and file size
  -> analyzeController.analyzeResume

Backend buildAnalysis
  -> resumeParser.extractResumeText
  -> resumeStructurer.buildResumeJSON
  -> aiJDClassifier.classifyJDWithAI
  -> aiSkillExtractor.extractAtomicSkills for required skills
  -> aiSkillExtractor.extractAtomicSkills for preferred skills
  -> computeMatch with deterministic and AI semantic matching

Frontend result render
  -> stores AnalyzeResponse in result
  -> collapses inputs into focus-results mode
  -> opens advanced overview
  -> shows score, role, skills, missing skills, and advanced actions
```

Cost profile:

- Resume parsing and structuring are local.
- JD classification uses OpenAI.
- Required skill normalization uses OpenAI.
- Preferred skill normalization uses OpenAI.
- Semantic matching for unresolved skills uses OpenAI.

### 8.2 Generate Missing-Skill Bullets Flow

```text
User
  -> clicks Generate bullet points for missing skills

Frontend AnalyzerPage.handleAdvancedAction('generate')
  -> switches active tab to generated
  -> builds FormData with resume, jobDescription, and analysisContext
  -> analysisContext contains current visible jobDescription and match result
  -> POST /api/analyze/generate-bullets

Backend generateBullets
  -> re-parses resume into structured resume data
  -> parses analysisContext
  -> reuses visible missingRequired and missingPreferred
  -> resumeOptimizer.generateMissingSkillBullets
  -> validates exact keyword coverage
  -> repairs or falls back if coverage is incomplete

Frontend
  -> renders target company/heading
  -> renders generated bullet text
  -> renders covered skill chips
  -> renders coverage count
```

Important guarantee:

- The generated endpoint should cover the missing skills already shown in the UI, not a freshly recalculated skill set.

### 8.3 Identify Unwanted Bullets Flow

```text
User
  -> clicks Identify unwanted bullet points

Frontend AnalyzerPage.handleAdvancedAction('unwanted')
  -> switches active tab to cleanup
  -> builds FormData with resume, jobDescription, and analysisContext
  -> POST /api/analyze/unwanted-bullets

Backend findUnwantedBullets
  -> re-parses resume into structured resume data
  -> parses analysisContext
  -> reviews work experience bullets only
  -> excludes summary, skills, and key highlights
  -> aligns AI-identified bullets back to full parsed resume bullets

Frontend
  -> renders company/heading
  -> renders full bullet text
  -> renders risk level and ATS impact
```

Important guarantee:

- Cleanup suggestions should be conservative and should not be based on broken bullet fragments.

## 9. Backend Architecture

### `server/server.js`

Express app entrypoint.

Responsibilities:

- Loads environment variables.
- Enables CORS.
- Enables JSON parsing.
- Mounts analyze routes at `/api/analyze`.
- Starts the server.

### `server/routes/analyzeRoutes.js`

Defines upload handling and analyze routes.

Multer upload rules:

- Uses memory storage.
- Maximum file size is `2MB`.
- File field must be named `resume`.
- Accepted MIME types:
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

Routes:

```http
POST /api/analyze
POST /api/analyze/generate-bullets
POST /api/analyze/unwanted-bullets
```

### `server/controllers/analyzeController.js`

Orchestration layer for the backend.

Primary functions:

- `analyzeResume`
- `generateBullets`
- `findUnwantedBullets`
- `buildAnalysis`

Important behavior:

- Validates that resume and JD are present.
- Extracts resume text.
- Builds structured resume JSON.
- Classifies the JD.
- Normalizes required and preferred skills.
- Computes match result.
- Uses `analysisContext` for advanced endpoints when provided.
- Deduplicates preferred skills against required skills.
- Deduplicates missing preferred skills against missing required skills.

### `server/services/resumeParser.js`

Extracts raw text from uploaded resume files.

PDF behavior:

- Uses `pdfjs-dist`.
- Reconstructs rows using text item coordinates.
- Sorts rows from top to bottom.
- Sorts row items from left to right.
- Preserves line breaks so section headers remain detectable.

DOCX behavior:

- Uses `mammoth.extractRawText`.
- Returns raw document text.

DOC behavior:

- Upload MIME type may be accepted by Multer.
- Parser rejects legacy `.doc` and asks the user to upload DOCX.

### `server/services/resumeStructurer.js`

Converts raw resume text into structured resume data.

Internal shape:

```json
{
  "summary": "",
  "skills": [],
  "highlights": [
    {
      "id": "",
      "text": ""
    }
  ],
  "experience": [
    {
      "id": "",
      "company": "",
      "role": "",
      "heading": "",
      "bullets": [
        {
          "id": "",
          "text": ""
        }
      ],
      "techStack": []
    }
  ],
  "other": []
}
```

Important behavior:

- Keeps summary separate from key highlights.
- Keeps key highlights separate from work experience.
- Uses key highlights as skill evidence.
- Detects skills sections and splits categories.
- Handles skill pollution from category labels.
- Handles PDF wrapped lines.
- Handles DOCX paragraph-style bullets.
- Groups experience by company/client heading.
- Preserves role and tech stack under the correct work experience.

### `server/services/aiJDClassifier.js`

Uses OpenAI to classify the job description.

Output:

```json
{
  "detectedRole": "",
  "jobDomain": "",
  "requiredSkills": [],
  "preferredSkills": [],
  "responsibilities": []
}
```

Important behavior:

- Domain-neutral.
- Supports software and non-software job descriptions.
- Does not force every JD into a software role.

### `server/services/aiSkillExtractor.js`

Normalizes JD skills into ATS-friendly atomic keywords.

Examples:

- Software: `React`, `Java`, `Docker`, `CI/CD`
- Cloud: `AWS`, `CloudFormation`, `Terraform`
- Healthcare: `EHR`, `HIPAA`, `Patient Care`
- Accounting: `GAAP`, `QuickBooks`, `Month-End Close`
- Sales: `CRM`, `Salesforce`, `Pipeline Management`

### `server/services/matchEngine.js`

Computes match result.

Flow:

1. Builds a resume corpus from summary, skills, highlights, experience bullets, tech stacks, and other text.
2. Deduplicates required and preferred skills.
3. Removes required duplicates from preferred.
4. Runs deterministic exact and alias matching.
5. Sends only unresolved skills to OpenAI semantic matching.
6. Computes required, preferred, and overall scores.

### `server/services/resumeOptimizer.js`

Handles advanced optimization actions.

Functions:

- `generateMissingSkillBullets`
- `identifyUnwantedBullets`

Bullet generation behavior:

- Uses the missing required/preferred skills visible in the UI.
- Suggests bullets under existing work experience sections.
- Does not place suggestions under key highlights.
- Requires exact missing keywords to appear in bullet text.
- Repairs missing keyword coverage if OpenAI misses a term.
- De-duplicates repeated skills.
- Sorts suggestions by target experience section.

Unwanted bullet behavior:

- Reviews work experience bullets only.
- Does not review summary, skills, or key highlights.
- Uses the full parsed bullet text, not broken fragments.
- Conservative by design.
- Returns low-risk bullets for the current JD.

## 10. Frontend Architecture

### `client/src/App.tsx`

Thin app shell:

```tsx
import AnalyzerPage from './pages/AnalyzerPage'

export default function App() {
  return <AnalyzerPage />
}
```

### `client/src/pages/AnalyzerPage.tsx`

State and workflow owner.

Responsibilities:

- Resume file state.
- JD textarea state.
- Analyze API call.
- Advanced action API calls.
- Error state.
- Loading state.
- Advanced overview state.
- Focus-results toggle state.
- Active advanced tab state.

It now calls focused components instead of rendering the entire UI inline.

### State Management

All user-facing workflow state currently lives in `AnalyzerPage.tsx`.

| State | Type | Purpose |
| --- | --- | --- |
| `resumeFile` | `File \| null` | Uploaded resume file object |
| `jobDescription` | `string` | JD textarea content |
| `result` | `AnalyzeResponse \| null` | Full response from `/api/analyze` |
| `isLoading` | `boolean` | Primary analysis loading state |
| `advancedAction` | `AdvancedAction \| null` | Which advanced action is running |
| `error` | `string` | Primary analysis error message |
| `advancedError` | `string` | Advanced action error message |
| `showAdvanced` | `boolean` | Whether advanced overview is visible |
| `isInputPanelCollapsed` | `boolean` | Whether the input workspace is hidden |
| `activeInsightTab` | `InsightTab` | Current tab: skills, generated, or cleanup |
| `generatedBullets` | `GenerateBulletsResponse \| null` | Generated bullets result |
| `unwantedBullets` | `UnwantedBulletsResponse \| null` | Cleanup result |

Important derived values:

| Value | Purpose |
| --- | --- |
| `canAnalyze` | Enables analyze button only when file and JD exist |
| `canRunAdvancedAction` | Enables advanced actions after a valid analysis |
| `missingTotal` | Total missing required + preferred skills |
| `jobDescriptionWordCount` | JD word count badge |
| `isFocusMode` | Result-focused layout mode |
| `scoreTone` | Score ring color family based on match percentage |

### `client/src/types/analyzer.ts`

Shared frontend response types:

- `AnalyzeResponse`
- `GeneratedBullet`
- `GenerateBulletsResponse`
- `UnwantedBullet`
- `UnwantedBulletsResponse`
- `AdvancedAction`
- `InsightTab`

### Component Inventory

| Component | Responsibility |
| --- | --- |
| `AnalyzerHeader` | Header card, title, tagline, stat pills |
| `StatPill` | Small header stat display |
| `WorkspaceToolbar` | Focus-results toggle bar |
| `AnalyzerInputForm` | Form wrapper for resume, JD, error, and submit |
| `ResumeUploadCard` | File input and selected filename display |
| `JobDescriptionCard` | JD textarea with word count |
| `AnalyzeActionBar` | Analyze button and backend-flow note |
| `ScoreSummaryCard` | Overall score, required score, preferred score |
| `ScoreRing` | Circular conic-gradient score indicator |
| `MetricCard` | Required/preferred metric card |
| `RoleSummaryCard` | Detected role, domain, and advanced toggle |
| `AdvancedInsightsPanel` | Skills/generated/cleanup tab workspace |
| `InsightTabButton` | Individual tab button with count |
| `SkillGroup` | Skill chip group with count |
| `Chip` | Reusable skill/result tag |
| `ActionTile` | Advanced action card/button |
| `GeneratedBulletsPanel` | Generated bullet cards |
| `UnwantedBulletsPanel` | Cleanup bullet cards |
| `EmptyInsightState` | Empty state text for advanced tabs |

### `client/src/index.css`

Global style system.

Current UI direction:

- Dark professional workspace.
- Near-black navy/slate background.
- Dark charcoal panels.
- Soft borders.
- Subtle 3D depth.
- Emerald accents for primary/focus/generated items.
- Rose accents for missing skills.
- Amber accents for unwanted bullet cleanup.

Important custom classes:

- `.glass-panel`
- `.depth-panel`
- `.focus-toolbar`
- `.focus-toggle`
- `.button-primary`
- `.button-secondary`
- `.score-shell`
- `.score-dial`
- `.insight-workbench`
- `.insight-tabbar`
- `.insight-tab`
- `.insight-section`
- `.action-tile`
- `.app-aurora`

## 11. API Contracts

### Analyze Resume

```http
POST /api/analyze
Content-Type: multipart/form-data
```

Form fields:

```text
resume: PDF/DOC/DOCX file
jobDescription: string
```

Response:

```json
{
  "message": "Resume + JD analyzed successfully (AI powered)",
  "resume": {
    "summary": "",
    "skills": []
  },
  "jobDescription": {
    "detectedRole": "",
    "jobDomain": "",
    "requiredSkills": [],
    "preferredSkills": [],
    "responsibilities": []
  },
  "match": {
    "requiredMatch": 100,
    "preferredMatch": 94,
    "overallMatch": 98,
    "matchedRequired": [],
    "missingRequired": [],
    "matchedPreferred": [],
    "missingPreferred": []
  }
}
```

### Generate Missing Skill Bullets

```http
POST /api/analyze/generate-bullets
Content-Type: multipart/form-data
```

Form fields:

```text
resume: PDF/DOC/DOCX file
jobDescription: string
analysisContext: JSON string from current /api/analyze result
```

Response:

```json
{
  "message": "Missing-skill bullet suggestions generated successfully",
  "jobDescription": {},
  "match": {
    "missingRequired": [],
    "missingPreferred": []
  },
  "suggestedBullets": [
    {
      "targetCompany": "Wells Fargo",
      "targetHeading": "Client: Wells Fargo, Minneapolis, MN",
      "coversSkills": ["Go", "Infrastructure-as-Code"],
      "bullet": "Developed Go-based services using Infrastructure-as-Code practices...",
      "reason": "This bullet covers missing keywords for the target JD."
    }
  ],
  "coverage": {
    "totalMissingSkills": 2,
    "coveredSkills": ["Go", "Infrastructure-as-Code"]
  }
}
```

### Identify Unwanted Bullets

```http
POST /api/analyze/unwanted-bullets
Content-Type: multipart/form-data
```

Form fields:

```text
resume: PDF/DOC/DOCX file
jobDescription: string
analysisContext: JSON string from current /api/analyze result
```

Response:

```json
{
  "message": "Unwanted resume bullets identified successfully",
  "jobDescription": {},
  "match": {},
  "unwantedBullets": [
    {
      "company": "CVS Health",
      "heading": "Client: CVS Health, Pittsburgh, PA",
      "bullet": "",
      "reason": "",
      "riskLevel": "low",
      "atsImpact": "unlikely to reduce ATS score"
    }
  ]
}
```

## 12. Scoring Logic

Current scoring is intentionally simple and explainable.

```text
requiredMatch = matchedRequired / totalRequired * 100
preferredMatch = matchedPreferred / totalPreferred * 100
overallMatch = requiredMatch * 0.7 + preferredMatch * 0.3
```

Weighting:

- Required skills: 70%
- Preferred skills: 30%

Rules:

- Required skills take priority over preferred skills.
- Preferred duplicates are removed if already present in required.
- Missing preferred duplicates are removed if already present in missing required.
- Deterministic matches are accepted before AI semantic matching.

Future scoring could add:

- skill importance
- years of experience
- domain relevance
- seniority fit
- certifications
- recency

## 13. User Experience Flow

Initial screen:

- Header introduces the tool.
- Resume upload card accepts PDF/DOC/DOCX.
- JD card accepts pasted job description.
- Score area shows an empty waiting state.

After analysis:

- Overall score appears.
- Required and preferred scores appear.
- Detected role appears.
- Advanced overview is available.
- Inputs collapse automatically into focus-results mode.

Focus-results mode:

- Resume and JD input area is hidden.
- Result space expands.
- User can toggle inputs back on using the workspace button.

Advanced overview:

- Skills tab shows required, preferred, missing required, and missing preferred.
- Generated tab shows missing-skill bullet suggestions.
- Cleanup tab shows unwanted/low-value bullet suggestions.

## 14. Major Issues Fixed

### PDF Summary and Skills Empty

Original observed PDF output:

```json
{
  "resume": {
    "summary": "",
    "skills": []
  }
}
```

Root cause:

- PDF extraction flattened text into a space-heavy stream.
- Section headers were not reliably preserved as lines.

Fix:

- Rebuilt PDF text by visual rows using PDF text coordinates.
- Preserved newlines before sending raw text to `resumeStructurer`.

### Polluted Skills

Bad output examples:

```json
[
  "Languages Java",
  "Python scripting (ETL",
  "Log Parsing) Frontend HTML",
  "Tailwind CSS Backend NodeJS"
]
```

Fix:

- Added category boundary splitting.
- Added section-aware skills parsing.
- Added parenthetical skill cleanup.
- Added alias normalization.

Expected style:

```json
[
  "Java",
  "Python",
  "ETL",
  "Log Parsing",
  "HTML",
  "Tailwind CSS",
  "Node.js"
]
```

### Key Highlights Included In Summary

Problem:

- `KEY HIGHLIGHTS` was appended to `resume.summary`.

Fix:

- `KEY HIGHLIGHTS` now becomes a separate `highlights` section.
- Highlights are used as skill evidence.
- Highlights are not mixed into work experience.

### Work Experience Mixed With Highlights

Decision:

- Work experience should remain company/client-specific.
- Key highlights are global evidence.
- Generated bullets should be placed only under existing work experience sections.

### Generated Bullets Did Not Include Exact Keywords

Problem:

- AI sometimes claimed a bullet covered a skill without using that exact searchable keyword.

Fix:

- Prompt and post-processing now require the exact missing keyword inside the bullet.
- A repair pass attempts to fix missing coverage.
- Fallback bullets are generated if OpenAI still misses a keyword.

### Advanced Endpoints Had Different Missing Skill Counts

Problem:

- UI showed one missing-skill set.
- Advanced endpoint recalculated and returned a different count.

Fix:

- Frontend sends `analysisContext`.
- Backend advanced endpoints use the current visible analysis context.

### Duplicate Required and Preferred Skills

Problem:

- Skills appeared in both required and preferred with casing differences.

Fix:

- Required skills take priority.
- Preferred duplicates are removed.
- Missing preferred duplicates are removed against missing required.

### Present Skills Marked Missing

Problem:

- Skills visible in the resume were sometimes marked missing.

Fix:

- Added deterministic exact and alias matching before semantic matching.

### Unwanted Bullets Were Broken Fragments

Problem:

- Unwanted bullet detection sometimes reviewed partial fragments instead of full bullets.

Fix:

- Resume structuring now joins wrapped bullet continuations.
- Optimizer maps AI-identified bullets back to full existing work experience bullets where possible.

## 15. Security And Cost Posture

Current local MVP posture:

| Area | Current State | Risk |
| --- | --- | --- |
| Authentication | None | High if exposed publicly |
| Authorization | None | High if exposed publicly |
| CORS | `cors()` allows broad local access | Medium |
| Rate limiting | None | High for OpenAI cost abuse |
| Request size control | File size is limited, JD text length is not | Medium |
| File storage | Files stay in memory and are not persisted | Low |
| API key storage | `.env` expected and ignored by git | Low if key is not committed |
| HTTPS | Not configured for local dev | Medium for production |
| Logging | Some AI responses are logged for debugging | Medium if logs include sensitive text |

Before public deployment:

1. Restrict CORS to the deployed frontend origin.
2. Add rate limiting to `/api/analyze`, `/generate-bullets`, and `/unwanted-bullets`.
3. Add maximum JD text length.
4. Add authentication or at least a private API key header.
5. Remove raw OpenAI debug logs from production.
6. Avoid logging raw resume or JD content.
7. Add dependency audit checks.

## 16. Performance Analysis

Current bottlenecks:

| Bottleneck | Detail | Severity |
| --- | --- | --- |
| Sequential OpenAI calls | JD classify, required extraction, preferred extraction, and semantic match run in sequence | Medium |
| Advanced endpoint re-parsing | Resume is parsed again for generate/cleanup actions | Medium |
| No caching | Same resume/JD combination recomputes from scratch | Low for local MVP |
| Hardcoded API URL | Frontend points directly at `http://localhost:5011` | Medium for deployment |

Practical optimizations:

1. Run required and preferred skill extraction in parallel with `Promise.all`.
2. Cache parsed resume structure by file hash for short-lived sessions.
3. Add a parse-only endpoint for parser debugging without OpenAI token spend.
4. Add request progress indicators for long-running AI calls.
5. Consider lazy-loading advanced result panels if bundle size becomes an issue.

## 17. Current Known Limitations

- Scanned/image-only PDFs are not supported.
- OCR is not implemented.
- Legacy `.doc` files are rejected by the parser; upload DOCX instead.
- Multi-column PDFs may still produce imperfect reading order.
- Uploaded files are not stored, which is good for privacy but means no history.
- No user authentication.
- No database.
- No deployment pipeline.
- No formal backend unit tests yet.
- No formal frontend component tests yet.
- Match scoring treats all required skills equally and all preferred skills equally.
- Generated bullet suggestions need human review before use.
- AI outputs can vary slightly between runs.

## 18. Prioritized Recommendations

### Priority 1: Reliability, Security, And Cost Control

1. Add automated tests for `resumeParser`, `resumeStructurer`, `matchEngine`, and `resumeOptimizer`.
2. Add rate limiting and request size limits.
3. Add a parse-only/debug endpoint that does not call OpenAI.
4. Restrict CORS before deployment.
5. Remove raw AI response logging from production.
6. Make frontend API URL configurable through environment variables.

### Priority 2: Code Quality

1. Extract repeated skill helper utilities into a shared backend helper module.
2. Extract constants for MIME types, section headers, scoring weights, and skill aliases.
3. Add a backend config module for port, model name, CORS origin, and limits.
4. Add a React error boundary around the analyzer page.
5. Add integration tests for the main API endpoints.

### Priority 3: User Workflow

1. Add copy buttons for generated bullets.
2. Add export controls for generated suggestions.
3. Add a reset button.
4. Group generated bullets more clearly by company/client.
5. Add score explanation text for why skills are missing.

### Priority 4: Production Features

1. Add OCR support for scanned PDFs.
2. Add deployment configuration.
3. Add auth and saved history only if users need persistent accounts.
4. Add monitoring and privacy-safe logging.
5. Add an optimized resume draft/export workflow.

## 19. Verification Commands

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
node --check server/services/aiJDClassifier.js
node --check server/services/aiSkillExtractor.js
node --check server/controllers/analyzeController.js
node --check server/routes/analyzeRoutes.js
node --check server/server.js
```

Backend module load check without real API calls:

```bash
OPENAI_API_KEY=test node -e 'require("./server/routes/analyzeRoutes"); console.log("server modules loaded")'
```

## 20. Handoff Notes

If sharing the project with someone else, describe it as:

```text
A local full-stack AI resume analyzer MVP. It supports PDF/DOCX resume upload, JD analysis, ATS-style scoring, missing skill detection, generated resume bullet suggestions, and unwanted bullet cleanup guidance. The backend is functional with Express and OpenAI. The frontend is a dark React/Tailwind workspace and has been refactored into reusable components. It is ready for local demo and further development, but not production deployed yet.
```

Important handoff details:

- The main app is in `client/src/pages/AnalyzerPage.tsx`.
- Most UI sections are in `client/src/components/analyzer`.
- Shared frontend response types are in `client/src/types/analyzer.ts`.
- Backend routing starts at `server/routes/analyzeRoutes.js`.
- Backend orchestration is in `server/controllers/analyzeController.js`.
- Resume parsing and structuring are the most important backend areas.
- Advanced optimization logic is in `server/services/resumeOptimizer.js`.
- `.env` must be created locally with `OPENAI_API_KEY`.
- OpenAI-backed endpoints spend API tokens.
