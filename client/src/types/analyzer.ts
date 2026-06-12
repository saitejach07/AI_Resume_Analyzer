export type AnalyzeResponse = {
  message: string
  resume: {
    summary: string
    skills: string[]
  }
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

export type GeneratedBullet = {
  targetCompany: string
  targetHeading: string
  coversSkills: string[]
  bullet: string
  reason: string
}

export type GenerateBulletsResponse = {
  suggestedBullets: GeneratedBullet[]
  coverage?: {
    totalMissingSkills: number
    coveredSkills: string[]
  }
}

export type UnwantedBullet = {
  company: string
  heading: string
  bullet: string
  reason: string
  riskLevel: string
  atsImpact?: string
}

export type UnwantedBulletsResponse = {
  unwantedBullets: UnwantedBullet[]
}

export type AdvancedAction = 'generate' | 'unwanted'

export type InsightTab = 'skills' | 'generated' | 'cleanup'
