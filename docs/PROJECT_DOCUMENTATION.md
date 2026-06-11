# AI Resume Analyzer Documentation

## Project Purpose

This project is an AI-powered resume-to-job-description analyzer. A user uploads a resume as PDF, DOC, or DOCX, pastes a job description, and receives an ATS-style match report.

The application currently supports:

- Resume upload and text extraction from PDF and DOCX.
- Resume structuring into summary, skills, highlights, and work experience.
- Dynamic job-description parsing across any job domain, not only software roles.
- ATS skill matching with required/preferred scoring.
- Missing skill overview.
- AI-generated resume bullet suggestions for missing skills.
- AI-assisted unwanted/low-value work experience bullet detection.
- React + Tailwind frontend with animated UI and advanced overview actions.

## Repository Structure

```text
Ai_Resume_Analyzer/
  client/
    src/
      App.tsx
      main.tsx
      index.css
      pages/
        AnalyzerPage.tsx
    package.json
    vite.config.ts

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
    package.json

  docs/
    PROJECT_DOCUMENTATION.md
```

## Runtime Requirements

### Backend

- Node.js
- `OPENAI_API_KEY` in `server/.env`
- Port: `5011` by default

Start backend:

```bash
cd server
npm run dev
```

Backend URL:

```text
http://localhost:5011
```

### Frontend

- Vite
- React
- Tailwind CSS v4

Start frontend:

```bash
cd client
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173/
```

## Environment Variables

Backend expects:

```env
OPENAI_API_KEY=your_api_key_here
PORT=5011
```

`PORT` is optional. If not set, backend uses `5011`.

## High-Level Architecture

```text
Frontend
  |
  | multipart/form-data
  v
POST /api/analyze
  |
  v
analyzeController
  |
  |-- resumeParser
  |     |-- PDF: pdfjs-dist
  |     |-- DOCX: mammoth
  |
  |-- resumeStructurer
  |     |-- summary
  |     |-- skills
  |     |-- highlights
  |     |-- grouped experience
  |
  |-- aiJDClassifier
  |     |-- detectedRole
  |     |-- jobDomain
  |     |-- requiredSkills
  |     |-- preferredSkills
  |     |-- responsibilities
  |
  |-- aiSkillExtractor
  |     |-- role/domain-aware skill normalization
  |
  |-- matchEngine
        |-- deterministic exact/alias matching
        |-- AI semantic matching
        |-- scoring
```

Advanced actions use:

```text
POST /api/analyze/generate-bullets
POST /api/analyze/unwanted-bullets
```

The frontend sends the current analysis context to these advanced endpoints so the generated results use the same missing skills already visible in the UI.

## Backend Files

### `server/server.js`

Express app entrypoint.

Responsibilities:

- Enables CORS.
- Enables JSON parsing.
- Mounts analyze routes at `/api/analyze`.
- Starts the backend server.

### `server/routes/analyzeRoutes.js`

Defines upload handling and API routes.

Multer config:

- Memory upload.
- Max file size: `2MB`.
- Required file field name: `resume`.
- Allowed MIME types:
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

Main orchestration layer.

Primary functions:

- `analyzeResume`
- `generateBullets`
- `findUnwantedBullets`
- `buildAnalysis`

Important behavior:

- `/api/analyze` performs the full parse/classify/match pipeline.
- Advanced endpoints can use `analysisContext` sent from the frontend, avoiding a second JD/match recalculation.
- Required skills take priority over preferred skills.
- Preferred skills are de-duplicated against required skills.
- Missing preferred skills are de-duplicated against missing required skills.

### `server/services/resumeParser.js`

Extracts raw text from uploaded files.

PDF behavior:

- Uses `pdfjs-dist`.
- Reconstructs PDF rows using PDF text item coordinates.
- Sorts rows top-to-bottom.
- Sorts row items left-to-right.
- Joins rows with newlines.

DOCX behavior:

- Uses `mammoth.extractRawText`.
- Returns raw text from Word documents.

DOC behavior:

- Currently rejected with an error asking the user to upload DOCX instead.

### `server/services/resumeStructurer.js`

Converts raw resume text into structured resume JSON.

Current output shape internally:

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

Key features:

- Recognizes summary headers.
- Recognizes skills headers.
- Recognizes key highlights separately from summary.
- Recognizes work experience, project, and employment history sections.
- Keeps `KEY HIGHLIGHTS` separate from `WORK EXPERIENCE`.
- Extracts clear skill keywords from highlights and merges them into `resume.skills`.
- Handles PDF bullet-style resumes.
- Handles DOCX paragraph-style resumes where bullets may not have bullet symbols.
- Groups experience under client/company headings.
- Preserves role heading separately from client heading.
- Preserves tech stack lines under the correct work experience.

Important section handling:

- `SUMMARY` goes to `summary`.
- `KEY HIGHLIGHTS` goes to `highlights`.
- `TECHNICAL SKILLS` goes to `skills`.
- `WORK EXPERIENCE` goes to `experience`.

### `server/services/aiJDClassifier.js`

Uses OpenAI to parse the job description.

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

Important improvement:

- Originally focused on software/IT.
- Now domain-neutral.
- Can parse healthcare, accounting, sales, marketing, HR, construction, education, software, and other domains.

### `server/services/aiSkillExtractor.js`

Normalizes JD skill phrases into ATS-friendly keywords.

Important behavior:

- Uses detected role and domain as context.
- Does not force software keywords for non-software roles.
- Keeps role-specific skills, systems, tools, certifications, methods, and domain terms.

Examples:

- Healthcare: `EHR`, `HIPAA`, `BLS`, `Patient Care`
- Accounting: `GAAP`, `QuickBooks`, `Month-End Close`
- Sales: `CRM`, `Salesforce`, `Pipeline Management`
- Software: `React`, `Java`, `Docker`, `CI/CD`

### `server/services/matchEngine.js`

Computes match score.

Flow:

1. Builds a resume corpus from:
   - summary
   - skills
   - highlights
   - experience bullets
   - tech stacks
   - other text
2. De-duplicates required/preferred skills.
3. Removes required duplicates from preferred.
4. Runs deterministic exact/alias matching first.
5. Sends only unresolved skills to OpenAI semantic matching.
6. Computes scores.

Deterministic matching prevents obvious false negatives. If a skill is visibly present in the resume, it is matched without relying on OpenAI.

Examples of deterministic aliases:

- `GitHub Actions`
- `CloudFormation`
- `Integrations`
- `Asynchronous systems`
- `RESTful APIs`
- `CI/CD`
- `Infrastructure-as-Code`
- `Node.js`
- `React`
- `Genesys Cloud CX Administration`

### `server/services/resumeOptimizer.js`

Supports advanced actions.

Functions:

- `generateMissingSkillBullets`
- `identifyUnwantedBullets`

Bullet generation behavior:

- Uses current missing required/preferred skills from the UI analysis context.
- Generates suggestions under existing work experience sections.
- Does not place generated bullets under `KEY HIGHLIGHTS`.
- Requires exact missing keywords inside generated bullet text.
- Repairs missing keyword coverage if the first AI response misses a term.
- Falls back to generated coverage bullets if OpenAI still misses a keyword.
- De-duplicates repeated skills.
- Sorts output by target experience section.

Unwanted bullet behavior:

- Reviews work experience bullets only.
- Does not review summary, skills, or key highlights.
- Conservative by design.
- Only returns bullets that are low risk to remove for the current JD.

## API Contracts

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
analysisContext: JSON string from the current /api/analyze response
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
analysisContext: JSON string from the current /api/analyze response
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

## Scoring Logic

Current scoring is in `server/services/matchEngine.js`.

```text
requiredMatch = matchedRequired / totalRequired * 100
preferredMatch = matchedPreferred / totalPreferred * 100
overallMatch = requiredMatch * 0.7 + preferredMatch * 0.3
```

Weighting:

```text
Required skills: 70%
Preferred skills: 30%
```

Example:

```text
Required match = 100%
Preferred match = 94%

Overall = (100 * 0.7) + (94 * 0.3)
Overall = 98.2
Rounded = 98%
```

This is intentionally simple and explainable. A future scoring model could add:

- skill importance
- years of experience
- domain relevance
- recency
- certifications
- seniority fit

## Frontend Architecture

### `client/src/App.tsx`

Thin shell:

```tsx
import AnalyzerPage from './pages/AnalyzerPage'

export default function App() {
  return <AnalyzerPage />
}
```

### `client/src/pages/AnalyzerPage.tsx`

Main frontend page.

Responsibilities:

- Resume upload.
- JD textarea.
- Analyze button.
- Overall score panel.
- Required/preferred score cards.
- Detected role card.
- Advanced overview toggle.
- Required/preferred/missing skill chips.
- Generate bullet points button.
- Identify unwanted bullet points button.
- Generated bullets panel.
- Unwanted bullets panel.

Important behavior:

- Advanced actions send `analysisContext` from the current analysis result.
- This prevents generated bullet coverage from using a different OpenAI analysis than the visible missing skill chips.

### `client/src/index.css`

Contains:

- Tailwind import.
- Base styles.
- Glass panel component class.
- Primary and secondary button classes.
- Result card class.
- Animated aurora background.
- Card entrance animation.
- Shimmer animation.
- Loading dot animation.

## Frontend User Flow

1. User uploads PDF or DOCX resume.
2. User pastes JD.
3. User clicks `Analyze ATS score`.
4. UI shows:
   - overall match
   - required match
   - preferred match
   - detected role
   - job domain
5. User clicks `Advanced overview`.
6. UI shows:
   - required skills
   - preferred skills
   - missing required
   - missing preferred
7. User can click:
   - `Generate bullet points for missing skills`
   - `Identify unwanted bullet points`

## Major Issues Fixed During Development

### 1. PDF Summary and Skills Empty

Original issue:

```json
{
  "resume": {
    "summary": "",
    "skills": []
  }
}
```

Root cause:

- PDF parser joined all text items with spaces.
- Section headers were lost as standalone lines.

Fix:

- Rebuilt PDF page text by visual rows using item coordinates.
- Preserved newlines.

### 2. Polluted Skills

Bad output:

```json
[
  "Languages Java",
  "Python scripting (ETL",
  "Log Parsing) Frontend HTML",
  "Tailwind CSS Backend NodeJS"
]
```

Fix:

- Added skill category detection.
- Added category boundary splitting.
- Added parenthetical skill handling.
- Added alias normalization.

Improved output includes:

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

### 3. Tech-Only JD Bias

Original issue:

- Prompts assumed software/IT jobs.

Fix:

- Made JD classifier and skill extractor domain-neutral.
- Added role/domain detection.
- Preserved non-tech skills for non-tech roles.

### 4. Key Highlights Polluting Summary

Original issue:

- `KEY HIGHLIGHTS` content appeared inside `resume.summary`.

Fix:

- Added separate `highlights` section.
- Kept highlights out of work experience.
- Used highlights as extra skill evidence.

### 5. Work Experience Mixed With Highlights

Decision:

- Do not mix `KEY HIGHLIGHTS` with `WORK EXPERIENCE`.
- Highlights are global evidence.
- Work experience remains company/client-specific.

### 6. PDF/DOCX Experience Mismatch

Original issue:

- PDF and DOCX structured experience differently.
- PDF wrapped lines became fake companies.
- DOCX paragraph-style bullets became one unassigned block.

Fix:

- Recognized role headings.
- Recognized client headings.
- Grouped bullets under client/company.
- Joined wrapped bullet continuation lines.
- Treated DOCX paragraphs as experience bullets even without bullet symbols.

### 7. Generated Bullets Covered Wrong Skills

Original issue:

- AI suggested a bullet claiming to cover a skill but did not include the exact keyword.
- Example: claimed `Genesys Cloud CX Administration` but bullet only said `integrations`.

Fix:

- Required every covered skill to appear exactly in the generated bullet.
- Added post-processing validation.
- Added repair pass.
- Added fallback exact keyword coverage.

### 8. Advanced Actions Had Different Missing Skill Counts

Original issue:

- UI showed one missing skill set.
- Advanced endpoint recalculated JD/match and got a different missing skill set.

Fix:

- Frontend now sends current analysis context.
- Backend advanced endpoints use that context instead of recalculating JD/match.

### 9. Duplicate Required and Preferred Skills

Original issue:

- Same skill appeared in both required and preferred.
- Example:
  - `Genesys Cloud CX Administration`
  - `Genesys Cloud CX administration`

Fix:

- Required skills take priority.
- Preferred list removes skills already present in required.
- Matching also de-duplicates missing preferred against missing required.

### 10. Exact Skills Marked Missing Despite Being Present

Original issue:

- Skills like `GitHub Actions`, `CloudFormation`, `Integrations`, and `Asynchronous systems` were visible in DOCX but still marked missing.

Fix:

- Added deterministic exact/alias matching before AI matching.
- AI now only receives unresolved skills.

## Current Known Limitations

- Scanned image-only PDFs are not supported. OCR would be required.
- DOC files are rejected; user should upload DOCX.
- Scoring treats all required skills equally and all preferred skills equally.
- Generated bullets are AI suggestions and still need user review for truthfulness.
- Unwanted bullet detection is intentionally conservative and may return no bullets.
- The frontend currently has no persistent storage or user accounts.
- The backend does not store uploaded resumes.

## Recommended Next Steps

1. Add a parse-only backend endpoint for debugging uploads without spending OpenAI tokens.
2. Add formal tests for:
   - PDF parsing
   - DOCX parsing
   - section splitting
   - skill extraction
   - scoring
3. Add OCR support for scanned PDFs.
4. Add an improved scoring model with skill importance.
5. Add frontend copy/export buttons for generated bullets.
6. Add a side-by-side resume improvement workspace.
7. Add persistence if users need history.

## Verification Commands

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

## Important Development Notes

- `/api/analyze` spends OpenAI tokens.
- `/api/analyze/generate-bullets` spends OpenAI tokens.
- `/api/analyze/unwanted-bullets` spends OpenAI tokens.
- Local parser checks can be done without OpenAI if calling parser/structurer directly.
- Do not expose `resume.experience` in the main `/api/analyze` response unless the frontend needs it.
- Keep generated bullets tied to existing work experience sections, not highlights.
- Keep highlights separate from work experience.
