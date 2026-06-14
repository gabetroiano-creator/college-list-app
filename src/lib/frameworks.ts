import type { FrameworkAnswerValue, VisitStatus } from './types'
import { clamp } from './utils'

export interface FwOption {
  value: string
  label: string
}

export type FwQType =
  | 'number'
  | 'slider'
  | 'text'
  | 'textarea'
  | 'toggle'
  | 'tri'
  | 'segmented'
  | 'school-select'
  | 'reason'

export interface FwQuestion {
  key: string
  prompt: string
  help?: string
  type: FwQType
  min?: number
  max?: number
  maxLen?: number
  lowLabel?: string
  highLabel?: string
  options?: FwOption[]
  /** Only render when another answer matches. */
  showIf?: { key: string; equals: FrameworkAnswerValue }
}

export interface FwContext {
  oneStrongReason?: string
  visitStatus?: VisitStatus
}

export interface FwResult {
  score: number | null
  complete: boolean
  interpretation: string
}

export interface Framework {
  n: number
  key: string
  title: string
  subtitle: string
  /** left-border + text accent classes */
  accentBorder: string
  accentText: string
  accentDot: string
  accentHex: string
  questions: FwQuestion[]
  score: (a: Record<string, FrameworkAnswerValue>, ctx: FwContext) => FwResult
}

type A = Record<string, FrameworkAnswerValue>
const num = (a: A, k: string): number | null => {
  const v = a[k]
  return typeof v === 'number' && !Number.isNaN(v) ? v : null
}
const str = (a: A, k: string): string => {
  const v = a[k]
  return typeof v === 'string' ? v : ''
}

export function interpret(score: number | null, complete: boolean): string {
  if (score === null) return 'Awaiting input'
  const base =
    score >= 7 ? 'Strong keep signal' : score >= 5 ? 'Weak keep signal' : score >= 3 ? 'Needs more research' : 'Cut signal'
  if (!complete) return `${base} — incomplete`
  return base
}

const YESNO: FwOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export const FRAMEWORKS: Framework[] = [
  // ───────────────────────────────────────── FW1
  {
    n: 1,
    key: 'fw1',
    title: 'The Would-I-Go-There Test',
    subtitle: 'Strip away prestige. Measure genuine excitement.',
    accentBorder: 'border-l-gold-400',
    accentText: 'text-gold-500 dark:text-gold-300',
    accentDot: 'bg-gold-400',
    accentHex: '#C9A84C',
    questions: [
      {
        key: 'q1',
        type: 'number',
        min: 1,
        max: 20,
        prompt: 'If admitted everywhere on your list tomorrow, where would this school rank in genuine excitement — not prestige?',
        help: '1 = the very top of your heart. 20 = bottom of the pile.',
      },
      { key: 'q2', type: 'text', maxLen: 150, prompt: 'In one sentence, why would or wouldn’t you be excited to attend?' },
      { key: 'q3', type: 'toggle', options: YESNO, prompt: 'Does anything about this school make you hesitate?' },
      { key: 'q3detail', type: 'textarea', maxLen: 200, prompt: 'What gives you pause?', showIf: { key: 'q3', equals: 'yes' } },
      { key: 'q4', type: 'slider', min: 1, max: 10, prompt: 'Rate your overall gut excitement about this school.', lowLabel: 'Indifferent', highLabel: 'Thrilled' },
    ],
    score: (a) => {
      const rank = num(a, 'q1')
      const gut = num(a, 'q4')
      const complete = rank !== null && gut !== null
      if (rank === null && gut === null) return { score: null, complete: false, interpretation: interpret(null, false) }
      const rankScore = rank !== null ? clamp((21 - rank) / 2, 0, 10) : 5
      const gutScore = gut ?? 5
      const hesitate = a['q3'] === 'yes'
      let s = 0.5 * rankScore + 0.5 * gutScore + (hesitate ? -1.5 : 0.6)
      s = clamp(s, 0, 10)
      return { score: s, complete, interpretation: interpret(s, complete) }
    },
  },
  // ───────────────────────────────────────── FW2
  {
    n: 2,
    key: 'fw2',
    title: 'The Anti-Portfolio Test',
    subtitle: 'Argue for the cut. The harder it is, the stronger the keep.',
    accentBorder: 'border-l-red-400',
    accentText: 'text-red-500',
    accentDot: 'bg-red-400',
    accentHex: '#F87171',
    questions: [
      { key: 'q1', type: 'textarea', maxLen: 300, prompt: 'Write the single strongest argument for cutting this school. Be brutal.' },
      {
        key: 'q2',
        type: 'slider',
        min: 1,
        max: 10,
        prompt: 'How easily did that argument come to you?',
        lowLabel: 'Very hard to find',
        highLabel: 'Came immediately',
      },
      { key: 'q3', type: 'toggle', options: YESNO, prompt: 'Is there a counterargument that defeats your cut case?' },
      { key: 'q3detail', type: 'textarea', maxLen: 250, prompt: 'What’s the counterargument?', showIf: { key: 'q3', equals: 'yes' } },
    ],
    score: (a) => {
      const ease = num(a, 'q2')
      const counter = a['q3']
      const complete = ease !== null && (counter === 'yes' || counter === 'no')
      if (ease === null && !counter) return { score: null, complete: false, interpretation: interpret(null, false) }
      // Hard-to-find cut argument => high keep. Counterargument => boost.
      let s = ease !== null ? 10 - ease : 5
      if (counter === 'yes') s += 3
      if (counter === 'no') s -= 1
      s = clamp(s, 0, 10)
      return { score: s, complete, interpretation: interpret(s, complete) }
    },
  },
  // ───────────────────────────────────────── FW3
  {
    n: 3,
    key: 'fw3',
    title: 'What Would Have to Be True',
    subtitle: 'Surface the conditions for a happy outcome — then verify them.',
    accentBorder: 'border-l-[#0EA5E9]',
    accentText: 'text-[#0EA5E9]',
    accentDot: 'bg-[#0EA5E9]',
    accentHex: '#0EA5E9',
    questions: [
      {
        key: 'q1',
        type: 'textarea',
        maxLen: 400,
        prompt: 'What would have to be true about you, this school, or your future for you to end up here and be genuinely glad?',
      },
      {
        key: 'q2',
        type: 'tri',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'partially', label: 'Partially' },
          { value: 'no', label: 'No' },
        ],
        prompt: 'Can you verify those conditions through research or a visit?',
      },
      {
        key: 'q3',
        type: 'tri',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'in progress', label: 'In progress' },
          { value: 'no', label: 'No' },
        ],
        prompt: 'Have you already verified them?',
      },
      { key: 'q4', type: 'slider', min: 1, max: 10, prompt: 'How realistic are those conditions?', lowLabel: 'Very unlikely', highLabel: 'Already confirmed' },
    ],
    score: (a) => {
      const real = num(a, 'q4')
      const q2 = a['q2']
      const q3 = a['q3']
      const complete = real !== null && !!q2 && !!q3
      if (real === null && !q2 && !q3) return { score: null, complete: false, interpretation: interpret(null, false) }
      const verifyMap: Record<string, number> = { yes: 10, partially: 6, no: 2 }
      const verifiedMap: Record<string, number> = { yes: 10, 'in progress': 5, no: 2 }
      const v = typeof q2 === 'string' ? verifyMap[q2] ?? 5 : 5
      const vd = typeof q3 === 'string' ? verifiedMap[q3] ?? 5 : 5
      const s = clamp(0.5 * (real ?? 5) + 0.25 * v + 0.25 * vd, 0, 10)
      return { score: s, complete, interpretation: interpret(s, complete) }
    },
  },
  // ───────────────────────────────────────── FW4
  {
    n: 4,
    key: 'fw4',
    title: 'Campus Visit Veto',
    subtitle: 'No full recommendation without seeing the place.',
    accentBorder: 'border-l-green-500',
    accentText: 'text-green-600 dark:text-green-400',
    accentDot: 'bg-green-500',
    accentHex: '#2D6A4F',
    questions: [
      {
        key: 'q1',
        type: 'segmented',
        options: [
          { value: 'yes', label: 'Visited' },
          { value: 'virtual', label: 'Virtual only' },
          { value: 'no', label: 'Not visited' },
        ],
        prompt: 'Have you visited this campus?',
      },
      { key: 'q2', type: 'textarea', maxLen: 300, prompt: 'What concerned you most during your visit?', showIf: { key: 'q1', equals: 'yes' } },
      { key: 'q3', type: 'toggle', options: YESNO, prompt: 'Did you find a dealbreaker?', showIf: { key: 'q1', equals: 'yes' } },
      { key: 'q3detail', type: 'textarea', maxLen: 250, prompt: 'Describe the dealbreaker.', showIf: { key: 'q3', equals: 'yes' } },
      {
        key: 'q4',
        type: 'slider',
        min: 1,
        max: 10,
        prompt: 'How much did this campus feel like you?',
        lowLabel: 'Not at all',
        highLabel: 'Completely',
        showIf: { key: 'q1', equals: 'yes' },
      },
    ],
    score: (a) => {
      const visited = a['q1']
      if (visited === 'yes') {
        const feel = num(a, 'q4') ?? 5
        const dealbreaker = a['q3'] === 'yes'
        const s = dealbreaker ? clamp(Math.min(feel, 2.5), 0, 10) : clamp(feel, 0, 10)
        return { score: s, complete: true, interpretation: interpret(s, true) }
      }
      if (visited === 'virtual') {
        return { score: 5, complete: false, interpretation: 'Virtual only — visit to confirm' }
      }
      if (visited === 'no') {
        return { score: null, complete: false, interpretation: 'Incomplete — visit required' }
      }
      return { score: null, complete: false, interpretation: interpret(null, false) }
    },
  },
  // ───────────────────────────────────────── FW5
  {
    n: 5,
    key: 'fw5',
    title: 'The Peer Test',
    subtitle: 'Are these the people you want around you for four years?',
    accentBorder: 'border-l-[#7C3AED]',
    accentText: 'text-[#7C3AED]',
    accentDot: 'bg-[#7C3AED]',
    accentHex: '#7C3AED',
    questions: [
      { key: 'q1', type: 'slider', min: 1, max: 10, prompt: 'When you picture the students here, do they feel like your people?', lowLabel: 'Strangers', highLabel: 'My people' },
      { key: 'q2', type: 'textarea', maxLen: 200, prompt: 'Describe what you imagine the typical student here is like.' },
      {
        key: 'q3',
        type: 'segmented',
        options: [
          { value: 'Yes', label: 'Yes' },
          { value: 'Mostly', label: 'Mostly' },
          { value: 'Somewhat', label: 'Somewhat' },
          { value: 'No', label: 'No' },
        ],
        prompt: 'Is that the person you want to spend four years around?',
      },
    ],
    score: (a) => {
      const q1 = num(a, 'q1')
      const q3 = a['q3']
      const complete = q1 !== null && !!q3
      if (q1 === null && !q3) return { score: null, complete: false, interpretation: interpret(null, false) }
      const q3map: Record<string, number> = { Yes: 10, Mostly: 7, Somewhat: 4, No: 1 }
      const s = clamp(0.5 * (q1 ?? 5) + 0.5 * (typeof q3 === 'string' ? q3map[q3] ?? 5 : 5), 0, 10)
      return { score: s, complete, interpretation: interpret(s, complete) }
    },
  },
  // ───────────────────────────────────────── FW6
  {
    n: 6,
    key: 'fw6',
    title: 'Regret Minimization',
    subtitle: 'Look back from age 30. Which way does the regret point?',
    accentBorder: 'border-l-amber-400',
    accentText: 'text-amber-500',
    accentDot: 'bg-amber-400',
    accentHex: '#F59E0B',
    questions: [
      { key: 'q1', type: 'slider', min: 1, max: 10, prompt: 'If admitted and you chose NOT to go, how much would you regret it at age 30?', lowLabel: 'No regret', highLabel: 'Enormous regret' },
      { key: 'q2', type: 'toggle', options: YESNO, prompt: 'If you DID go, is there a future where you’d regret that choice?' },
      { key: 'q2detail', type: 'textarea', maxLen: 250, prompt: 'Describe that regret.', showIf: { key: 'q2', equals: 'yes' } },
      {
        key: 'q3',
        type: 'segmented',
        options: [
          { value: 'first', label: 'Genuine first choice' },
          { value: 'strong', label: 'Strong option' },
          { value: 'safety', label: 'Safety' },
          { value: 'covering', label: 'Just covering bases' },
        ],
        prompt: 'Overall, does attending this school feel like a gain or a hedge?',
      },
    ],
    score: (a) => {
      const q1 = num(a, 'q1')
      const q3 = a['q3']
      const complete = q1 !== null && !!q3
      if (q1 === null && !q3) return { score: null, complete: false, interpretation: interpret(null, false) }
      const mult: Record<string, number> = { first: 1.0, strong: 0.92, safety: 0.78, covering: 0.6 }
      const base = (q1 ?? 5) + (a['q2'] === 'yes' ? -2 : 0.5)
      const m = typeof q3 === 'string' ? mult[q3] ?? 0.85 : 0.85
      const s = clamp(base * m, 0, 10)
      return { score: s, complete, interpretation: interpret(s, complete) }
    },
  },
  // ───────────────────────────────────────── FW7
  {
    n: 7,
    key: 'fw7',
    title: 'The One Strong Reason Rule',
    subtitle: 'One non-replicable reason — or reconsider the school.',
    accentBorder: 'border-l-teal-500',
    accentText: 'text-teal-600 dark:text-teal-400',
    accentDot: 'bg-teal-500',
    accentHex: '#14B8A6',
    questions: [
      { key: 'reason', type: 'reason', prompt: 'Your One Strong Reason', help: 'The single non-replicable reason this school is on your list. Editable here.' },
      {
        key: 'q1',
        type: 'tri',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'somewhat', label: 'Somewhat' },
          { value: 'no', label: 'No' },
        ],
        prompt: 'Is this reason truly specific and non-replicable — something no other school offers you?',
      },
      { key: 'q2', type: 'school-select', prompt: 'Which school on your list is most similar to this one?' },
      { key: 'q3', type: 'textarea', maxLen: 300, prompt: 'What does this school offer that your most similar alternative does not?' },
    ],
    score: (a, ctx) => {
      const q1 = a['q1']
      const hasReason = !!(ctx.oneStrongReason && ctx.oneStrongReason.trim().length > 0)
      const complete = !!q1 && hasReason
      if (!q1 && !hasReason) return { score: null, complete: false, interpretation: interpret(null, false) }
      const q1map: Record<string, number> = { yes: 10, somewhat: 5, no: 1 }
      const spec = typeof q1 === 'string' ? q1map[q1] ?? 3 : 3
      const diffLen = str(a, 'q3').trim().length
      const diff = diffLen >= 40 ? 3 : diffLen >= 12 ? 1.5 : 0
      let s = 0.7 * spec + diff
      if (!hasReason) s -= 3
      s = clamp(s, 0, 10)
      return { score: s, complete, interpretation: interpret(s, complete) }
    },
  },
  // ───────────────────────────────────────── FW8
  {
    n: 8,
    key: 'fw8',
    title: 'Safety Net Check',
    subtitle: 'If this were the outcome — relief, or resignation?',
    accentBorder: 'border-l-slate-400',
    accentText: 'text-slate-500 dark:text-slate-300',
    accentDot: 'bg-slate-400',
    accentHex: '#64748B',
    questions: [
      {
        key: 'q1',
        type: 'slider',
        min: 1,
        max: 10,
        prompt: 'If every school ranked above this rejected you and this was your best option, would you genuinely be happy attending?',
        lowLabel: 'Not at all',
        highLabel: 'Absolutely',
      },
      { key: 'q2', type: 'textarea', maxLen: 300, prompt: 'What would you need to know or experience to feel fully confident about this school?' },
      {
        key: 'q3',
        type: 'segmented',
        options: [
          { value: 'disappointment', label: 'A disappointment' },
          { value: 'acceptable', label: 'Acceptable' },
          { value: 'good', label: 'Genuinely good' },
        ],
        prompt: 'Does the thought of this school as your outcome feel like…',
      },
    ],
    score: (a) => {
      const q1 = num(a, 'q1')
      const q3 = a['q3']
      const complete = q1 !== null && !!q3
      if (q1 === null && !q3) return { score: null, complete: false, interpretation: interpret(null, false) }
      const q3map: Record<string, number> = { good: 10, acceptable: 6, disappointment: 2 }
      const s = clamp(0.55 * (q1 ?? 5) + 0.45 * (typeof q3 === 'string' ? q3map[q3] ?? 5 : 5), 0, 10)
      return { score: s, complete, interpretation: interpret(s, complete) }
    },
  },
]

export const FRAMEWORK_BY_KEY: Record<string, Framework> = FRAMEWORKS.reduce((acc, f) => {
  acc[f.key] = f
  return acc
}, {} as Record<string, Framework>)

export function defaultFrameworkWeights(): Record<number, number> {
  return FRAMEWORKS.reduce((acc, f) => {
    acc[f.n] = 5
    return acc
  }, {} as Record<number, number>)
}

/** Returns true when a question should be shown given current answers. */
export function questionVisible(q: FwQuestion, a: Record<string, FrameworkAnswerValue>): boolean {
  if (!q.showIf) return true
  return a[q.showIf.key] === q.showIf.equals
}
