const client = require("./openaiClient");

async function generateMissingSkillBullets(resume, jd, match) {
  const missingRequired = uniqueSkills(match.missingRequired || []);
  const missingPreferred = uniqueSkills(match.missingPreferred || []);
  const missingSkills = uniqueSkills([...missingRequired, ...missingPreferred]);

  if (!missingSkills.length) {
    return {
      suggestedBullets: [],
      coverage: {
        totalMissingSkills: 0,
        coveredSkills: []
      }
    };
  }

  const prompt = `
You are an ATS resume optimization assistant.

Goal:
Generate resume bullet points that cover EVERY missing required and missing preferred JD skill.

Rules:
- Use only the resume evidence provided.
- Do not invent employers, certifications, metrics, or outcomes.
- You may write ATS-oriented bullets that explicitly include the missing keywords, but keep the work plausible for the selected existing experience section.
- Prefer placing bullets under the most relevant existing work experience company/client.
- Do not place bullets under Key Highlights.
- A single bullet may cover multiple missing skills only when they are tightly related.
- Every skill listed in coversSkills MUST appear in the bullet text using the exact same keyword phrase.
- For recruiter/ATS search, do not rely on synonyms alone. Example: if coversSkills includes "Genesys Cloud CX Administration", the bullet must contain "Genesys Cloud CX Administration" exactly.
- Generate enough bullets to cover ALL missingRequired and missingPreferred values.
- Do not create duplicate bullets for a skill that is already covered by another suggested bullet.
- If the same keyword appears in required and preferred with different casing, cover it once using the required casing.
- Keep suggestions organized by the most relevant work experience section.
- Prefer multiple targeted bullets over one vague bullet that claims too many unrelated skills.
- Do not return uncoveredSkills.
- Keep bullets concise, impact-oriented, and ATS-friendly.
- Return STRICT JSON ONLY.

Return format:
{
  "suggestedBullets": [
    {
      "targetCompany": "",
      "targetHeading": "",
      "coversSkills": [],
      "bullet": "",
      "reason": ""
    }
  ],
  "coverage": {
    "totalMissingSkills": 0,
    "coveredSkills": []
  }
}

JOB CONTEXT:
${JSON.stringify({
  detectedRole: jd.detectedRole,
  jobDomain: jd.jobDomain,
  requiredSkills: jd.requiredSkills,
  preferredSkills: jd.preferredSkills,
  missingRequired,
  missingPreferred
}, null, 2)}

STRUCTURED RESUME:
${JSON.stringify(buildOptimizationResume(resume), null, 2)}
`;

  const parsed = await completeJSON(prompt, "You generate truthful ATS resume bullets.");
  const normalized =
    Array.isArray(parsed.suggestedBullets)
      ? parsed.suggestedBullets.map(normalizeSuggestedBullet).filter(Boolean)
      : [];

  const repairedBullets =
    await repairMissingCoverageIfNeeded(
      normalized,
      missingSkills,
      resume,
      jd
    );

  const suggestedBullets =
    sortSuggestedBulletsByTarget(
      enforceExactKeywordCoverage(
        repairedBullets,
        missingSkills
      )
    );

  const coveredSkills =
    uniqueSkills(
      suggestedBullets.flatMap(item => item.coversSkills)
    );

  return {
    suggestedBullets,
    coverage: {
      totalMissingSkills: missingSkills.length,
      coveredSkills
    }
  };
}

async function identifyUnwantedBullets(resume, jd, match) {
  const prompt = `
You are an ATS resume pruning assistant.

Goal:
Identify existing work experience bullets that are least useful for this specific JD.

Rules:
- Review only work experience bullets.
- Return bullet text exactly as provided in WORK EXPERIENCE. Do not shorten, rewrite, split, or return partial line fragments.
- Do not review summary, skills, or key highlights.
- A low-value bullet is one that does not support required skills, preferred skills, responsibilities, role/domain fit, or credibility for the target role.
- Do not mark a bullet unwanted if it contains or supports any required skill, preferred skill, matched skill, missing skill, domain keyword, measurable impact, or role-relevant responsibility.
- Only return bullets that are safe to remove with low risk of reducing ATS score for this JD.
- If the available bullet text looks incomplete, do not include it.
- If unsure, do not include the bullet.
- Be conservative.
- Return STRICT JSON ONLY.

Return format:
{
  "unwantedBullets": [
    {
      "company": "",
      "heading": "",
      "bullet": "",
      "reason": "",
      "riskLevel": "low",
      "atsImpact": "unlikely to reduce ATS score"
    }
  ]
}

JOB CONTEXT:
${JSON.stringify({
  detectedRole: jd.detectedRole,
  jobDomain: jd.jobDomain,
  requiredSkills: jd.requiredSkills,
  preferredSkills: jd.preferredSkills,
  responsibilities: jd.responsibilities,
  matchedRequired: match.matchedRequired,
  missingRequired: match.missingRequired,
  matchedPreferred: match.matchedPreferred,
  missingPreferred: match.missingPreferred
}, null, 2)}

WORK EXPERIENCE:
${JSON.stringify(buildOptimizationExperience(resume), null, 2)}
`;

  const parsed = await completeJSON(prompt, "You identify low-value resume bullets for a specific JD.");

  const unwantedBullets =
    Array.isArray(parsed.unwantedBullets)
      ? parsed.unwantedBullets.map(normalizeUnwantedBullet).filter(Boolean)
      : [];

  return {
    unwantedBullets:
      alignUnwantedBulletsToResume(unwantedBullets, resume)
  };
}

async function completeJSON(prompt, systemMessage) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: systemMessage
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const raw = response.choices[0].message.content || "";
  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) {
    return {};
  }

  return JSON.parse(match[0]);
}

function normalizeSuggestedBullet(item) {
  if (!item || typeof item !== "object" || !item.bullet) {
    return null;
  }

  return {
    targetCompany: cleanTarget(item.targetCompany) || "Unassigned",
    targetHeading: cleanTarget(item.targetHeading),
    coversSkills: Array.isArray(item.coversSkills)
      ? uniqueStrings(item.coversSkills)
      : [],
    bullet: cleanString(item.bullet),
    reason: cleanString(item.reason)
  };
}

async function repairMissingCoverageIfNeeded(
  suggestedBullets,
  missingSkills,
  resume,
  jd
) {
  const missingExactSkills =
    findMissingExactSkills(suggestedBullets, missingSkills);

  if (!missingExactSkills.length) {
    return suggestedBullets;
  }

  const prompt = `
You are repairing ATS resume bullet suggestions.

Generate additional bullet points that cover EVERY skill below using the exact keyword phrase in the bullet text.

Rules:
- Every skill in coversSkills MUST appear in the bullet text exactly.
- Place each bullet under the most relevant existing work experience company/client.
- Do not use Key Highlights as a target section.
- Prefer one focused bullet per skill cluster.
- Return STRICT JSON ONLY.

Return format:
{
  "suggestedBullets": [
    {
      "targetCompany": "",
      "targetHeading": "",
      "coversSkills": [],
      "bullet": "",
      "reason": ""
    }
  ]
}

SKILLS THAT STILL NEED EXACT COVERAGE:
${JSON.stringify(missingExactSkills, null, 2)}

JOB CONTEXT:
${JSON.stringify({
  detectedRole: jd.detectedRole,
  jobDomain: jd.jobDomain,
  requiredSkills: jd.requiredSkills,
  preferredSkills: jd.preferredSkills
}, null, 2)}

STRUCTURED RESUME EXPERIENCE:
${JSON.stringify(buildOptimizationExperience(resume), null, 2)}
`;

  const parsed =
    await completeJSON(
      prompt,
      "You repair ATS bullet coverage by including exact missing keywords."
    );

  const repairs =
    Array.isArray(parsed.suggestedBullets)
      ? parsed.suggestedBullets.map(normalizeSuggestedBullet).filter(Boolean)
      : [];

  const combined = [...suggestedBullets, ...repairs];
  const stillMissing =
    findMissingExactSkills(combined, missingSkills);

  if (!stillMissing.length) {
    return combined;
  }

  return [
    ...combined,
    ...buildFallbackCoverageBullets(stillMissing, resume, jd)
  ];
}

function enforceExactKeywordCoverage(suggestedBullets, missingSkills) {
  const normalizedMissingSkills = uniqueStrings(missingSkills);

  const covered = new Set();

  return suggestedBullets
    .map(item => {
      const exactSkills =
        normalizedMissingSkills.filter(skill =>
          !covered.has(skillKey(skill)) &&
          containsExactKeyword(item.bullet, skill)
        );

      if (!exactSkills.length) {
        return null;
      }

      exactSkills.forEach(skill => covered.add(skillKey(skill)));

      return {
        ...item,
        coversSkills: uniqueSkills(exactSkills)
      };
    })
    .filter(Boolean);
}

function findMissingExactSkills(suggestedBullets, missingSkills) {
  return uniqueSkills(missingSkills)
    .filter(skill =>
      !suggestedBullets.some(item =>
        containsExactKeyword(item.bullet, skill)
      )
    );
}

function sortSuggestedBulletsByTarget(suggestedBullets) {
  return [...suggestedBullets].sort((a, b) => {
    const targetA = `${a.targetCompany} ${a.targetHeading}`.toLowerCase();
    const targetB = `${b.targetCompany} ${b.targetHeading}`.toLowerCase();

    return targetA.localeCompare(targetB);
  });
}

function buildFallbackCoverageBullets(skills, resume, jd) {
  const target = findBestFallbackTarget(resume);

  return chunk(skills, 3).map(group => ({
    targetCompany: target.company,
    targetHeading: target.heading,
    coversSkills: group,
    bullet:
      `Applied ${formatSkillList(group)} across ${jd.detectedRole || "role"} workflows to support ${jd.jobDomain || "target role"} requirements and improve delivery alignment.`,
    reason:
      "Generated as a fallback to ensure every missing required and preferred keyword appears explicitly in the suggested bullets."
  }));
}

function findBestFallbackTarget(resume) {
  const firstExperience =
    Array.isArray(resume.experience)
      ? resume.experience.find(exp => exp.company || exp.heading)
      : null;

  return {
    company: firstExperience?.company || "Unassigned",
    heading: firstExperience?.heading || ""
  };
}

function formatSkillList(skills) {
  if (skills.length <= 1) {
    return skills[0] || "";
  }

  if (skills.length === 2) {
    return `${skills[0]} and ${skills[1]}`;
  }

  return `${skills.slice(0, -1).join(", ")}, and ${skills[skills.length - 1]}`;
}

function chunk(values, size) {
  const chunks = [];

  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }

  return chunks;
}

function containsExactKeyword(text, keyword) {
  const normalizedText = normalizeForKeywordSearch(text);
  const normalizedKeyword = normalizeForKeywordSearch(keyword);

  return ` ${normalizedText} `.includes(` ${normalizedKeyword} `);
}

function normalizeForKeywordSearch(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^\w+#./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUnwantedBullet(item) {
  if (!item || typeof item !== "object" || !item.bullet) {
    return null;
  }

  return {
    company: cleanString(item.company) || "Unassigned",
    heading: cleanString(item.heading),
    bullet: cleanString(item.bullet),
    reason: cleanString(item.reason),
    riskLevel: cleanString(item.riskLevel) || "low",
    atsImpact:
      cleanString(item.atsImpact) ||
      "unlikely to reduce ATS score"
  };
}

function alignUnwantedBulletsToResume(unwantedBullets, resume) {
  const existingBullets = getExistingExperienceBullets(resume);
  const seen = new Set();

  return unwantedBullets
    .map(item => {
      const match = findExistingBulletMatch(item, existingBullets);

      if (!match) {
        return null;
      }

      const key = normalizeForKeywordSearch(
        `${match.company} ${match.heading} ${match.bullet}`
      );

      if (seen.has(key)) {
        return null;
      }

      seen.add(key);

      return {
        ...item,
        company: match.company || item.company,
        heading: match.heading || item.heading,
        bullet: match.bullet
      };
    })
    .filter(Boolean);
}

function getExistingExperienceBullets(resume) {
  if (!Array.isArray(resume.experience)) {
    return [];
  }

  return resume.experience.flatMap(exp =>
    Array.isArray(exp.bullets)
      ? exp.bullets
          .map(bullet => cleanString(bullet.text))
          .filter(text => text.length >= 40)
          .map(text => ({
            company: cleanString(exp.company) || "Unassigned",
            heading: cleanString(exp.heading),
            bullet: text
          }))
      : []
  );
}

function findExistingBulletMatch(item, existingBullets) {
  const candidate = normalizeForKeywordSearch(item.bullet);

  if (!candidate || candidate.length < 20) {
    return null;
  }

  return existingBullets.find(existing => {
    const existingText = normalizeForKeywordSearch(existing.bullet);

    return (
      existingText === candidate ||
      existingText.includes(candidate) ||
      candidate.includes(existingText)
    );
  });
}

function buildOptimizationResume(resume) {
  return {
    summary: resume.summary,
    skills: resume.skills,
    highlights: Array.isArray(resume.highlights)
      ? resume.highlights.map(highlight => ({
          text: highlight.text
        }))
      : [],
    experience: buildOptimizationExperience(resume)
  };
}

function buildOptimizationExperience(resume) {
  return Array.isArray(resume.experience)
    ? resume.experience.map(exp => ({
        company: exp.company,
        role: exp.role,
        heading: exp.heading,
        bullets: Array.isArray(exp.bullets)
          ? exp.bullets.map(bullet => ({
              text: bullet.text
            }))
          : [],
        techStack: exp.techStack || []
      }))
    : [];
}

function cleanTarget(value) {
  const text = cleanString(value);

  return isUuid(text) ? "" : text;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function uniqueStrings(values = []) {
  return [...new Set(
    values
      .map(cleanString)
      .filter(Boolean)
  )];
}

function uniqueSkills(values = []) {
  const seen = new Set();
  const skills = [];

  for (const value of values) {
    const skill = cleanString(value);
    const key = skillKey(skill);

    if (!skill || seen.has(key)) {
      continue;
    }

    seen.add(key);
    skills.push(skill);
  }

  return skills;
}

function skillKey(value) {
  return cleanString(value).toLowerCase();
}

function cleanString(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ")
    : "";
}

module.exports = {
  generateMissingSkillBullets,
  identifyUnwantedBullets
};
