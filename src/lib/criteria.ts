export interface CriterionGroup {
  id: string
  label: string
  /** Tailwind border color class for the colored left border. */
  accent: string
  /** Tailwind text color for the group heading. */
  text: string
  /** hex used for charts / category bars */
  hex: string
}

export interface Criterion {
  id: string
  n: number
  groupId: string
  label: string
  /** What a 1 means. */
  low: string
  /** What a 5 means. */
  mid: string
  /** What a 10 means. */
  high: string
}

export const CRITERIA_GROUPS: CriterionGroup[] = [
  { id: 'academic', label: 'Academic Environment', accent: 'border-l-navy-500', text: 'text-navy-600 dark:text-navy-500', hex: '#3D5A99' },
  { id: 'career', label: 'Career & Network', accent: 'border-l-gold-400', text: 'text-gold-500 dark:text-gold-300', hex: '#C9A84C' },
  { id: 'research', label: 'Research', accent: 'border-l-green-500', text: 'text-green-600 dark:text-green-400', hex: '#2D6A4F' },
  { id: 'program', label: 'Program Fit', accent: 'border-l-[#7C3AED]', text: 'text-[#7C3AED]', hex: '#7C3AED' },
  { id: 'admissions', label: 'Admissions', accent: 'border-l-[#0EA5E9]', text: 'text-[#0EA5E9]', hex: '#0EA5E9' },
  { id: 'campus', label: 'Campus & Life', accent: 'border-l-[#E07A5F]', text: 'text-[#E07A5F]', hex: '#E07A5F' },
]

export const CRITERIA: Criterion[] = [
  // ACADEMIC ENVIRONMENT
  { id: 'c1', n: 1, groupId: 'academic', label: 'Academic rigor & intellectual intensity', low: 'Minimal challenge; coast-able', mid: 'Solid but manageable workload', high: 'Extremely rigorous, demanding environment' },
  { id: 'c2', n: 2, groupId: 'academic', label: 'Core curriculum structure', low: 'Completely open / no requirements', mid: 'Light distribution requirements', high: 'Strong, structured core curriculum' },
  { id: 'c3', n: 3, groupId: 'academic', label: 'Interdisciplinary flexibility', low: 'Siloed departments', mid: 'Some cross-listing allowed', high: 'Seamless mixing of env sci / econ / policy' },
  { id: 'c4', n: 4, groupId: 'academic', label: 'Seminar & discussion culture', low: 'All large lectures', mid: 'Mix of lectures and sections', high: 'Primarily small seminars' },
  { id: 'c5', n: 5, groupId: 'academic', label: 'Peer intellectual caliber', low: 'Average students', mid: 'Capable, motivated peers', high: 'Exceptionally driven intellectual peers' },
  { id: 'c6', n: 6, groupId: 'academic', label: 'Professor quality & accessibility', low: 'Inaccessible, research-only faculty', mid: 'Reachable in office hours', high: 'Excellent teaching and open doors' },
  { id: 'c7', n: 7, groupId: 'academic', label: 'Undergraduate research access', low: 'Research is graduate-only', mid: 'Available to upperclassmen', high: 'Freshmen get lab access and mentorship' },
  // CAREER & NETWORK
  { id: 'c8', n: 8, groupId: 'career', label: 'NYC finance recruiting pipeline', low: 'No presence', mid: 'Some firms recruit', high: 'Wall Street firms actively recruit on campus' },
  { id: 'c9', n: 9, groupId: 'career', label: 'MBB consulting recruiting', low: 'No presence', mid: 'Occasional consulting interest', high: 'McKinsey / BCG / Bain actively recruit on campus' },
  { id: 'c10', n: 10, groupId: 'career', label: 'Alumni network in target fields', low: 'Weak and inactive', mid: 'Present but diffuse', high: 'Dense, reachable network in finance / env / policy' },
  { id: 'c11', n: 11, groupId: 'career', label: 'National brand recognition', low: 'Regional only', mid: 'Well known nationally', high: 'Instantly recognized by any employer globally' },
  { id: 'c12', n: 12, groupId: 'career', label: 'ESG & impact investing ecosystem', low: 'No relevant programs or clubs', mid: 'A club or two', high: 'Dedicated ESG tracks, funds, recruiting' },
  { id: 'c13', n: 13, groupId: 'career', label: 'Entrepreneurship culture', low: 'No startup culture', mid: 'Some incubator activity', high: 'Thriving entrepreneurial ecosystem' },
  // RESEARCH
  { id: 'c14', n: 14, groupId: 'research', label: 'Wet lab & science research access', low: 'No undergraduate lab access', mid: 'Access after a year or two', high: 'Fully funded freshman research' },
  { id: 'c15', n: 15, groupId: 'research', label: 'Environmental science faculty depth', low: 'No env sci faculty', mid: 'Small but real department', high: 'Nationally ranked env sci department' },
  { id: 'c16', n: 16, groupId: 'research', label: 'Faculty mentorship culture', low: 'Faculty unavailable', mid: 'Mentorship if you seek it', high: 'Active mentorship of undergrads' },
  { id: 'c17', n: 17, groupId: 'research', label: 'Policy–research bridge', low: 'Pure research, no policy connection', mid: 'Occasional policy tie-ins', high: 'Direct pipeline from research to policy impact' },
  { id: 'c18', n: 18, groupId: 'research', label: 'Research center quality', low: 'No relevant centers', mid: 'One solid center', high: 'Multiple top-ranked env / policy / econ centers' },
  // PROGRAM FIT
  { id: 'c19', n: 19, groupId: 'program', label: 'Environmental science program rank', low: 'No program', mid: 'Respectable mid-tier program', high: 'Top 5 nationally' },
  { id: 'c20', n: 20, groupId: 'program', label: 'Business / economics program quality', low: 'Weak department', mid: 'Strong econ, no business', high: 'Top undergraduate business or econ nationally' },
  { id: 'c21', n: 21, groupId: 'program', label: 'Policy & public affairs program', low: 'No policy program', mid: 'Policy minor / track exists', high: 'Nationally ranked policy school with undergrad access' },
  { id: 'c22', n: 22, groupId: 'program', label: 'Jesuit & values alignment', low: 'No values alignment', mid: 'Loosely values-oriented', high: 'Strong Jesuit mission, deeply resonant' },
  { id: 'c23', n: 23, groupId: 'program', label: 'Study abroad quality', low: 'Minimal options', mid: 'Standard exchange programs', high: 'Exceptional international programs' },
  // ADMISSIONS
  { id: 'c24', n: 24, groupId: 'admissions', label: 'Admit probability', low: '<5% historically from my school', mid: '~20% historically', high: '>40% historically' },
  { id: 'c25', n: 25, groupId: 'admissions', label: 'Early round leverage', low: 'No meaningful ED/EA boost', mid: 'Modest early bump', high: 'Dramatically higher early-round rate' },
  // CAMPUS & LIFE
  { id: 'c26', n: 26, groupId: 'campus', label: 'Social scene fit', low: 'Culture feels completely wrong', mid: 'Fine, not perfect', high: 'Exactly the community I want' },
  { id: 'c27', n: 27, groupId: 'campus', label: 'Location & city quality', low: 'Isolated, no city access', mid: 'Near a small city', high: 'Ideal urban location' },
  { id: 'c28', n: 28, groupId: 'campus', label: 'Student body size fit', low: 'Much too large or small', mid: 'Acceptable size', high: 'Perfect size for my preference' },
  { id: 'c29', n: 29, groupId: 'campus', label: 'Campus environment', low: 'Unappealing physical campus', mid: 'Pleasant enough', high: 'Beautiful, inspiring campus' },
  { id: 'c30', n: 30, groupId: 'campus', label: 'Student wellness culture', low: 'High burnout, poor support', mid: 'Average support', high: 'Excellent wellbeing and balance' },
]

export const CRITERIA_BY_GROUP: Record<string, Criterion[]> = CRITERIA_GROUPS.reduce(
  (acc, g) => {
    acc[g.id] = CRITERIA.filter((c) => c.groupId === g.id)
    return acc
  },
  {} as Record<string, Criterion[]>,
)

export function groupById(id: string): CriterionGroup {
  return CRITERIA_GROUPS.find((g) => g.id === id) ?? CRITERIA_GROUPS[0]
}

/** Default weight for every criterion (mid value). */
export const DEFAULT_WEIGHT = 5
export function defaultWeights(): Record<string, number> {
  return CRITERIA.reduce((acc, c) => {
    acc[c.id] = DEFAULT_WEIGHT
    return acc
  }, {} as Record<string, number>)
}
