const { v4: uuidv4 } = require("uuid");

/**
 * MAIN ENTRY
 * Converts raw resume text into structured JSON
 */
function buildResumeJSON(rawText) {
  const normalizedText = normalizeResumeText(rawText);
  const sections = splitSections(normalizedText);

  return {
    summary: buildSummary(sections.summary),
    skills: mergeUniqueSkills(
      extractSkills(sections.skills),
      extractHighlightSkills(sections.highlights)
    ),
    highlights: extractHighlights(sections.highlights),
    experience: extractExperience(sections.experience),
    other: sections.other || []
  };
}

/* ----------------------------------------
   SECTION SPLITTER
----------------------------------------- */
function splitSections(text) {
  const sections = {
    summary: [],
    skills: [],
    highlights: [],
    experience: [],
    other: []
  };

  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  let currentSection = "other";

  for (const line of lines) {
    if (isSectionHeader(line)) {
      currentSection = normalizeHeader(line);
      continue;
    }

    sections[currentSection].push(line);
  }

  return sections;
}

function normalizeResumeText(text = "") {
  return String(text)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/([a-z])\s+-\s+([a-z])/g, "$1-$2")
    .replace(/[●▪■]/g, "•")
    .replace(
      /\b(professional summary|career summary|summary|profile|key highlights|career highlights|professional highlights|highlights|key achievements|achievements|accomplishments|technical skills|core competencies|skills|work experience|professional experience|experience|employment history|projects?|education|certifications?|licenses?|awards?)\b\s*:?\s*/gi,
      header => {
        const label = header.trim().replace(/:$/, "");

        if (label === label.toLowerCase()) {
          return header;
        }

        return `\n${label}\n`;
      }
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isSectionHeader(line) {
  return getSectionName(line) !== null;
}

function normalizeHeader(line) {
  return getSectionName(line) || "other";
}

function getSectionName(line) {
  const header = line
    .toLowerCase()
    .replace(/[:\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const summaryHeaders = new Set([
    "summary",
    "professional summary",
    "career summary",
    "profile"
  ]);

  const skillHeaders = new Set([
    "skills",
    "technical skills",
    "core competencies"
  ]);

  const highlightHeaders = new Set([
    "key highlights",
    "highlights",
    "career highlights",
    "professional highlights",
    "key achievements",
    "achievements",
    "accomplishments"
  ]);

  const experienceHeaders = new Set([
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "project",
    "projects"
  ]);

  const otherHeaders = new Set([
    "education",
    "certification",
    "certifications",
    "license",
    "licenses",
    "award",
    "awards"
  ]);

  if (summaryHeaders.has(header)) return "summary";
  if (skillHeaders.has(header)) return "skills";
  if (highlightHeaders.has(header)) return "highlights";
  if (experienceHeaders.has(header)) return "experience";
  if (otherHeaders.has(header)) return "other";

  return null;
}

/* ----------------------------------------
   SUMMARY
----------------------------------------- */
function buildSummary(lines = []) {
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

/* ----------------------------------------
   SKILLS
----------------------------------------- */
function extractSkills(lines = []) {
  if (!lines.length) return [];

  const text = normalizeSkillText(lines.join(" "));

  return text
    .split(/,|\||•|;|\n/)
    .map(skill => cleanSkill(skill))
    .filter(skill => skill.length > 1)
    .filter(skill => !isSkillCategory(skill))
    .map(normalizeSkillName)
    .filter(Boolean)
    .filter((skill, index, skills) => skills.indexOf(skill) === index);
}

function normalizeSkillText(text) {
  const categories = getSkillCategoriesPattern();

  return text
    .replace(/\bSpring\s+Framework\s+Spring\s+boot\b/gi, "Spring Framework, Spring Boot")
    .replace(/\(([^)]*)\)/g, ", $1, ")
    .replace(/\bPython\s+scripting\b/gi, "Python")
    .replace(categories, ", $1, ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSkill(skill) {
  return skill
    .replace(getSkillCategoriesPattern(), " ")
    .replace(/^and\s+/i, "")
    .trim()
    .replace(/\.\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getSkillCategoriesPattern() {
  return /\b(DevOps\s*&\s*CI-?CD|Monitoring\s*&\s*Logging|Message\s+Brokers?|Programming\s+Languages?|Languages?|Frontend|Front\s*End|Backend|Back\s*End|Databases?|Cloud|Tools?|Libraries|Testing)\b/gi;
}

function isSkillCategory(skill) {
  return getSkillCategoriesPattern().test(skill);
}

function normalizeSkillName(skill) {
  const aliases = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    reactjs: "React",
    nodejs: "Node.js",
    "spring boot": "Spring Boot",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "ci-cd": "CI/CD",
    cicd: "CI/CD",
    log4j: "Log4j",
    "power bi": "Power BI"
  };

  const key = skill.toLowerCase();

  if (key === "foundation") {
    return "";
  }

  return aliases[key] || skill;
}

function mergeUniqueSkills(...skillGroups) {
  return skillGroups
    .flat()
    .map(skill => cleanSkill(skill))
    .map(normalizeSkillName)
    .filter(Boolean)
    .filter((skill, index, skills) => skills.indexOf(skill) === index);
}

function extractHighlightSkills(lines = []) {
  if (!lines.length) return [];

  const text = lines.join(" ");
  const candidates = [];

  const explicitSkillPattern =
    /\b(JavaScript|TypeScript|ReactJS|React|Angular|NodeJS|Node\.js|Spring Boot|Spring Framework|Spring Security|Spring MVC|Java|Python|SQL|PostgreSQL|MongoDB|MySQL|Oracle|Microsoft SQL Server|Kafka|RabbitMQ|ActiveMQ|Docker|Kubernetes|Terraform|CloudFormation|AWS|Azure|GCP|Jenkins|GitHub Actions|GitHub|Git|REST APIs?|GraphQL|OAuth2|JWT|SSO|RBAC|TDD|BDD|CI\/CD|OpenSearch|Splunk|Power BI|CloudWatch|Grafana|D3\.js|Redux Toolkit|ETL|KYC|HIPAA|GAAP|QuickBooks|Salesforce|HubSpot|SEO|Google Analytics|Google Ads|OSHA|ATS|HRIS|EHR|BLS)\b/gi;

  const matches = text.match(explicitSkillPattern) || [];
  candidates.push(...matches);

  return mergeUniqueSkills(candidates);
}

/* ----------------------------------------
   HIGHLIGHTS
----------------------------------------- */
function extractHighlights(lines = []) {
  const highlights = [];

  for (const line of lines.map(line => line.trim()).filter(Boolean)) {
    if (isBullet(line)) {
      highlights.push(cleanBullet(line));
      continue;
    }

    if (highlights.length) {
      if (looksLikeStandaloneHighlight(line)) {
        highlights.push(line);
      } else {
        highlights[highlights.length - 1] =
          `${highlights[highlights.length - 1]} ${line}`
            .replace(/\s+/g, " ")
            .trim();
      }
      continue;
    }

    highlights.push(line);
  }

  return highlights
    .filter(text => text.length > 20)
    .map(text => ({
      id: uuidv4(),
      text
    }));
}

function looksLikeStandaloneHighlight(line) {
  return /^[A-Z][A-Za-z0-9/&+\s-]{3,80}:\s+/.test(line);
}

/* ----------------------------------------
   EXPERIENCE
----------------------------------------- */
function extractExperience(lines = []) {
  const experience = [];
  let currentBlock = null;
  let pendingRole = "";
  let pendingTechStack = false;

  for (const line of lines) {
    if (isRoleHeading(line)) {
      pendingRole = line;
      pendingTechStack = false;
      continue;
    }

    if (isClientHeading(line)) {
      currentBlock = {
        id: uuidv4(),
        company: inferCompanyName(line),
        heading: line,
        role: pendingRole,
        bullets: [],
        techStack: []
      };

      experience.push(currentBlock);
      pendingTechStack = false;
      continue;
    }

    if (isTechStackLine(line)) {
      if (currentBlock) {
        currentBlock.techStack.push(cleanTechStack(line));
        pendingTechStack = true;
      }

      continue;
    }

    if (pendingTechStack && currentBlock && !isBullet(line)) {
      currentBlock.techStack.push(cleanTechStack(line));
      continue;
    }

    if (!isBullet(line)) {
      const lastBullet =
        currentBlock?.bullets[currentBlock.bullets.length - 1];

      if (lastBullet) {
        if (looksLikeExperienceBullet(line)) {
          currentBlock.bullets.push({
            id: uuidv4(),
            text: line
          });
        } else {
          lastBullet.text = `${lastBullet.text} ${line}`
            .replace(/\s+/g, " ")
            .trim();
        }
      } else if (currentBlock && looksLikeExperienceBullet(line)) {
        currentBlock.bullets.push({
          id: uuidv4(),
          text: line
        });
      }

      continue;
    }

    if (!currentBlock) {
      currentBlock = {
        id: uuidv4(),
        company: "Unassigned",
        heading: pendingRole,
        role: pendingRole,
        bullets: [],
        techStack: []
      };

      experience.push(currentBlock);
    }

    currentBlock.bullets.push({
      id: uuidv4(),
      text: cleanBullet(line),
    });
  }

  if (experience.some(block => block.bullets.length > 0)) {
    return experience.filter(block => block.heading || block.bullets.length);
  }

  const bullets = [];

  for (const line of lines) {
    if (isBullet(line)) {
      bullets.push({
        id: uuidv4(),
        text: cleanBullet(line),
      });
    }
  }

  if (bullets.length === 0 && lines.length > 0) {
    const paragraph = lines.join(" ");

    paragraph
      .split(".")
      .map(s => s.trim())
      .filter(s => s.length > 40) // ignore short noise
      .forEach(sentence => {
        bullets.push({
          id: uuidv4(),
          text: sentence.endsWith(".") ? sentence : sentence + ".",
        });
      });
  }

  return bullets.length
    ? [{
        id: uuidv4(),
        company: "Unassigned",
        heading: "",
        bullets
      }]
    : [];
}

function looksLikeExperienceBullet(line) {
  return (
    line.length > 35 &&
    (
      /^[A-Z][A-Za-z0-9/&+\s-]{3,90}:\s+/.test(line) ||
      /\b(implemented|developed|designed|built|modernized|integrated|deployed|improved|created|worked|contributed|automated|optimized|delivered|utilized|exposed|enabled)\b/i.test(line)
    )
  );
}

function isRoleHeading(line) {
  return (
    !isBullet(line) &&
    !isClientHeading(line) &&
    !isTechStackLine(line) &&
    /\b(developer|engineer|architect|analyst|manager|consultant|specialist|lead)\b/i.test(line) &&
    /\b(\d{4}|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line)
  );
}

function isClientHeading(line) {
  return /^client\s*:/i.test(line);
}

function isTechStackLine(line) {
  return /^tech\s*stack\s*:/i.test(line);
}

function cleanTechStack(line) {
  return line
    .replace(/^tech\s*stack\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCompanyName(line) {
  const withoutLabel = line.replace(/^client\s*:\s*/i, "");
  const normalized = withoutLabel
    .split(/\s{2,}|\||–|-|,/)
    .map(part => part.trim())
    .filter(Boolean);

  return normalized[0] || line;
}


function isBullet(line) {
  return (
    line.startsWith("•") ||
    line.startsWith("-") ||
    line.startsWith("–") ||
    line.match(/^\d+\./)
  );
}

function cleanBullet(line) {
  return line
    .replace(/^•|-|–|\d+\./, "")
    .trim()
    .replace(/\s+/g, " ");
}

/* ----------------------------------------
   EXPORT
----------------------------------------- */
module.exports = {
  buildResumeJSON
};
