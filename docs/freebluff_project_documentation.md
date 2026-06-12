# AI Resume Analyzer — End-to-End Project Documentation

> **Generated:** June 11, 2026  
> **Project Root:** `Ai_Resume_Analyzer`  
> **Repository:** Full-stack Node.js + React application — no database, no third-party auth, local development only  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Architecture Diagram](#4-architecture-diagram)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [End-to-End Request Flows](#7-end-to-end-request-flows)
8. [API Contracts](#8-api-contracts)
9. [AI Pipeline Deep-Dive](#9-ai-pipeline-deep-dive)
10. [Scoring Logic](#10-scoring-logic)
11. [Setup & Running Locally](#11-setup--running-locally)
12. [Environment Variables](#12-environment-variables)
13. [Component Inventory](#13-component-inventory)
14. [CSS Design System](#14-css-design-system)
15. [Known Issues & Limitations](#15-known-issues--limitations)
16. [Security Posture](#16-security-posture)
17. [Performance Analysis](#17-performance-analysis)
18. [Identified Bugs](#18-identified-bugs)
19. [Code Quality Observations](#19-code-quality-observations)
20. [Recommendations](#20-recommendations)
21. [Verification Commands](#21-verification-commands)
22. [GitHub Notes](#22-github-notes)

---

## 1. Project Overview

**AI Resume Analyzer** is a full-stack web application that helps job seekers optimize their resumes for specific job descriptions. A user uploads a resume (PDF or DOCX), pastes a job description, and receives:

- An **ATS-style match report** with percentage scores (required, preferred, overall)
- A **detected role** and **professional domain** inferred from the JD
- **Required and preferred skill breakdowns** with matched/missing indicators
- **AI-generated bullet points** that explicitly cover missing skills, placed under the most relevant existing work experience section
- **AI-identified low-value bullets** that can likely be removed without hurting ATS alignment

The application is **domain-agnostic** — it works for software engineering, healthcare, accounting, sales, marketing, HR, construction, education, and any other profession.

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.2.4 | Build tool / dev server |
| Tailwind CSS | 4.1.12 | Utility-first CSS |
| @tailwindcss/vite | 4.1.12 | Tailwind v4 Vite plugin |
| @vitejs/plugin-react | 5.1.1 | React Fast Refresh |
| ESLint | 9.39.1 | Linting |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | — | JavaScript runtime |
| Express | 5.2.1 | HTTP server / routing |
| Multer | 2.0.2 | Multipart file upload handling |
| OpenAI | 6.16.0 | GPT-4o-mini API client |
| pdfjs-dist | 5.4.530 | PDF text extraction (legacy build) |
| mammoth | 1.11.0 | DOCX text extraction |
| cors | 2.8.6 | Cross-origin requests |
| dotenv | 17.2.3 | Environment variable loading |
| uuid | 13.0.0 | Unique ID generation |
| nodemon | 3.1.14 | Dev server auto-restart |

### What's NOT in the stack

- ❌ **No Spring Boot** — backend is Node.js/Express, not Java
- ❌ **No database** (no PostgreSQL, MongoDB, MySQL, etc.)
- ❌ **No ORM** (no Prisma, Sequelize, Mongoose)
- ❌ **No authentication** (no JWT, OAuth, sessions)
- ❌ **No caching layer** (no Redis)
- ❌ **No state management library** (no Redux, Zustand — just React `useState`/`useMemo`)
- ❌ **No router** (single-page app with conditional rendering)
- ❌ **No deployment configuration** (no Docker, no CI/CD)

---

## 3. Repository Structure

```
Ai_Resume_Analyzer/
├── .gitignore
├── README.md
│
├── docs/
│   ├── PROJECT_DOCUMENTATION.md          # Original developer documentation
│   └── freebluff_project_documentation.md  # THIS FILE — comprehensive E2E docs
│
├── client/                               # React + Vite + Tailwind frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json                     # Project references
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── eslint.config.js
│   ├── index.html
│   └── src/
│       ├── App.tsx                       # Root component (renders AnalyzerPage)
│       ├── App.css
│       ├── main.tsx                      # React entry point
│       ├── index.css                     # Tailwind imports + custom component CSS classes + animations
│       ├── types/
│       │   └── analyzer.ts               # All TypeScript type definitions
│       ├── pages/
│       │   └── AnalyzerPage.tsx           # Main page — all state management & API calls
│       └── components/
│           └── analyzer/                  # 17 focused UI components
│               ├── ActionTile.tsx
│               ├── AdvancedInsightsPanel.tsx
│               ├── AnalyzeActionBar.tsx
│               ├── AnalyzerHeader.tsx
│               ├── AnalyzerInputForm.tsx
│               ├── Chip.tsx
│               ├── EmptyInsightState.tsx
│               ├── GeneratedBulletsPanel.tsx
│               ├── InsightTabButton.tsx
│               ├── JobDescriptionCard.tsx
│               ├── MetricCard.tsx
│               ├── ResumeUploadCard.tsx
│               ├── RoleSummaryCard.tsx
│               ├── ScoreRing.tsx
│               ├── ScoreSummaryCard.tsx
│               ├── SkillGroup.tsx
│               ├── StatPill.tsx
│               ├── UnwantedBulletsPanel.tsx
│               └── WorkspaceToolbar.tsx
│
└── server/                               # Express + OpenAI backend
    ├── package.json
    ├── server.js                         # Express entry point
    ├── workflow.txt                      # Empty — appears unused
    ├── routes/
    │   └── analyzeRoutes.js              # Multer config + route definitions
    ├── controllers/
    │   └── analyzeController.js          # Request orchestration & response formatting
    └── services/
        ├── openaiClient.js               # Shared OpenAI SDK instance
        ├── resumeParser.js               # PDF (pdfjs-dist) + DOCX (mammoth) extraction
        ├── resumeStructurer.js           # Raw text → structured resume JSON
        ├── aiJDClassifier.js             # OpenAI: JD → detectedRole, jobDomain, skills
        ├── aiSkillExtractor.js           # OpenAI: skill phrase normalization
        ├── matchEngine.js                # Deterministic + AI semantic skill matching & scoring
        └── resumeOptimizer.js            # OpenAI: bullet generation & unwanted bullet detection
```

---

## 4. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    React 19 SPA (localhost:5173)                    │  │
│  │                                                                     │  │
│  │  App.tsx                                                            │  │
│  │   └── AnalyzerPage.tsx (all state, all API calls)                   │  │
│  │        ├── AnalyzerHeader                                           │  │
│  │        ├── WorkspaceToolbar (focus mode toggle)                     │  │
│  │        ├── AnalyzerInputForm                                        │  │
│  │        │   ├── ResumeUploadCard (file input)                        │  │
│  │        │   ├── JobDescriptionCard (textarea)                        │  │
│  │        │   └── AnalyzeActionBar (submit button)                     │  │
│  │        └── [Results Area]                                           │  │
│  │            ├── ScoreSummaryCard (ScoreRing + MetricCards)           │  │
│  │            ├── RoleSummaryCard (detected role + toggle)             │  │
│  │            └── AdvancedInsightsPanel (3-tab workspace)              │  │
│  │                ├── [Skills Tab] SkillGroups + ActionTiles           │  │
│  │                ├── [Generated Tab] GeneratedBulletsPanel            │  │
│  │                └── [Cleanup Tab] UnwantedBulletsPanel               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                  │                                        │
│              multipart/form-data │  (resume file + jobDescription +       │
│                                  │   optional analysisContext JSON)       │
│                                  ▼                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     Express 5 Server (localhost:5011)                     │
│                                                                          │
│  server.js                                                               │
│  ├── cors() — open to all origins                                        │
│  ├── express.json()                                                      │
│  └── /api/analyze → analyzeRoutes.js                                     │
│                                                                          │
│  analyzeRoutes.js                                                        │
│  ├── Multer (memory, 2MB limit, PDF/DOC/DOCX only)                      │
│  ├── POST /                    → analyzeController.analyzeResume         │
│  ├── POST /generate-bullets    → analyzeController.generateBullets       │
│  └── POST /unwanted-bullets    → analyzeController.findUnwantedBullets   │
│                                                                          │
│  analyzeController.js (orchestration)                                    │
│  ├── buildAnalysis(req) — shared pipeline                                │
│  │   ├── resumeParser.extractResumeText(file)                            │
│  │   │   ├── PDF: pdfjs-dist (row reconstruction via coordinates)       │
│  │   │   └── DOCX: mammoth.extractRawText                                │
│  │   ├── resumeStructurer.buildResumeJSON(text)                          │
│  │   │   └── Section split → summary, skills, highlights, experience     │
│  │   ├── aiJDClassifier.classifyJDWithAI(jd)     ──┐                    │
│  │   ├── aiSkillExtractor.extractAtomicSkills()  ──┤ OpenAI gpt-4o-mini │
│  │   └── matchEngine.computeMatch(resume, jd)     ──┤ (temperature: 0)  │
│  │                                                  │                    │
│  └── [Advanced endpoints reuse analysisContext]  ───┘                    │
│      └── resumeOptimizer                                                │
│          ├── generateMissingSkillBullets() ── OpenAI                     │
│          │   └── Post-processing: coverage validation, repair, fallback  │
│          └── identifyUnwantedBullets()     ── OpenAI                     │
│              └── Post-processing: align to existing resume text          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Frontend Architecture

### 5.1 Entry Point

`client/src/main.tsx` renders `<App />` inside `<StrictMode>`, mounting to `#root` in `index.html`. Tailwind CSS is imported in `index.css`.

### 5.2 Component Hierarchy

```
AnalyzerPage  (manages ALL state via useState/useMemo)
│
├── AnalyzerHeader
│   └── StatPill (×3: Formats, Mode, Output)
│
├── WorkspaceToolbar         [visible only after analysis]
│
├── AnalyzerInputForm        [hidden in focus mode, sticky on desktop]
│   ├── ResumeUploadCard
│   ├── JobDescriptionCard
│   └── AnalyzeActionBar
│
└── [Results Area]
    ├── ScoreSummaryCard
    │   ├── ScoreRing       (conic-gradient gauge)
    │   └── MetricCard (×2) (Required %, Preferred %)
    │
    ├── RoleSummaryCard      [visible only after analysis]
    │
    └── AdvancedInsightsPanel  [visible when toggled]
        ├── [Tab Bar: Skills | Generated | Cleanup]
        │   └── InsightTabButton (×3)
        │
        ├── [Skills Tab]
        │   ├── SkillGroup (×4: Required, Preferred, Missing Required, Missing Preferred)
        │   │   └── Chip (×N, neutral or danger intent)
        │   └── ActionTile (×2: Generate Bullets, Find Cleanup)
        │
        ├── [Generated Tab]
        │   ├── ActionTile (Generate / Regenerate)
        │   └── GeneratedBulletsPanel
        │       └── Chip (×N, success intent — coversSkills tags)
        │
        └── [Cleanup Tab]
            ├── ActionTile (Find / Review again)
            └── UnwantedBulletsPanel
```

### 5.3 State Management

All state lives in `AnalyzerPage.tsx` with no external state library:

| State Variable | Type | Purpose |
|----------------|------|---------|
| `resumeFile` | `File \| null` | Uploaded resume file object |
| `jobDescription` | `string` | JD textarea content |
| `result` | `AnalyzeResponse \| null` | Full API response from `/api/analyze` |
| `isLoading` | `boolean` | Primary analysis loading state |
| `advancedAction` | `AdvancedAction \| null` | Which advanced action is running |
| `error` | `string` | Primary analysis error message |
| `advancedError` | `string` | Advanced action error message |
| `showAdvanced` | `boolean` | Whether AdvancedInsightsPanel is visible |
| `isInputPanelCollapsed` | `boolean` | Focus mode (inputs hidden for full-width results) |
| `activeInsightTab` | `InsightTab` | Current tab: `'skills'` \| `'generated'` \| `'cleanup'` |
| `generatedBullets` | `GenerateBulletsResponse \| null` | Generated bullet results |
| `unwantedBullets` | `UnwantedBulletsResponse \| null` | Unwanted bullet results |

Derived values (recalculated on each render, `useMemo` for `scoreTone`):

| Value | Computation |
|-------|-------------|
| `canAnalyze` | `resumeFile && jobDescription.trim() && !isLoading` |
| `canRunAdvancedAction` | `resumeFile && jobDescription.trim() && result && !advancedAction` |
| `missingTotal` | `missingRequired.length + missingPreferred.length` |
| `jobDescriptionWordCount` | `jobDescription.trim().split(/\s+/).filter(Boolean).length` |
| `isFocusMode` | `result && isInputPanelCollapsed` |
| `scoreTone` | `≥80` green, `≥60` amber, else red |

### 5.4 TypeScript Types (`client/src/types/analyzer.ts`)

```typescript
type AnalyzeResponse = {
  message: string
  resume: { summary: string; skills: string[] }
  jobDescription: {
    detectedRole: string
    jobDomain?: string
    requiredSkills: string[]
    preferredSkills: string[]
    responsibilities?: string[]
  }
  match: {
    requiredMatch: number
    preferredMatch: number
    overallMatch: number
    matchedRequired?: string[]
    missingRequired: string[]
    matchedPreferred?: string[]
    missingPreferred: string[]
  }
}

type GeneratedBullet = {
  targetCompany: string
  targetHeading: string
  coversSkills: string[]
  bullet: string
  reason: string
}

type GenerateBulletsResponse = {
  suggestedBullets: GeneratedBullet[]
  coverage?: { totalMissingSkills: number; coveredSkills: string[] }
}

type UnwantedBullet = {
  company: string
  heading: string
  bullet: string
  reason: string
  riskLevel: string
  atsImpact?: string
}

type UnwantedBulletsResponse = { unwantedBullets: UnwantedBullet[] }

type AdvancedAction = 'generate' | 'unwanted'

type InsightTab = 'skills' | 'generated' | 'cleanup'
```

---

## 6. Backend Architecture

### 6.1 Entry Point (`server.js`)

Concise Express 5 setup:

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const analyzeRoutes = require('./routes/analyzeRoutes');

const app = express();
app.use(cors());                    // ⚠️ Open to all origins
app.use(express.json());
app.use('/api/analyze', analyzeRoutes);

const PORT = process.env.PORT || 5011;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
```

### 6.2 Route Definitions (`analyzeRoutes.js`)

Three endpoints, all using `multer` with memory storage:

| Endpoint | Method | Handler | Auth |
|----------|--------|---------|------|
| `/api/analyze` | POST | `analyzeController.analyzeResume` | None |
| `/api/analyze/generate-bullets` | POST | `analyzeController.generateBullets` | None |
| `/api/analyze/unwanted-bullets` | POST | `analyzeController.findUnwantedBullets` | None |

**Multer configuration:**
- Storage: **memory** (file never written to disk)
- Field name: `resume`
- Max file size: **2 MB**
- Allowed MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 6.3 Controller (`analyzeController.js`)

**`buildAnalysis(req, options)`** — The shared pipeline that all endpoints use:

```
buildAnalysis(req)
  │
  ├── Validate req.file exists (400 if missing)
  ├── Validate req.body.jobDescription is non-empty (400 if missing)
  │
  ├── resumeParser.extractResumeText(req.file)
  │   └── Returns raw text string
  │
  ├── resumeStructurer.buildResumeJSON(text)
  │   └── Returns { summary, skills, highlights, experience, other }
  │
  ├── [If analysisContext provided, parse & return cached JD + match]
  │
  ├── aiJDClassifier.classifyJDWithAI(jobDescription)        ← OpenAI call #1
  │   └── Returns { detectedRole, jobDomain, requiredSkills, preferredSkills, responsibilities }
  │
  ├── aiSkillExtractor.extractAtomicSkills(requiredSkills)   ← OpenAI call #2
  │   └── Normalizes required skill phrases
  │
  ├── aiSkillExtractor.extractAtomicSkills(preferredSkills)  ← OpenAI call #3
  │   └── Normalizes preferred skill phrases
  │
  ├── [Deduplicate: preferredSkills = preferred - required]
  │
  └── matchEngine.computeMatch(resume, normalizedJD)         ← OpenAI call #4
      └── Returns { requiredMatch, preferredMatch, overallMatch, matched/missing arrays }
```

**`analyzeResume(req, res)`** — Full pipeline, returns complete result.

**`generateBullets(req, res)`** — Re-parses `analysisContext`, skips JD classification and match computation, calls `resumeOptimizer.generateMissingSkillBullets()`.

**`findUnwantedBullets(req, res)`** — Re-parses `analysisContext`, skips JD classification and match computation, calls `resumeOptimizer.identifyUnwantedBullets()`.

**Helper functions in controller (duplicated from matchEngine):**
- `uniqueSkills(skills)` — dedup by case-insensitive key
- `removeSkills(skills, toRemove)` — filter out one skill list from another
- `cleanSkill(skill)` — trim and normalize whitespace
- `parseAnalysisContext(rawContext)` — parse and validate analysisContext from frontend

### 6.4 Services

#### `openaiClient.js`
```javascript
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
module.exports = client;
```
Single shared instance. All AI services import this.

#### `resumeParser.js`
- **PDF:** Uses `pdfjs-dist/legacy/build/pdf.mjs` dynamic import. Iterates through all pages, extracts text items with their coordinates, reconstructs visual rows by y-coordinate (3px tolerance), sorts rows top-to-bottom and items left-to-right, joins with newlines.
- **DOCX:** Uses `mammoth.extractRawText({ buffer })`.
- **DOC:** Throws error "Please upload DOCX instead of DOC".

#### `resumeStructurer.js`
Most complex pure-JS service (~400 lines). Converts raw text to structured JSON:

1. `normalizeResumeText()` — normalize whitespace, bullets, special characters
2. `splitSections()` — scan line by line, detect section headers via `getSectionName()`
3. `buildSummary()` — join summary lines with space
4. `extractSkills()` — split on commas, pipes, bullets, semicolons; filter categories; normalize aliases
5. `extractHighlightSkills()` — regex match for known skills in highlights text
6. `extractHighlights()` — parse bullet and paragraph highlights, assign UUIDs
7. `extractExperience()` — the most complex function:
   - Detects role headings (job title + date range)
   - Detects client/company headings (`Client: ...`)
   - Groups bullets under the correct company
   - Handles tech stack lines (`Tech Stack: ...`)
   - Handles wrapped bullet continuation lines
   - Handles DOCX paragraph-style bullets (no bullet symbols)

**Supported section headers:**
- Summary: `summary`, `professional summary`, `career summary`, `profile`
- Skills: `skills`, `technical skills`, `core competencies`
- Highlights: `key highlights`, `highlights`, `career highlights`, `achievements`, `accomplishments`
- Experience: `experience`, `work experience`, `professional experience`, `employment history`, `project`, `projects`
- Other: `education`, `certification`, `certifications`, `license`, `licenses`, `award`, `awards`

**Skill alias normalization:**
```
javascript → JavaScript
typescript → TypeScript
reactjs → React
nodejs → Node.js
spring boot → Spring Boot
rest api → REST APIs
ci-cd → CI/CD
power bi → Power BI
```

**Output shape:**
```json
{
  "summary": "string",
  "skills": ["string"],
  "highlights": [{ "id": "uuid", "text": "string" }],
  "experience": [{
    "id": "uuid",
    "company": "string",
    "role": "string",
    "heading": "string",
    "bullets": [{ "id": "uuid", "text": "string" }],
    "techStack": ["string"]
  }],
  "other": ["string"]
}
```

#### `aiJDClassifier.js`
Calls OpenAI with a domain-agnostic system prompt. Extracts:
- `detectedRole` — best concise job title
- `jobDomain` — Software, Healthcare, Accounting, Sales, Marketing, HR, etc.
- `requiredSkills` — must-have skills, tools, certifications, credentials
- `preferredSkills` — nice-to-have skills
- `responsibilities` — actionable duties

Stripes markdown wrappers (` ```json `), logs raw and parsed output to console for debugging.

#### `aiSkillExtractor.js`
Takes JD skill phrases and the full job description, calls OpenAI to normalize them into ATS-friendly keywords. Uses `detectedRole` and `jobDomain` as context to avoid forcing software terminology on non-software roles.

#### `matchEngine.js`
Two-phase matching:

**Phase 1 — Deterministic (free):**
- `hasResumeEvidence()` checks if the skill or any alias appears in the resume corpus
- Aliases are hardcoded for common skills (e.g., `"restful apis"` → `["RESTful APIs", "REST APIs", "APIs"]`)
- Skills matched deterministically are never sent to AI

**Phase 2 — AI Semantic (costs tokens):**
- Only unresolved skills go to OpenAI gpt-4o-mini
- Prompt includes detected role/domain as context
- Returns `{ matched: [], missing: [] }`

**Scoring formula:**
```
requiredMatch = matchedRequired / totalRequired * 100
preferredMatch = matchedPreferred / totalPreferred * 100
overallMatch = requiredMatch * 0.7 + preferredMatch * 0.3
```

**Resume corpus** is built by concatenating: summary + skills + highlights text + experience bullets + tech stacks + other text.

#### `resumeOptimizer.js`
Two functions, both calling OpenAI:

**`generateMissingSkillBullets(resume, jd, match)`:**
1. Gather all missing required + preferred skills
2. Build a prompt instructing GPT to generate bullets that cover every missing skill
3. Normalize and validate the response
4. `repairMissingCoverageIfNeeded()` — if any skills weren't covered, make a second OpenAI call
5. `enforceExactKeywordCoverage()` — filter out bullets that don't contain the exact keyword
6. `buildFallbackCoverageBullets()` — if still uncovered, generate template bullets as last resort
7. Sort by target company/heading

**`identifyUnwantedBullets(resume, jd, match)`:**
1. Build prompt with work experience bullets + JD context
2. AI returns bullets that are safe to remove
3. `alignUnwantedBulletsToResume()` — match AI-returned bullet text to actual resume bullet text via substring comparison

---

## 7. End-to-End Request Flows

### 7.1 Primary Analysis Flow

```
[User]
  │
  ├── 1. Uploads resume (PDF/DOCX)
  ├── 2. Pastes job description text
  ├── 3. Clicks "Analyze ATS score"
  │
  ▼
[Frontend: handleSubmit()]
  │
  ├── Validates file + JD exist
  ├── Sets isLoading = true
  ├── Builds FormData: { resume: File, jobDescription: string }
  ├── POST fetch('http://localhost:5011/api/analyze', { body: formData })
  │
  ▼
[Backend: analyzeRoutes.js]
  │
  ├── Multer validates file type & size (2MB max)
  ├── Routes to analyzeController.analyzeResume
  │
  ▼
[Backend: analyzeController.buildAnalysis()]
  │
  ├── resumeParser.extractResumeText(file)
  │   ├── PDF path: pdfjs-dist → coordinate-based row reconstruction → raw text
  │   └── DOCX path: mammoth.extractRawText → raw text
  │   ⏱️ ~100-500ms (local, no API)
  │
  ├── resumeStructurer.buildResumeJSON(text)
  │   ├── Normalize whitespace, bullets
  │   ├── Split into sections via header detection
  │   ├── Extract summary, skills, highlights, experience
  │   ⏱️ ~10-50ms (local, no API)
  │
  ├── aiJDClassifier.classifyJDWithAI(jd)
  │   └── OpenAI gpt-4o-mini → { detectedRole, jobDomain, requiredSkills, preferredSkills, responsibilities }
  │   ⏱️ ~500-2000ms (API call)
  │
  ├── aiSkillExtractor.extractAtomicSkills(requiredSkills, jd)
  │   └── OpenAI gpt-4o-mini → normalized required skill keywords
  │   ⏱️ ~500-2000ms (API call, sequential)
  │
  ├── aiSkillExtractor.extractAtomicSkills(preferredSkills, jd)
  │   └── OpenAI gpt-4o-mini → normalized preferred skill keywords
  │   ⏱️ ~500-2000ms (API call, sequential)
  │
  ├── [Deduplicate skills: preferred = preferred - required]
  │
  ├── matchEngine.computeMatch(resume, normalizedJD)
  │   ├── Build resume corpus from all sections
  │   ├── Deterministic matching (alias-based, no API)
  │   └── AI semantic matching for unresolved skills
  │       └── OpenAI gpt-4o-mini → { matched: [], missing: [] }
  │   ⏱️ ~500-2000ms (API call)
  │
  ▼
[Backend → Frontend Response]
  │
  ├── 200 JSON: { message, resume, jobDescription, match }
  │
  ▼
[Frontend: setResult(data)]
  │
  ├── setIsInputPanelCollapsed(true)  → enters focus mode
  ├── setShowAdvanced(true)           → shows AdvancedInsightsPanel
  ├── setActiveInsightTab('skills')   → default tab
  │
  ▼
[User sees:]
  ├── ScoreSummaryCard (Overall %, Required %, Preferred %)
  ├── RoleSummaryCard (Detected role, job domain, toggle button)
  └── AdvancedInsightsPanel
      ├── Skills tab: Required, Preferred, Missing Required, Missing Preferred chips
      ├── Action: "Generate bullet points"
      └── Action: "Identify unwanted bullet points"

⏱️ Total time: ~2-8 seconds (dominated by 4 sequential OpenAI calls)
💰 Total cost: 4× gpt-4o-mini calls (~$0.001-0.01 depending on JD length)
```

### 7.2 Generate Bullets Flow

```
[User clicks "Generate bullets"]
  │
  ▼
[Frontend: handleAdvancedAction('generate')]
  │
  ├── Sets advancedAction = 'generate'
  ├── Sets activeInsightTab = 'generated'
  ├── Builds FormData with analysisContext:
  │   {
  │     resume: File,
  │     jobDescription: string,
  │     analysisContext: JSON.stringify({
  │       jobDescription: result.jobDescription,
  │       match: result.match
  │     })
  │   }
  ├── POST fetch('http://localhost:5011/api/analyze/generate-bullets', { body: formData })
  │
  ▼
[Backend: analyzeController.generateBullets()]
  │
  ├── buildAnalysis(req, { useAnalysisContext: true })
  │   ├── Re-parses resume file (still extracts text + structures)
  │   ├── Parses analysisContext JSON → skips JD classify + skill extract + match
  │   ⏱️ ~100-500ms (resume parsing only)
  │
  ├── resumeOptimizer.generateMissingSkillBullets(resume, jd, match)
  │   ├── OpenAI: generate bullets covering missing skills  ⏱️ ~1-3s
  │   ├── Normalize + validate response
  │   ├── [If missing coverage] repairMissingCoverageIfNeeded()
  │   │   └── OpenAI: second call for uncovered skills    ⏱️ ~1-3s
  │   ├── enforceExactKeywordCoverage() — validate every coversSkill appears in bullet
  │   ├── [If still missing] buildFallbackCoverageBullets() — template bullets
  │   └── Sort by target company
  │
  ▼
[Backend → Frontend Response]
  │
  ├── 200 JSON: { suggestedBullets: [...], coverage: {...} }
  │
  ▼
[Frontend: setGeneratedBullets(data), setAdvancedAction(null)]
  │
  ▼
[User sees:]
  ├── Coverage summary: "Covers X of Y missing skills"
  └── Generated bullet cards with:
      ├── Target section (company + heading)
      ├── Bullet text
      ├── Covered skill chips (green)
      └── Reason text

💰 Cost: 1-2× gpt-4o-mini calls
```

### 7.3 Find Unwanted Bullets Flow

```
[User clicks "Find cleanup items"]
  │
  ▼
[Frontend: handleAdvancedAction('unwanted')]
  │
  ├── Sets advancedAction = 'unwanted'
  ├── Sets activeInsightTab = 'cleanup'
  ├── Builds FormData with analysisContext (same structure)
  ├── POST fetch('http://localhost:5011/api/analyze/unwanted-bullets', { body: formData })
  │
  ▼
[Backend: analyzeController.findUnwantedBullets()]
  │
  ├── buildAnalysis(req, { useAnalysisContext: true })
  │   └── Same resume re-parse, skip JD/match via analysisContext
  │   ⏱️ ~100-500ms
  │
  ├── resumeOptimizer.identifyUnwantedBullets(resume, jd, match)
  │   ├── OpenAI: review work experience bullets, identify low-value ones
  │   │   ⏱️ ~1-3s
  │   ├── normalizeUnwantedBullet() — validate response
  │   └── alignUnwantedBulletsToResume() — match AI text to actual resume text
  │
  ▼
[Backend → Frontend Response]
  │
  ├── 200 JSON: { unwantedBullets: [...] }
  │
  ▼
[Frontend: setUnwantedBullets(data), setAdvancedAction(null)]
  │
  ▼
[User sees:]
  └── Unwanted bullet cards with:
      ├── Company + heading
      ├── Full bullet text
      ├── Risk level badge
      ├── Reason for removal
      └── ATS impact estimate

💰 Cost: 1× gpt-4o-mini call
```

---

## 8. API Contracts

### 8.1 Analyze Resume

```http
POST /api/analyze
Content-Type: multipart/form-data
```

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resume` | File | ✅ | PDF, DOC, or DOCX (max 2 MB) |
| `jobDescription` | String | ✅ | Full job description text |

**Success response (200):**

```json
{
  "message": "Resume + JD analyzed successfully (AI powered)",
  "resume": {
    "summary": "Experienced full-stack developer with 8 years...",
    "skills": ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"]
  },
  "jobDescription": {
    "detectedRole": "Senior Full Stack Developer",
    "jobDomain": "Software",
    "requiredSkills": ["React", "TypeScript", "Node.js", "AWS"],
    "preferredSkills": ["Docker", "Kubernetes", "GraphQL"],
    "responsibilities": [
      "Design and implement RESTful APIs",
      "Lead frontend architecture decisions"
    ]
  },
  "match": {
    "requiredMatch": 75,
    "preferredMatch": 33,
    "overallMatch": 62,
    "matchedRequired": ["React", "TypeScript", "Node.js"],
    "missingRequired": ["AWS"],
    "matchedPreferred": ["Docker"],
    "missingPreferred": ["Kubernetes", "GraphQL"]
  }
}
```

**Error responses:**

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ error: "Resume file is required" }` | No file uploaded |
| 400 | `{ error: "Job description is required" }` | Empty jobDescription |
| 400 | `{ error: "Only PDF, DOC, DOCX allowed" }` | Wrong file type |
| 413 | (Multer default) | File exceeds 2 MB |
| 500 | `{ error: "AI JD analysis failed" }` | OpenAI error or unexpected failure |

### 8.2 Generate Bullet Points

```http
POST /api/analyze/generate-bullets
Content-Type: multipart/form-data
```

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resume` | File | ✅ | Same file as primary analysis |
| `jobDescription` | String | ✅ | Same JD text |
| `analysisContext` | String | ✅ | `JSON.stringify({ jobDescription, match })` from `/api/analyze` response |

**Success response (200):**

```json
{
  "message": "Missing-skill bullet suggestions generated successfully",
  "jobDescription": { "detectedRole": "...", "requiredSkills": [...], ... },
  "match": {
    "missingRequired": ["AWS"],
    "missingPreferred": ["Kubernetes", "GraphQL"]
  },
  "suggestedBullets": [
    {
      "targetCompany": "Acme Corp",
      "targetHeading": "Client: Acme Corp, San Francisco, CA",
      "coversSkills": ["AWS"],
      "bullet": "Designed and deployed cloud infrastructure on AWS...",
      "reason": "This bullet explicitly covers AWS..."
    }
  ],
  "coverage": {
    "totalMissingSkills": 3,
    "coveredSkills": ["AWS", "Kubernetes", "GraphQL"]
  }
}
```

**Notes:**
- If `analysisContext` is missing or malformed, the backend falls back to re-running the full pipeline
- Each bullet's `coversSkills` array lists only skills that appear verbatim in the bullet text
- Coverage is validated post-generation; missing coverage triggers a repair pass

### 8.3 Identify Unwanted Bullets

```http
POST /api/analyze/unwanted-bullets
Content-Type: multipart/form-data
```

**Form fields:** Same as generate-bullets.

**Success response (200):**

```json
{
  "message": "Unwanted resume bullets identified successfully",
  "jobDescription": { ... },
  "match": { "overallMatch": 62, ... },
  "unwantedBullets": [
    {
      "company": "OldEmployer Inc",
      "heading": "Client: OldEmployer Inc, Austin, TX",
      "bullet": "Organized team building events and game nights...",
      "reason": "This bullet describes social activities...",
      "riskLevel": "low",
      "atsImpact": "unlikely to reduce ATS score"
    }
  ]
}
```

**Notes:**
- Only work experience bullets are reviewed (not summary, highlights, or skills)
- The AI is instructed to be conservative — only truly low-value bullets are returned
- `alignUnwantedBulletsToResume()` matches AI-returned text to actual resume text via substring comparison
- Duplicate matches are deduplicated

---

## 9. AI Pipeline Deep-Dive

### 9.1 OpenAI Configuration

All AI calls use the shared client from `openaiClient.js`:

```javascript
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

**Model:** `gpt-4o-mini` (used in all services)  
**Temperature:** `0` (deterministic outputs for reproducible results)  
**Response format:** JSON (extracted via regex `/\{[\s\S]*\}/` from raw text)

### 9.2 Services Using OpenAI

| Service | Calls per Analysis | Input | Output |
|---------|-------------------|-------|--------|
| `aiJDClassifier` | 1× | Full JD text | detectedRole, jobDomain, requiredSkills, preferredSkills, responsibilities |
| `aiSkillExtractor` | 2× (required + preferred) | Skill phrases + JD + role/domain | Normalized skill keywords |
| `matchEngine` | 1× (only for unresolved skills) | Resume corpus + unresolved skills + role/domain | matched[], missing[] |
| `resumeOptimizer.generateMissingSkillBullets` | 1-2× (optional) | Resume JSON + missing skills + JD | suggestedBullets[], coverage{} |
| `resumeOptimizer.identifyUnwantedBullets` | 1× (optional) | Work experience bullets + JD + match | unwantedBullets[] |

**Per-analysis AI cost:** 4 calls (minimum) to 6 calls (maximum with repair pass).

### 9.3 Deterministic Pre-Filtering Strategy

The `matchEngine.js` uses a cost-saving two-phase approach:

**Phase 1 (free — no API call):**
- Build resume corpus as a single string
- For each skill, check if the skill or any known alias appears in the corpus via substring matching
- Matched skills are immediately confirmed — no AI needed

**Phase 2 (API call):**
- Only skills NOT matched in Phase 1 are sent to OpenAI for semantic matching
- The AI understands synonyms, equivalent technologies, and domain-specific term mappings

**Example:** If `React` appears in the resume, and `React` is a required JD skill, it's matched deterministically. If `CI/CD` is a required skill and only `ci-cd pipeline automation` appears in the resume, the deterministic alias `"ci/cd pipelines" → ["CI/CD", "CI-CD", "CI/CD pipelines"]` catches it. Only truly ambiguous matches (like "accounting software" vs "QuickBooks") go to AI.

### 9.4 Bullet Generation Quality Guarantees

The `resumeOptimizer.js` implements three tiers of coverage assurance:

1. **Primary generation:** OpenAI generates bullets for all missing skills
2. **Coverage check:** `findMissingExactSkills()` identifies skills whose keywords don't appear verbatim in any generated bullet
3. **Repair pass:** If coverage gaps exist, a second OpenAI call targets only uncovered skills
4. **Fallback:** If OpenAI still misses a skill, `buildFallbackCoverageBullets()` creates a template bullet:  
   `"Applied {skill1}, {skill2}, and {skill3} across {role} workflows to support {domain} requirements and improve delivery alignment."`

---

## 10. Scoring Logic

### 10.1 Formula

```
Required Match %  = (matchedRequired.length / totalRequired.length) × 100
Preferred Match % = (matchedPreferred.length / totalPreferred.length) × 100
Overall Match %   = round(Required% × 0.7 + Preferred% × 0.3)
```

**Weights:** Required skills contribute **70%**, preferred skills contribute **30%**.

**Edge case:** If totalRequired is 0, requiredMatch = 100. If totalPreferred is 0, preferredMatch = 100.

### 10.2 Frontend Color Coding

| Score Range | Color | CSS Classes |
|-------------|-------|-------------|
| ≥ 80% | Green | `from-emerald-400 to-teal-400 text-emerald-300` |
| 60–79% | Amber | `from-amber-400 to-orange-400 text-amber-300` |
| < 60% | Red | `from-rose-400 to-red-400 text-rose-300` |

### 10.3 Deduplication Rules

- **Preferred ∩ Required:** Skills appearing in both are removed from preferred (required takes priority)
- **Missing Preferred ∩ Missing Required:** Missing preferred removes overlap with missing required
- **Matched Preferred ∩ Matched Required:** Already handled by the first rule

---

## 11. Setup & Running Locally

### 11.1 Prerequisites

- Node.js (v18+ recommended for `pdfjs-dist` compatibility)
- npm
- An OpenAI API key with access to `gpt-4o-mini`

### 11.2 Installation

```bash
# Clone the repository (if not already cloned)
cd Ai_Resume_Analyzer

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Return to project root
cd ..
```

### 11.3 Configuration

Create `server/.env`:

```env
OPENAI_API_KEY=sk-your-actual-openai-api-key
PORT=5011
```

`PORT` is optional — defaults to 5011.

### 11.4 Starting

**Terminal 1 — Backend:**
```bash
cd server
npm run dev     # Uses nodemon for auto-restart
```

Backend available at: `http://localhost:5011`

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev     # Vite dev server with HMR
```

Frontend available at: `http://127.0.0.1:5173` (or `localhost:5173`)

### 11.5 Building for Production

```bash
cd client
npm run build       # TypeScript check + Vite build
npm run preview     # Preview production build locally
```

Backend runs the same in dev and production (`node server.js`).

---

## 12. Environment Variables

| Variable | Required | Default | Location | Description |
|----------|----------|---------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | — | `server/.env` | OpenAI API key (starts with `sk-`) |
| `PORT` | ❌ No | `5011` | `server/.env` | Backend server port |

No frontend environment variables are currently configured. The API URL is hardcoded to `http://localhost:5011` in `AnalyzerPage.tsx`.

---

## 13. Component Inventory

### 13.1 Page Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `App` | `App.tsx` | Root — renders `AnalyzerPage` |
| `AnalyzerPage` | `pages/AnalyzerPage.tsx` | All state, API calls, orchestration, layout |

### 13.2 Analyzer Components (17 total)

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| `AnalyzerHeader` | `AnalyzerHeader.tsx` | `compact: boolean` | Title, tagline, stat pills |
| `AnalyzerInputForm` | `AnalyzerInputForm.tsx` | `resumeFile, jobDescription, wordCount, error, canAnalyze, isLoading, onSubmit, onFileChange, onJobDescriptionChange` | Form wrapper with child cards |
| `ResumeUploadCard` | `ResumeUploadCard.tsx` | `resumeFile, onFileChange` | File input with drag-target styling |
| `JobDescriptionCard` | `JobDescriptionCard.tsx` | `jobDescription, wordCount, onChange` | JD textarea with word count badge |
| `AnalyzeActionBar` | `AnalyzeActionBar.tsx` | `canAnalyze, isLoading` | Submit button + helper text |
| `WorkspaceToolbar` | `WorkspaceToolbar.tsx` | `isFocusMode, onToggle` | Focus mode toggle bar |
| `ScoreSummaryCard` | `ScoreSummaryCard.tsx` | `overallMatch, requiredMatch, preferredMatch, missingTotal, scoreTone, isFocusMode` | Score ring + metric cards |
| `ScoreRing` | `ScoreRing.tsx` | `score, tone` | Conic-gradient circular gauge |
| `MetricCard` | `MetricCard.tsx` | `label, value` | Stat card (Required %, Preferred %) |
| `RoleSummaryCard` | `RoleSummaryCard.tsx` | `detectedRole, jobDomain, showAdvanced, isFocusMode, onToggleAdvanced` | Detected role + toggle |
| `AdvancedInsightsPanel` | `AdvancedInsightsPanel.tsx` | `result, activeTab, onTabChange, canRunAdvancedAction, advancedAction, advancedError, generatedBullets, unwantedBullets, onGenerate, onFindUnwanted, wide` | 3-tab workspace container |
| `SkillGroup` | `SkillGroup.tsx` | `title, items, intent` | Skill chip list with count |
| `Chip` | `Chip.tsx` | `children, intent` | Individual skill chip (neutral/danger/success) |
| `GeneratedBulletsPanel` | `GeneratedBulletsPanel.tsx` | `result, wide, embedded` | Renders generated bullet cards |
| `UnwantedBulletsPanel` | `UnwantedBulletsPanel.tsx` | `result, wide, embedded` | Renders unwanted bullet cards |
| `InsightTabButton` | `InsightTabButton.tsx` | `active, label, count, onClick` | Individual tab with count badge |
| `ActionTile` | `ActionTile.tsx` | `title, description, buttonLabel, disabled, onClick, tone` | Action card (generate / cleanup) |
| `StatPill` | `StatPill.tsx` | `label, value` | Small stat display |
| `EmptyInsightState` | `EmptyInsightState.tsx` | `text` | Empty state message |

---

## 14. CSS Design System

### 14.1 Theme

- **Mode:** Dark only (no light mode)
- **Background:** `#0b1220` (deep navy)
- **Text:** `text-slate-100` / `text-slate-50` (near-white)
- **Accent:** Emerald (`#34d399`) for success/actions, Amber (`#f59e0b`) for warnings, Rose for errors
- **Borders:** `rgba(71, 85, 105, 0.72)` (slate-600 translucent)

### 14.2 Custom Component Classes (`index.css`)

| Class | Description |
|-------|-------------|
| `.glass-panel` | Translucent card with backdrop blur, border, shadow |
| `.depth-panel` | Glass panel with 3D inset highlights and gradient overlays |
| `.focus-toolbar` | Workspace toggle bar with multi-gradient background |
| `.focus-toggle` | Emerald action button (Show/Hide inputs) |
| `.button-primary` | White (was black in light mode) — main actions |
| `.button-secondary` | Outlined dark — secondary actions |
| `.score-shell` | Perspective container for 3D score ring |
| `.score-dial` | Conic-gradient gauge with 3D tilt and inset shadows |
| `.insight-workbench` | Gradient background for advanced panel |
| `.insight-tabbar` | 3-column grid tab bar with inset border |
| `.insight-tab` | Individual tab with hover/active states |
| `.insight-tab.is-active` | Active tab with emerald border + elevated background |
| `.insight-tab-count` | Pill badge for tab counts |
| `.insight-section` | Subtle card for skill groups |
| `.action-grid` | 2-column (desktop) grid for action tiles |
| `.action-tile` | Card with hover elevation |
| `.action-tile-success` | Emerald-tinted border |
| `.action-tile-warning` | Amber-tinted border |
| `.empty-insight` | Muted empty state card |
| `.result-card` | Gradient card for bullet results |

### 14.3 Utilities

| Class | Description |
|-------|-------------|
| `.app-aurora` | Full-viewport gradient background with repeating lines, gradient mask, and slow drift animation |
| `.animate-rise` | Fade-in + slide-up entrance animation |
| `.shimmer` | Left-to-right shimmer loading animation |
| `.loader-dot` | Pulsing dot for loading state |
| `.pop-in` | Scale-in entrance animation |

### 14.4 Accessibility

- `@media (prefers-reduced-motion: reduce)` disables all animations, transitions, and scroll behaviors
- Tab bar uses `role="tablist"` + `role="tab"` + `aria-selected`
- Buttons have `aria-label` where needed (focus toggle)
- File input is visually hidden (`.sr-only`) with a styled label

---

## 15. Known Issues & Limitations

### 15.1 Parsing Limitations

| Issue | Impact | Workaround |
|-------|--------|------------|
| Scanned/image-only PDFs not supported | OCR would be needed — current pdfjs extracts only embedded text | User must provide text-based PDF |
| DOC files rejected | Older Word format not supported | User must save as DOCX |
| Multi-column PDF layouts may jumble text | Row reconstruction assumes single-column reading order | Results may have scrambled text |
| Section header detection is exact-match only | `"Technical Skills & Tools"` won't match `"technical skills"` | Headers must match exactly |
| No PDF table extraction | Tabular resume formats may lose structure | Best results with standard resume layouts |

### 15.2 Functional Limitations

| Issue | Impact |
|-------|--------|
| No persistent storage | Results lost on page refresh |
| No user accounts | No history, no saved analyses |
| Scoring is flat-weighted | All required skills equally weighted, all preferred equally weighted |
| No skill importance ranking | "React" and "Microsoft Office" have equal weight as required skills |
| No experience level matching | Junior and Senior versions of the same role have identical analysis |
| Generated bullets need human review | AI may produce plausible-but-inaccurate content |
| Unwanted bullet detection is intentionally conservative | May return empty results even when there are removable bullets |

### 15.3 Operational Limitations

| Issue | Impact |
|-------|--------|
| Local-only deployment | No production hosting configuration |
| No CI/CD | Manual testing only |
| No monitoring/logging | Errors only go to console |
| No error tracking | No Sentry/Bugsnag integration |
| OpenAI dependency | Entire pipeline fails without internet/API access |

---

## 16. Security Posture

### 16.1 Current State

| Aspect | Status | Risk Level |
|--------|--------|------------|
| Authentication | ❌ None | 🔴 High |
| Authorization | ❌ None | 🔴 High |
| CORS | ❌ Open (`cors()` with no options) | 🟡 Medium |
| Rate Limiting | ❌ None | 🔴 High |
| Input Validation | ⚠️ Partial (Multer file type/size only) | 🟡 Medium |
| API Key Protection | ✅ `.env` file, `.gitignore` | 🟢 Low |
| HTTPS | ❌ HTTP only | 🟡 Medium |
| File Upload Limits | ✅ 2 MB max | 🟢 Low |
| File Upload Types | ✅ PDF/DOC/DOCX only | 🟢 Low |
| Memory Storage | ✅ Files never written to disk | 🟢 Low |
| Dependency Vulnerabilities | ❌ No audit tool configured | 🟡 Medium |

### 16.2 Specific Concerns

1. **API cost abuse:** With no rate limiting, an attacker could send thousands of requests, each triggering up to 6 OpenAI calls. This could result in significant charges.

2. **CORS misconfiguration:** `app.use(cors())` without origin restriction allows any website to call the API from a user's browser, potentially using the user's credentials if the backend is exposed.

3. **No authentication:** Anyone with network access to port 5011 can use all endpoints.

4. **JD text length:** No maximum length on `jobDescription`. An extremely long JD would create an oversized OpenAI prompt, potentially causing errors or excessive token usage.

5. **No sanitization:** While the text goes through JSON serialization for OpenAI prompts, there's no explicit sanitization for special characters or prompt injection.

---

## 17. Performance Analysis

### 17.1 Bottlenecks

| Bottleneck | Detail | Severity |
|------------|--------|----------|
| Sequential OpenAI calls | `classifyJD` → `extractRequired` → `extractPreferred` → `computeMatch` run in series | 🟡 Medium |
| Resume re-parsing | Advanced endpoints re-extract and re-structure the same resume file | 🟡 Medium |
| No caching | Same file + same JD = full re-computation | 🟢 Low (dev-only) |
| Large component tree | All 17 components imported eagerly | 🟢 Low |
| No code splitting | Single bundle | 🟢 Low (dev-only) |

### 17.2 Optimization Opportunities

1. **Parallelize skill extraction:** `extractAtomicSkills(required)` and `extractAtomicSkills(preferred)` are independent and could run in parallel (`Promise.all`).

2. **Cache resume structure:** If `analysisContext` is provided, skip resume parsing too (only needed for `resumeOptimizer`), or cache the parsed resume in memory using a hash of the file buffer.

3. **Streaming responses:** For long-running analyses, use Server-Sent Events or WebSocket to show incremental progress.

4. **Lazy loading:** `React.lazy()` for `GeneratedBulletsPanel` and `UnwantedBulletsPanel` since they're only shown conditionally.

---

## 18. Identified Bugs

### 18.1 Confirmed

| Bug | Location | Description |
|-----|----------|-------------|
| Duplicate helper functions | `matchEngine.js`, `analyzeController.js`, `resumeOptimizer.js` | `uniqueSkills()`, `removeSkills()`, `cleanSkill()`, `skillKey()` are copy-pasted 3× instead of imported from a shared module |
| Hardcoded API URL | `AnalyzerPage.tsx` | `http://localhost:5011` is hardcoded — no env var or config |
| `workflow.txt` is empty | `server/workflow.txt` | Appears to be a leftover file with no content |
| Frontend accepts `.doc` but backend rejects it | `ResumeUploadCard.tsx` accept attribute includes `.doc` | User can select a .doc file, upload it, then get an error |

### 18.2 Potential (Needs Verification)

| Potential Bug | Location | Description |
|---------------|----------|-------------|
| PDF multi-column disorder | `resumeParser.js` | 3px row tolerance may merge separate columns |
| Section header false negatives | `resumeStructurer.js` | Headers with extra words not in the exact-match set won't be detected |
| UUID detected as company name | `resumeOptimizer.js` `cleanTarget()` | If AI returns a UUID as `targetCompany`, it's filtered to empty string — but `normalizeSuggestedBullet` defaults to `"Unassigned"` |
| AnalysisContext parse failure silent | `analyzeController.js` `parseAnalysisContext()` | If JSON parse fails, returns `null` silently — falls back to re-running full pipeline |
| OpenAI response parse failure | Multiple services | If regex `/\{[\s\S]*\}/` fails, returns empty object `{}` — downstream code may crash on missing properties |

---

## 19. Code Quality Observations

### 19.1 Strengths

- ✅ Well-structured service layer with clear separation of concerns
- ✅ Smart deterministic pre-filtering reduces AI costs
- ✅ Defensive coding: null checks, fallbacks, error boundaries on all AI calls
- ✅ Domain-agnostic design — not hardcoded to software roles
- ✅ Multi-format resume support (PDF + DOCX)
- ✅ Post-generation validation with repair and fallback mechanisms
- ✅ Clean React component decomposition (17 focused components)
- ✅ Systematic CSS design system with component classes
- ✅ Accessibility: reduced-motion media query, ARIA roles
- ✅ Comprehensive existing documentation (`PROJECT_DOCUMENTATION.md`)

### 19.2 Areas for Improvement

- ❌ **No tests** — zero test files. No unit, integration, or E2E tests
- ❌ **No TypeScript on backend** — plain CommonJS, no type safety between services
- ❌ **Duplicated utilities** — helper functions repeated across services
- ❌ **No shared constants** — MIME types, section headers, skill aliases are scattered
- ❌ **No config module** — API URL, model name, ports all hardcoded
- ❌ **Console.log debugging** — `aiJDClassifier.js` logs raw OpenAI responses
- ❌ **Empty file** — `server/workflow.txt` serves no purpose
- ❌ **Magic numbers** — 3px row tolerance, 40 char minimum bullets, 0.7/0.3 scoring weights, all inline
- ❌ **No error boundary** — React crash means white screen

---

## 20. Recommendations

### Priority 1 — Security & Cost Protection

1. **Add rate limiting** (`express-rate-limit` or similar)
   - Per-IP limits: 10 requests/minute for `/api/analyze`, 5/minute for advanced endpoints
2. **Restrict CORS** to the frontend origin (`http://localhost:5173`)
3. **Add request body size limit** for `jobDescription` (e.g., 20,000 characters)
4. **Add basic API key authentication** (even a simple shared secret in headers)

### Priority 2 — Code Quality

1. **Extract shared utilities** into `server/utils/skillHelpers.js`
   - `uniqueSkills()`, `removeSkills()`, `cleanSkill()`, `skillKey()`, `cleanString()`, `uniqueStrings()`
2. **Extract constants** into `server/utils/constants.js`
   - MIME types, section headers, skill aliases, scoring weights
3. **Add a config module** (`server/config.js` or env-based)
   - API URL, model name, port, CORS origin, rate limits
4. **Add unit tests** for `resumeStructurer.js` (most complex pure function)
5. **Add integration tests** for `matchEngine.js`

### Priority 3 — Performance

1. **Parallelize** `extractAtomicSkills` calls with `Promise.all`
2. **Cache parsed resume** in memory (keyed by file buffer hash)
3. **Add React.lazy** for panels only shown conditionally

### Priority 4 — Features

1. **Add a React Error Boundary** wrapping `AnalyzerPage`
2. **Make API URL configurable** via environment variable
3. **Add copy-to-clipboard** for generated bullets
4. **Support DOC files** (convert via `libreoffice` or a cloud service)
5. **Add OCR** for scanned PDFs (Tesseract.js or cloud OCR)
6. **Add a "reset" button** to clear everything
7. **Add progress indicators** for multi-step analysis (SSE or polling)

---

## 21. Verification Commands

### Frontend

```bash
cd client
npm run build       # TypeScript compile + Vite production build
npm run lint        # ESLint check
```

### Backend Syntax Checks

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

### Backend Module Load Check (no API calls)

```bash
OPENAI_API_KEY=test node -e 'require("./server/routes/analyzeRoutes"); console.log("✅ server modules loaded")'
```

---

## 22. GitHub Notes

Files excluded by `.gitignore`:
- `node_modules/` (both client and server)
- `dist/`, `build/` outputs
- `.env`, `.env.*` files
- `logs/`, `*.log`
- `uploads/`, `tmp/`, `temp/`
- `coverage/`, `.nyc_output/`
- `.DS_Store`, `Thumbs.db`
- `.idea/`, `.vscode/` (except `extensions.json`)
- `.codex/`, `.agents/`
- SSL certificates (`*.pem`, `*.key`, `*.crt`)

---

> **Document version:** 1.0  
> **Last updated:** June 11, 2026  
> **Author:** Generated via comprehensive repository analysis
