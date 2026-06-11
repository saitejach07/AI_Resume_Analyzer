const client = require("./openaiClient");

async function classifyJDWithAI(jobDescription) {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are an ATS Job Description Parser.

Your task:
Analyze job descriptions from ANY profession and extract:

1. detectedRole
2. jobDomain
3. requiredSkills
4. preferredSkills
5. responsibilities

IMPORTANT:
You MUST infer the primary role and professional domain before extracting skills.
The primary role controls which skills are relevant.

Examples:

Input:
"Registered Nurse needed for ICU patient care, medication administration, and EHR charting"

Output:
{
  "detectedRole": "Registered Nurse",
  "jobDomain": "Healthcare",
  "requiredSkills": [
    "ICU Patient Care",
    "Medication Administration",
    "EHR Charting"
  ],
  "preferredSkills": [],
  "responsibilities": [
    "Provide ICU patient care",
    "Administer medications",
    "Document care in EHR systems"
  ]
}

Input:
"Accountant with GAAP knowledge, account reconciliation, month-end close, and QuickBooks experience"

Output:
{
  "detectedRole": "Accountant",
  "jobDomain": "Accounting",
  "requiredSkills": [
    "GAAP",
    "Account Reconciliation",
    "Month-End Close",
    "QuickBooks"
  ],
  "preferredSkills": [],
  "responsibilities": [
    "Perform account reconciliation",
    "Support month-end close"
  ]
}

Rules:
- Return ONLY valid JSON
- No explanations
- No markdown
- No duplicate skills
- Skills must be concise ATS keywords for the detected profession
- Keep certifications, licenses, tools, methodologies, systems, domain knowledge, and measurable competencies when relevant
- Exclude generic soft skills unless the job description clearly treats them as required competencies
`
        },
        {
          role: "user",
          content: `
Extract the following from this job description:

detectedRole:
- Best concise job title inferred from the JD

jobDomain:
- Broad professional domain such as Software, Healthcare, Accounting, Finance, Sales, Marketing, HR, Operations, Legal, Education, Construction, Manufacturing, Customer Support, Data, Design, Security, or Other

requiredSkills:
- REQUIRED role-specific skills, certifications, tools, systems, methodologies, credentials, domain knowledge, and measurable competencies
- Include implied ATS keywords only when strongly supported by the JD

preferredSkills:
- ONLY optional / nice-to-have skills

responsibilities:
- ONLY actionable duties

IMPORTANT:
Do NOT force software/IT keywords unless the JD is for a software/IT role.
Do NOT move actual skills into responsibilities.

Return STRICT JSON ONLY:

{
  "detectedRole": "",
  "jobDomain": "",
  "requiredSkills": [],
  "preferredSkills": [],
  "responsibilities": []
}

Job Description:
${jobDescription}
`
        }
      ]
    });

    let content = completion.choices[0].message.content.trim();

    // Remove markdown wrappers if GPT adds them
    content = content.replace(/```json|```/g, "").trim();

    console.log("\n========== RAW OPENAI RESPONSE ==========");
    console.log(content);

    const parsed = JSON.parse(content);

    console.log("\n========== PARSED JD CLASSIFIER ==========");
    console.log(JSON.stringify(parsed, null, 2));

    const result = {
      detectedRole:
        typeof parsed.detectedRole === "string"
          ? parsed.detectedRole.trim()
          : "Unknown",

      jobDomain:
        typeof parsed.jobDomain === "string"
          ? parsed.jobDomain.trim()
          : "Other",

      requiredSkills: Array.isArray(parsed.requiredSkills)
        ? [...new Set(parsed.requiredSkills.map(s => s.trim()).filter(Boolean))]
        : [],

      preferredSkills: Array.isArray(parsed.preferredSkills)
        ? [...new Set(parsed.preferredSkills.map(s => s.trim()).filter(Boolean))]
        : [],

      responsibilities: Array.isArray(parsed.responsibilities)
        ? [...new Set(parsed.responsibilities.map(s => s.trim()).filter(Boolean))]
        : []
    };

    console.log("\n========== FINAL JD CLASSIFIER OUTPUT ==========");
    console.log(JSON.stringify(result, null, 2));

    return result;

  } catch (err) {
    console.error("❌ AI JD classification error:", err);
    throw err;
  }
}

module.exports = { classifyJDWithAI };
