const client = require("./openaiClient");

/**
 * AI-POWERED ATS MATCH ENGINE
 * ---------------------------
 * - Semantic matching
 * - ATS-style intelligence
 * - Understands role-specific evidence
 * - Handles aliases/synonyms
 */

async function computeMatch(resume, jd) {

  const resumeCorpus = buildResumeCorpus(resume);

  const required = uniqueSkills(jd.requiredSkills || []);
  const preferred = removeSkills(
    uniqueSkills(jd.preferredSkills || []),
    required
  );

  /* ---------- REQUIRED ---------- */

  const requiredResult =
    await matchSkillsWithAI(
      resumeCorpus,
      required,
      jd,
      "required"
    );

  /* ---------- PREFERRED ---------- */

  const preferredResult =
    await matchSkillsWithAI(
      resumeCorpus,
      preferred,
      jd,
      "preferred"
    );

  /* ---------- PERCENTAGES ---------- */

  const requiredMatch = percent(
    requiredResult.matched.length,
    required.length
  );

  const preferredMatch = percent(
    preferredResult.matched.length,
    preferred.length
  );

  const overallMatch = Math.round(
    requiredMatch * 0.7 +
    preferredMatch * 0.3
  );

  /* ---------- FINAL RESPONSE ---------- */

  return {
    requiredMatch,
    preferredMatch,
    overallMatch,

    matchedRequired:
      requiredResult.matched,

    missingRequired:
      requiredResult.missing,

    matchedPreferred:
      preferredResult.matched,

    missingPreferred:
      removeSkills(
        preferredResult.missing,
        requiredResult.missing
      )
  };
}

/* ===================================================
   AI SEMANTIC MATCHER
=================================================== */

async function matchSkillsWithAI(
  resumeText,
  skills = [],
  jd = {},
  skillType = "required"
) {

  const deterministicMatched =
    skills.filter(skill =>
      hasResumeEvidence(resumeText, skill)
    );

  const skillsForAI =
    removeSkills(skills, deterministicMatched);

  if (!skillsForAI.length) {
    return {
      matched: deterministicMatched,
      missing: []
    };
  }

  const prompt = `
You are a domain-neutral ATS semantic matching engine.

Your task:
Compare the resume against the ${skillType} job skills.

You must intelligently determine whether
the candidate has credible resume evidence related to
each job skill.

Detected role:
${jd.detectedRole || "Unknown"}

Detected domain:
${jd.jobDomain || "Other"}

SEMANTIC MATCHING RULES:

Examples across domains:
- "REST APIs" matches "API Development"
- "Spring Boot" matches "Java Backend"
- "QuickBooks" can match "Accounting Software"
- "Month-end close" matches "Financial Close"
- "EHR charting" matches "Electronic Health Records"
- "BLS certification" matches "Basic Life Support"
- "Salesforce" matches "CRM"
- "Google Ads" matches "Paid Search"
- "OSHA 30" matches "Construction Safety"
- "ATS sourcing" matches "Recruiting"

Rules:
- Match exact skills, equivalent terminology, abbreviations, certifications, tools, platforms, workflows, and domain concepts
- Use the detected role/domain to decide what equivalence means
- Do not force software terminology for non-software roles
- Prefer explicit resume evidence
- Accept strong adjacent evidence only when it is clearly relevant in the same profession
- Do NOT hallucinate
- If resume evidence is weak or absent, mark the skill missing

Return STRICT JSON ONLY.

Format:
{
  "matched": [],
  "missing": []
}

JOB SKILLS:
${JSON.stringify(skillsForAI, null, 2)}

RESUME:
${resumeText}
`;

  const response =
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a domain-neutral ATS semantic resume matching engine."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

  const raw =
    response.choices[0].message.content;

  const json =
    raw.match(/\{[\s\S]*\}/);

  if (!json) {
    return {
      matched: deterministicMatched,
      missing: skillsForAI
    };
  }

  const parsed =
    JSON.parse(json[0]);

  return {
    matched: uniqueSkills([
      ...deterministicMatched,
      ...(Array.isArray(parsed.matched)
        ? parsed.matched
        : [])
    ]),

    missing: Array.isArray(parsed.missing)
      ? removeSkills(parsed.missing, deterministicMatched)
      : skillsForAI
  };
}

/* ===================================================
   HELPERS
=================================================== */

function buildResumeCorpus(resume) {

  const parts = [];

  if (resume.summary) {
    parts.push(resume.summary);
  }

  if (Array.isArray(resume.skills)) {
    parts.push(
      resume.skills.join(" ")
    );
  }

  if (Array.isArray(resume.highlights)) {
    resume.highlights.forEach(highlight => {
      if (highlight.text) {
        parts.push(highlight.text);
      }
    });
  }

  if (Array.isArray(resume.experience)) {
    resume.experience.forEach(exp => {
      if (exp.text) {
        parts.push(exp.text);
      }

      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach(bullet => {
          if (bullet.text) {
            parts.push(bullet.text);
          }
        });
      }

      if (Array.isArray(exp.techStack)) {
        parts.push(exp.techStack.join(" "));
      }
    });
  }

  if (Array.isArray(resume.other)) {
    parts.push(
      resume.other.join(" ")
    );
  }

  return parts.join(" ");
}

function percent(matched, total) {

  if (!total) return 100;

  return Math.round(
    (matched / total) * 100
  );
}

function uniqueSkills(skills = []) {
  const seen = new Set();
  const result = [];

  for (const skill of skills) {
    const value = cleanSkill(skill);
    const key = skillKey(value);

    if (!value || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(value);
  }

  return result;
}

function removeSkills(skills = [], skillsToRemove = []) {
  const blocked = new Set(
    skillsToRemove.map(skill => skillKey(skill))
  );

  return uniqueSkills(skills)
    .filter(skill => !blocked.has(skillKey(skill)));
}

function cleanSkill(skill) {
  return typeof skill === "string"
    ? skill.trim().replace(/\s+/g, " ")
    : "";
}

function skillKey(skill) {
  return cleanSkill(skill).toLowerCase();
}

function hasResumeEvidence(resumeText, skill) {
  const corpus = normalizeEvidenceText(resumeText);
  const aliases = getSkillAliases(skill);

  return aliases.some(alias =>
    containsPhrase(corpus, normalizeEvidenceText(alias))
  );
}

function getSkillAliases(skill) {
  const value = cleanSkill(skill);
  const key = skillKey(value);

  const aliases = {
    "github actions": ["GitHub Actions"],
    cloudformation: ["CloudFormation", "Cloud Formation"],
    integrations: ["Integrations", "Integration", "Integrated", "Integrating"],
    "asynchronous systems": ["Asynchronous systems", "Asynchronous workflows", "Asynchronous communication"],
    "restful apis": ["RESTful APIs", "REST APIs", "APIs"],
    apis: ["APIs", "REST APIs", "RESTful APIs"],
    "ci/cd pipelines": ["CI/CD", "CI-CD", "CI/CD pipelines"],
    "infrastructure-as-code": ["Infrastructure-as-Code", "Infrastructure as Code", "Terraform", "CloudFormation"],
    "voip systems": ["VoIP systems", "VoIP"],
    voip: ["VoIP", "VoIP systems"],
    nodejs: ["NodeJS", "Node.js", "Node js"],
    "node.js": ["NodeJS", "Node.js", "Node js"],
    react: ["React", "ReactJS", "React.js"],
    typescript: ["TypeScript", "Typescript"],
    javascript: ["JavaScript", "Javascript"],
    "genesys cloud cx administration": ["Genesys Cloud CX Administration", "Genesys Cloud CX administration"]
  };

  return uniqueSkills([
    value,
    ...(aliases[key] || [])
  ]);
}

function containsPhrase(corpus, phrase) {
  if (!phrase) return false;

  return ` ${corpus} `.includes(` ${phrase} `);
}

function normalizeEvidenceText(value) {
  return cleanSkill(value)
    .toLowerCase()
    .replace(/node\s*\.\s*js/g, "node js")
    .replace(/react\s*\.\s*js/g, "react js")
    .replace(/ci\s*[-/]\s*cd/g, "ci cd")
    .replace(/[^\w+#.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = { computeMatch };
