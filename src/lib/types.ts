export type Tier = 'Unlikely' | 'Reach' | 'Target' | 'Likely'
export type SchoolStatus = 'Applying' | 'Chopping Block' | 'Not Applying' | 'Removed'
export type VisitStatus = 'Not Visited' | 'Planned' | 'Visited'
export type AppRound = 'ED1' | 'ED2' | 'EA' | 'REA' | 'RD'

export type GradeLetter =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'
  | 'F'

export interface School {
  id: string
  name: string
  tier: Tier
  status: SchoolStatus
  priority: number // 1–5
  bestRound: AppRound
  visitStatus: VisitStatus
  admitRate: number | null // % from my high school
  usNewsRank: number | null
  enrollment: number | null
  location: string
  distanceFromNYC: number | null // hours
  oneStrongReason: string
  whyConsidering: string
  concerns: string
  notes: string
  createdAt: number
  updatedAt: number
}

export interface Grade {
  letter: GradeLetter | null
  justification: string
  history: { letter: GradeLetter; at: number }[]
  updatedAt: number
}

/** Per-framework answer payloads. Loosely typed maps keyed by question id. */
export type FrameworkAnswerValue = string | number | boolean | null
export interface FrameworkAnswers {
  [framework: string]: Record<string, FrameworkAnswerValue>
}

export interface ActivityItem {
  id: string
  at: number
  message: string
  schoolId?: string
  kind: 'school' | 'matrix' | 'framework' | 'grade' | 'note' | 'system'
}

export type CriterionScores = Record<string, number> // criterionId -> 1..10

export interface AppState {
  schools: School[]
  matrixWeights: Record<string, number> // criterionId -> 0..10
  matrixScores: Record<string, CriterionScores> // schoolId -> scores
  frameworkAnswers: Record<string, FrameworkAnswers> // schoolId -> answers
  frameworkScores: Record<string, Record<number, number>> // schoolId -> fw# -> score
  frameworkWeights: Record<number, number> // fw# -> 0..10
  grades: Record<string, Grade> // schoolId -> grade
  dashboardNotes: string
  recentActivity: ActivityItem[]
  sidebarExpanded: boolean
  darkMode: boolean
  activeSection: string
  comparisonSchools: string[]
}
