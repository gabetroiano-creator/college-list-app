import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ActivityItem,
  AppState,
  FrameworkAnswerValue,
  Grade,
  GradeLetter,
  School,
} from '@/lib/types'
import { defaultWeights } from '@/lib/criteria'
import { defaultFrameworkWeights, FRAMEWORK_BY_KEY, FRAMEWORKS } from '@/lib/frameworks'
import { computeFrameworkResults } from '@/lib/scoring'
import { uid } from '@/lib/utils'

export interface NewSchoolInput {
  name: string
  tier?: School['tier']
  status?: School['status']
  priority?: number
  bestRound?: School['bestRound']
  visitStatus?: School['visitStatus']
  admitRate?: number | null
  usNewsRank?: number | null
  enrollment?: number | null
  location?: string
  distanceFromNYC?: number | null
  oneStrongReason?: string
  whyConsidering?: string
  concerns?: string
  notes?: string
}

interface Actions {
  addSchool: (input: NewSchoolInput) => string
  updateSchool: (id: string, patch: Partial<School>) => void
  removeSchool: (id: string) => void
  duplicateSchool: (id: string) => string | null

  setMatrixWeight: (criterionId: string, value: number) => void
  resetMatrixWeights: () => void
  setMatrixScore: (schoolId: string, criterionId: string, value: number) => void

  setFrameworkAnswer: (schoolId: string, fwKey: string, qKey: string, value: FrameworkAnswerValue) => void
  setFrameworkWeight: (n: number, value: number) => void

  setGrade: (schoolId: string, letter: GradeLetter) => void
  setGradeJustification: (schoolId: string, text: string) => void

  setDashboardNotes: (text: string) => void
  clearActivity: () => void

  setSidebarExpanded: (v: boolean) => void
  toggleSidebar: () => void
  setDarkMode: (v: boolean) => void
  toggleDarkMode: () => void
  setActiveSection: (s: string) => void
  setComparisonSchools: (ids: string[]) => void

  seedSampleData: () => void
  resetAll: () => void
}

export type Store = AppState & Actions

const MAX_ACTIVITY = 20

function recomputeFrameworkScores(state: AppState, schoolId: string): Record<number, number> {
  const school = state.schools.find((s) => s.id === schoolId)
  const results = computeFrameworkResults(state.frameworkAnswers[schoolId], {
    oneStrongReason: school?.oneStrongReason,
    visitStatus: school?.visitStatus,
  })
  const out: Record<number, number> = {}
  for (const fw of FRAMEWORKS) {
    const r = results[fw.n]
    if (r.score !== null) out[fw.n] = r.score
  }
  return out
}

function withActivity(activity: ActivityItem[], item: Omit<ActivityItem, 'id' | 'at'>): ActivityItem[] {
  const next: ActivityItem = { ...item, id: uid('act'), at: Date.now() }
  return [next, ...activity].slice(0, MAX_ACTIVITY)
}

const initialState: AppState = {
  schools: [],
  matrixWeights: defaultWeights(),
  matrixScores: {},
  frameworkAnswers: {},
  frameworkScores: {},
  frameworkWeights: defaultFrameworkWeights(),
  grades: {},
  dashboardNotes: '',
  recentActivity: [],
  sidebarExpanded: true,
  darkMode: false,
  activeSection: 'dashboard',
  comparisonSchools: [],
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      addSchool: (input) => {
        const id = uid('sch')
        const now = Date.now()
        const school: School = {
          id,
          name: input.name.trim(),
          tier: input.tier ?? 'Target',
          status: input.status ?? 'Applying',
          priority: input.priority ?? 3,
          bestRound: input.bestRound ?? 'RD',
          visitStatus: input.visitStatus ?? 'Not Visited',
          admitRate: input.admitRate ?? null,
          usNewsRank: input.usNewsRank ?? null,
          enrollment: input.enrollment ?? null,
          location: input.location ?? '',
          distanceFromNYC: input.distanceFromNYC ?? null,
          oneStrongReason: input.oneStrongReason ?? '',
          whyConsidering: input.whyConsidering ?? '',
          concerns: input.concerns ?? '',
          notes: input.notes ?? '',
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({
          schools: [...s.schools, school],
          recentActivity: withActivity(s.recentActivity, {
            kind: 'school',
            schoolId: id,
            message: `Added ${school.name}`,
          }),
        }))
        return id
      },

      updateSchool: (id, patch) =>
        set((s) => {
          const schools = s.schools.map((sc) => (sc.id === id ? { ...sc, ...patch, updatedAt: Date.now() } : sc))
          const school = schools.find((sc) => sc.id === id)
          // If something that affects framework scoring changed, recompute.
          const next: Partial<AppState> = { schools }
          if ('oneStrongReason' in patch || 'visitStatus' in patch) {
            next.frameworkScores = {
              ...s.frameworkScores,
              [id]: recomputeFrameworkScores({ ...s, schools }, id),
            }
          }
          return {
            ...next,
            recentActivity: withActivity(s.recentActivity, {
              kind: 'school',
              schoolId: id,
              message: `Updated ${school?.name ?? 'school'}`,
            }),
          }
        }),

      removeSchool: (id) =>
        set((s) => {
          const school = s.schools.find((sc) => sc.id === id)
          const matrixScores = { ...s.matrixScores }
          delete matrixScores[id]
          const frameworkAnswers = { ...s.frameworkAnswers }
          delete frameworkAnswers[id]
          const frameworkScores = { ...s.frameworkScores }
          delete frameworkScores[id]
          const grades = { ...s.grades }
          delete grades[id]
          return {
            schools: s.schools.filter((sc) => sc.id !== id),
            matrixScores,
            frameworkAnswers,
            frameworkScores,
            grades,
            comparisonSchools: s.comparisonSchools.filter((x) => x !== id),
            recentActivity: withActivity(s.recentActivity, {
              kind: 'school',
              message: `Removed ${school?.name ?? 'school'}`,
            }),
          }
        }),

      duplicateSchool: (id) => {
        const s = get()
        const orig = s.schools.find((sc) => sc.id === id)
        if (!orig) return null
        const newId = uid('sch')
        const now = Date.now()
        const copy: School = { ...orig, id: newId, name: `${orig.name} (copy)`, createdAt: now, updatedAt: now }
        set((st) => ({
          schools: [...st.schools, copy],
          matrixScores: st.matrixScores[id] ? { ...st.matrixScores, [newId]: { ...st.matrixScores[id] } } : st.matrixScores,
          frameworkAnswers: st.frameworkAnswers[id]
            ? { ...st.frameworkAnswers, [newId]: JSON.parse(JSON.stringify(st.frameworkAnswers[id])) }
            : st.frameworkAnswers,
          frameworkScores: st.frameworkScores[id] ? { ...st.frameworkScores, [newId]: { ...st.frameworkScores[id] } } : st.frameworkScores,
          recentActivity: withActivity(st.recentActivity, {
            kind: 'school',
            schoolId: newId,
            message: `Duplicated ${orig.name}`,
          }),
        }))
        return newId
      },

      setMatrixWeight: (criterionId, value) =>
        set((s) => ({ matrixWeights: { ...s.matrixWeights, [criterionId]: value } })),

      resetMatrixWeights: () =>
        set((s) => ({
          matrixWeights: defaultWeights(),
          recentActivity: withActivity(s.recentActivity, { kind: 'matrix', message: 'Reset matrix weights' }),
        })),

      setMatrixScore: (schoolId, criterionId, value) =>
        set((s) => {
          const prev = s.matrixScores[schoolId] ?? {}
          const school = s.schools.find((sc) => sc.id === schoolId)
          const firstTouch = Object.keys(prev).length === 0
          return {
            matrixScores: { ...s.matrixScores, [schoolId]: { ...prev, [criterionId]: value } },
            recentActivity: firstTouch
              ? withActivity(s.recentActivity, { kind: 'matrix', schoolId, message: `Started scoring ${school?.name ?? 'school'}` })
              : s.recentActivity,
          }
        }),

      setFrameworkAnswer: (schoolId, fwKey, qKey, value) =>
        set((s) => {
          const schoolAnswers = s.frameworkAnswers[schoolId] ?? {}
          const fwAnswers = schoolAnswers[fwKey] ?? {}
          const nextAnswers = {
            ...s.frameworkAnswers,
            [schoolId]: { ...schoolAnswers, [fwKey]: { ...fwAnswers, [qKey]: value } },
          }
          const nextState = { ...s, frameworkAnswers: nextAnswers }
          const scores = recomputeFrameworkScores(nextState, schoolId)
          const wasComplete = !!s.frameworkScores[schoolId]?.[FRAMEWORK_BY_KEY[fwKey]?.n ?? -1]
          const school = s.schools.find((sc) => sc.id === schoolId)
          const fwNum = FRAMEWORK_BY_KEY[fwKey]?.n
          const nowComplete = fwNum ? scores[fwNum] !== undefined : false
          return {
            frameworkAnswers: nextAnswers,
            frameworkScores: { ...s.frameworkScores, [schoolId]: scores },
            recentActivity:
              !wasComplete && nowComplete
                ? withActivity(s.recentActivity, {
                    kind: 'framework',
                    schoolId,
                    message: `${FRAMEWORK_BY_KEY[fwKey]?.title ?? 'Framework'} — ${school?.name ?? 'school'}`,
                  })
                : s.recentActivity,
          }
        }),

      setFrameworkWeight: (n, value) => set((s) => ({ frameworkWeights: { ...s.frameworkWeights, [n]: value } })),

      setGrade: (schoolId, letter) =>
        set((s) => {
          const prev = s.grades[schoolId]
          const history = prev?.history ? [...prev.history] : []
          if (!prev?.letter || prev.letter !== letter) {
            if (prev?.letter) history.push({ letter: prev.letter, at: prev.updatedAt })
          }
          const grade: Grade = {
            letter,
            justification: prev?.justification ?? '',
            history,
            updatedAt: Date.now(),
          }
          const school = s.schools.find((sc) => sc.id === schoolId)
          const changed = prev?.letter && prev.letter !== letter
          return {
            grades: { ...s.grades, [schoolId]: grade },
            recentActivity: withActivity(s.recentActivity, {
              kind: 'grade',
              schoolId,
              message: changed
                ? `Graded ${school?.name ?? 'school'} ${prev?.letter} → ${letter}`
                : `Graded ${school?.name ?? 'school'} ${letter}`,
            }),
          }
        }),

      setGradeJustification: (schoolId, text) =>
        set((s) => {
          const prev = s.grades[schoolId]
          const grade: Grade = {
            letter: prev?.letter ?? null,
            justification: text,
            history: prev?.history ?? [],
            updatedAt: Date.now(),
          }
          return { grades: { ...s.grades, [schoolId]: grade } }
        }),

      setDashboardNotes: (text) => set({ dashboardNotes: text }),

      clearActivity: () => set({ recentActivity: [] }),

      setSidebarExpanded: (v) => set({ sidebarExpanded: v }),
      toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
      setDarkMode: (v) => set({ darkMode: v }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setActiveSection: (section) => set({ activeSection: section }),
      setComparisonSchools: (ids) => set({ comparisonSchools: ids.slice(0, 4) }),

      seedSampleData: () => {
        const s = get()
        if (s.schools.length > 0) return
        seedInto(set)
      },

      resetAll: () =>
        set({
          ...initialState,
          matrixWeights: defaultWeights(),
          frameworkWeights: defaultFrameworkWeights(),
          darkMode: get().darkMode,
          sidebarExpanded: get().sidebarExpanded,
        }),
    }),
    {
      name: 'college-list-app-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

// ───────────────────────── sample data (opt-in) ─────────────────────────
function seedInto(set: (fn: (s: Store) => Partial<Store>) => void) {
  set((s) => {
    const now = Date.now()
    const mk = (p: NewSchoolInput): School => ({
      id: uid('sch'),
      name: p.name,
      tier: p.tier ?? 'Target',
      status: p.status ?? 'Applying',
      priority: p.priority ?? 3,
      bestRound: p.bestRound ?? 'RD',
      visitStatus: p.visitStatus ?? 'Not Visited',
      admitRate: p.admitRate ?? null,
      usNewsRank: p.usNewsRank ?? null,
      enrollment: p.enrollment ?? null,
      location: p.location ?? '',
      distanceFromNYC: p.distanceFromNYC ?? null,
      oneStrongReason: p.oneStrongReason ?? '',
      whyConsidering: p.whyConsidering ?? '',
      concerns: p.concerns ?? '',
      notes: p.notes ?? '',
      createdAt: now,
      updatedAt: now,
    })
    const samples: School[] = [
      mk({ name: 'Georgetown University', tier: 'Reach', priority: 5, bestRound: 'REA', visitStatus: 'Visited', admitRate: 18, usNewsRank: 24, enrollment: 7500, location: 'Washington, D.C.', distanceFromNYC: 4, oneStrongReason: 'The only school combining a top policy school with a Jesuit mission and a direct D.C. pipeline.', whyConsidering: 'Walsh School of Foreign Service and proximity to federal environmental policy work.', concerns: 'Pre-professional intensity may crowd out research.' }),
      mk({ name: 'Tufts University', tier: 'Target', priority: 4, bestRound: 'ED2', visitStatus: 'Visited', admitRate: 28, usNewsRank: 40, enrollment: 6700, location: 'Medford, MA', distanceFromNYC: 4, oneStrongReason: 'Strong environmental program with a genuine interdisciplinary culture and accessible faculty.', whyConsidering: 'Environmental studies plus active civic engagement.' }),
      mk({ name: 'Boston College', tier: 'Target', priority: 4, bestRound: 'ED1', visitStatus: 'Planned', admitRate: 26, usNewsRank: 39, enrollment: 9400, location: 'Chestnut Hill, MA', distanceFromNYC: 4, oneStrongReason: 'Jesuit values alignment paired with a growing environmental studies major.', whyConsidering: 'Values fit and finance recruiting.' }),
      mk({ name: 'University of Virginia', tier: 'Reach', priority: 3, bestRound: 'EA', visitStatus: 'Not Visited', admitRate: 16, usNewsRank: 24, enrollment: 17000, location: 'Charlottesville, VA', distanceFromNYC: 6, oneStrongReason: 'Public-Ivy environmental science depth at a fraction of the cost.', concerns: 'Large size and distance from home.' }),
      mk({ name: 'Colby College', tier: 'Target', priority: 3, bestRound: 'ED1', visitStatus: 'Visited', admitRate: 22, usNewsRank: 25, enrollment: 2200, location: 'Waterville, ME', distanceFromNYC: 6, oneStrongReason: 'New environmental institute with guaranteed funded research for undergrads.', concerns: 'Isolated location.' }),
      mk({ name: 'New York University', tier: 'Reach', priority: 2, bestRound: 'RD', visitStatus: 'Visited', admitRate: 12, usNewsRank: 30, enrollment: 29000, location: 'New York, NY', distanceFromNYC: 0, oneStrongReason: 'Unmatched access to NYC finance and impact-investing internships during term.', concerns: 'No central campus; huge.' }),
    ]
    const matrixScores: Record<string, Record<string, number>> = {}
    samples.forEach((sc, i) => {
      const seed = (base: number) => {
        const o: Record<string, number> = {}
        for (let n = 1; n <= 30; n++) {
          o[`c${n}`] = Math.max(1, Math.min(10, Math.round(base + Math.sin(n * (i + 1)) * 2.5)))
        }
        return o
      }
      matrixScores[sc.id] = seed(6 + i * 0.2)
    })
    return {
      schools: samples,
      matrixScores,
      recentActivity: withActivity(s.recentActivity, { kind: 'system', message: 'Loaded a 6-school example list' }),
    }
  })
}
