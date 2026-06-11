const { extractResumeText } = require("../services/resumeParser");
const { buildResumeJSON } = require("../services/resumeStructurer");
const { classifyJDWithAI } = require("../services/aiJDClassifier");
const { extractAtomicSkills } = require("../services/aiSkillExtractor");
const { computeMatch } = require("../services/matchEngine");
const {
  generateMissingSkillBullets,
  identifyUnwantedBullets
} = require("../services/resumeOptimizer");

async function analyzeResume(req, res) {

  try {
    const {
      structuredResume,
      normalizedJD,
      matchResult
    } = await buildAnalysis(req);

    /* ---------- RESPONSE ---------- */

    res.json({

      message:
        "Resume + JD analyzed successfully (AI powered)",

      resume: {
        summary:
          structuredResume.summary,

        skills:
          structuredResume.skills
      },

      jobDescription:
        normalizedJD,

      match:
        matchResult
    });

  } catch (err) {

    console.error(
      "❌ AI JD analysis error:",
      err
    );

    res.status(err.statusCode || 500).json({
      error:
        err.statusCode ? err.message : "AI JD analysis failed"
    });
  }
}

async function generateBullets(req, res) {
  try {
    const {
      structuredResume,
      normalizedJD,
      matchResult
    } = await buildAnalysis(req, {
      useAnalysisContext: true
    });

    const result =
      await generateMissingSkillBullets(
        structuredResume,
        normalizedJD,
        matchResult
      );

    res.json({
      message:
        "Missing-skill bullet suggestions generated successfully",

      jobDescription:
        normalizedJD,

      match:
        {
          missingRequired:
            matchResult.missingRequired,

          missingPreferred:
            matchResult.missingPreferred
        },

      ...result
    });

  } catch (err) {
    console.error(
      "❌ Bullet generation error:",
      err
    );

    res.status(err.statusCode || 500).json({
      error:
        err.statusCode ? err.message : "Bullet generation failed"
    });
  }
}

async function findUnwantedBullets(req, res) {
  try {
    const {
      structuredResume,
      normalizedJD,
      matchResult
    } = await buildAnalysis(req, {
      useAnalysisContext: true
    });

    const result =
      await identifyUnwantedBullets(
        structuredResume,
        normalizedJD,
        matchResult
      );

    res.json({
      message:
        "Unwanted resume bullets identified successfully",

      jobDescription:
        normalizedJD,

      match:
        {
          overallMatch:
            matchResult.overallMatch,

          matchedRequired:
            matchResult.matchedRequired,

          matchedPreferred:
            matchResult.matchedPreferred,

          missingRequired:
            matchResult.missingRequired,

          missingPreferred:
            matchResult.missingPreferred
        },

      ...result
    });

  } catch (err) {
    console.error(
      "❌ Unwanted bullet analysis error:",
      err
    );

    res.status(err.statusCode || 500).json({
      error:
        err.statusCode ? err.message : "Unwanted bullet analysis failed"
    });
  }
}

async function buildAnalysis(req, options = {}) {
  if (!req.file) {
    const err = new Error("Resume file is required");
    err.statusCode = 400;
    throw err;
  }

  const { jobDescription = "" } = req.body;

  if (!jobDescription.trim()) {
    const err = new Error("Job description is required");
    err.statusCode = 400;
    throw err;
  }

  const resumeText =
    await extractResumeText(req.file);

  const structuredResume =
    buildResumeJSON(resumeText);

  const analysisContext =
    options.useAnalysisContext
      ? parseAnalysisContext(req.body.analysisContext)
      : null;

  if (analysisContext) {
    return {
      structuredResume,
      normalizedJD:
        analysisContext.normalizedJD,
      matchResult:
        analysisContext.matchResult
    };
  }

  const aiJD =
    await classifyJDWithAI(jobDescription);

  const requiredResult =
    await extractAtomicSkills(
      aiJD.requiredSkills || [],
      jobDescription,
      {
        detectedRole: aiJD.detectedRole,
        jobDomain: aiJD.jobDomain
      }
    );

  const preferredResult =
    await extractAtomicSkills(
      aiJD.preferredSkills || [],
      jobDescription,
      {
        detectedRole: aiJD.detectedRole,
        jobDomain: aiJD.jobDomain
      }
    );

  const normalizedJD = {

    detectedRole:
      aiJD.detectedRole ||
      requiredResult.detectedRole ||
      "Unknown",

    jobDomain:
      aiJD.jobDomain ||
      requiredResult.jobDomain ||
      "Other",

    requiredSkills:
      uniqueSkills(requiredResult.skills || []),

    preferredSkills:
      removeSkills(
        preferredResult.skills || [],
        requiredResult.skills || []
      ),

    responsibilities:
      aiJD.responsibilities || []
  };

  const matchResult =
    await computeMatch(
      structuredResume,
      normalizedJD
    );

  return {
    structuredResume,
    normalizedJD,
    matchResult
  };
}

function uniqueSkills(skills = []) {
  const seen = new Set();
  const result = [];

  for (const skill of skills) {
    const value = cleanSkill(skill);
    const key = value.toLowerCase();

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
    skillsToRemove.map(skill => cleanSkill(skill).toLowerCase())
  );

  return uniqueSkills(skills)
    .filter(skill => !blocked.has(skill.toLowerCase()));
}

function cleanSkill(skill) {
  return typeof skill === "string"
    ? skill.trim().replace(/\s+/g, " ")
    : "";
}

function parseAnalysisContext(rawContext) {
  if (!rawContext) {
    return null;
  }

  try {
    const context =
      typeof rawContext === "string"
        ? JSON.parse(rawContext)
        : rawContext;

    const jd = context.jobDescription || {};
    const match = context.match || {};

    const requiredSkills =
      uniqueSkills(jd.requiredSkills || []);

    const preferredSkills =
      removeSkills(
        jd.preferredSkills || [],
        requiredSkills
      );

    const missingRequired =
      uniqueSkills(match.missingRequired || []);

    const missingPreferred =
      removeSkills(
        match.missingPreferred || [],
        missingRequired
      );

    return {
      normalizedJD: {
        detectedRole:
          cleanSkill(jd.detectedRole) || "Unknown",

        jobDomain:
          cleanSkill(jd.jobDomain) || "Other",

        requiredSkills,
        preferredSkills,

        responsibilities:
          uniqueSkills(jd.responsibilities || [])
      },

      matchResult: {
        requiredMatch:
          Number.isFinite(match.requiredMatch)
            ? match.requiredMatch
            : 0,

        preferredMatch:
          Number.isFinite(match.preferredMatch)
            ? match.preferredMatch
            : 0,

        overallMatch:
          Number.isFinite(match.overallMatch)
            ? match.overallMatch
            : 0,

        matchedRequired:
          uniqueSkills(match.matchedRequired || []),

        missingRequired,

        matchedPreferred:
          removeSkills(
            match.matchedPreferred || [],
            match.matchedRequired || []
          ),

        missingPreferred
      }
    };
  } catch (err) {
    return null;
  }
}

module.exports = {
  analyzeResume,
  generateBullets,
  findUnwantedBullets
};
