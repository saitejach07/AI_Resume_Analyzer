const client = require("./openaiClient");

async function extractAtomicSkills(
  skillPhrases = [],
  jobDescription = "",
  context = {}
) {

  if (
    !Array.isArray(skillPhrases) ||
    skillPhrases.length === 0
  ) {
    return {
      detectedRole: context.detectedRole || "Unknown",
      jobDomain: context.jobDomain || "Other",
      skills: []
    };
  }

  const prompt = `
You are an ATS-grade UNIVERSAL SKILL EXTRACTION ENGINE.

Your task:
Analyze the FULL job description context
and extract ONLY ATS-relevant skills for the detected role/domain.

CRITICAL RULE:
The PRIMARY JOB ROLE and JOB DOMAIN decide what counts as a valid skill.
Do not apply software-engineering filters to non-software roles.

Detected role from classifier:
${context.detectedRole || "Unknown"}

Detected domain from classifier:
${context.jobDomain || "Other"}

KEEP role-relevant ATS keywords, including:
- Technical skills and tools
- Professional methods and workflows
- Certifications, licenses, credentials, and compliance knowledge
- Domain-specific systems, platforms, software, equipment, and procedures
- Measurable competencies required by the role

Examples by domain:
- Healthcare: Patient Care, ICU, Medication Administration, EHR, HIPAA, BLS, RN License
- Accounting: GAAP, Account Reconciliation, Month-End Close, QuickBooks, Audit Support, Tax Preparation
- Sales: CRM, Salesforce, Pipeline Management, Lead Generation, Negotiation, Territory Management
- Marketing: SEO, Google Analytics, Campaign Management, Content Strategy, HubSpot, Paid Search
- HR: Recruiting, ATS, Employee Relations, Benefits Administration, Onboarding, HRIS
- Construction: Blueprint Reading, OSHA, Project Scheduling, Cost Estimation, Subcontractor Coordination
- Education: Curriculum Development, Classroom Management, IEP, Student Assessment, LMS
- Software: Java, React, REST APIs, AWS, Docker, CI/CD, System Design

ALWAYS REMOVE:
- vague business wording
- culture-fit wording
- personality traits
- generic soft skills unless explicitly required as a core competency

Examples of removal:
- leadership
- communication
- collaboration
- ambiguity
- startup mindset
- fast-paced environment
- team player
- mentoring

Rules:
- Output ONLY JSON
- No explanations
- No sentences
- No duplicates

Return STRICT JSON ONLY:

{
"detectedRole": "",
  "jobDomain": "",
  "skills": []
}

FULL JOB DESCRIPTION:
${jobDescription}

INPUT PHRASES:
${JSON.stringify(skillPhrases, null, 2)}
`;

  try {

    const response =
      await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You extract ATS-relevant keywords for any profession based on primary role and domain."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

    const raw =
      response.choices[0].message.content;

    const match =
      raw.match(/\{[\s\S]*\}/);

    if (!match) {
      return {
        detectedRole: context.detectedRole || "Unknown",
        jobDomain: context.jobDomain || "Other",
        skills: []
      };
    }

    const parsed =
      JSON.parse(match[0]);

    return {

      detectedRole:
        parsed.detectedRole ||
        context.detectedRole ||
        "Unknown",

      jobDomain:
        parsed.jobDomain ||
        context.jobDomain ||
        "Other",

      skills: Array.isArray(parsed.skills)
        ? [...new Set(
            parsed.skills
              .map(s => s.trim())
              .filter(Boolean)
          )]
        : []
    };

  } catch (err) {

    console.error(
      "❌ AI Skill Extraction Error:",
      err
    );

    return {
      detectedRole: context.detectedRole || "Unknown",
      jobDomain: context.jobDomain || "Other",
      skills: []
    };
  }
}

module.exports = { extractAtomicSkills };
