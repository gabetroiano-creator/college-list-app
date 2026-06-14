import { useMemo, useState, useEffect } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
  ReferenceLine,
} from 'recharts'
import { Star, GraduationCap, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/EmptyState'
import { SchoolSelect } from '@/components/common/SchoolSelect'
import { GradePicker } from '@/components/common/GradePicker'
import { TierBadge, GradeBadge } from '@/components/common/badges'
import { ScorePill, SectionLabel } from '@/components/common/bits'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/uiStore'
import { useAllMetrics } from '@/hooks/metrics'
import { GRADE_ORDER, gradeClasses, gpaFor } from '@/lib/grades'
import { TIER_CLASSES } from '@/lib/schoolMeta'
import { cn, fmtScore } from '@/lib/utils'
import { toastSaved } from '@/lib/toast'
import { format } from 'date-fns'

export function Grades() {
  const schools = useStore((s) => s.schools)
  const grades = useStore((s) => s.grades)
  const setGrade = useStore((s) => s.setGrade)
  const setJust = useStore((s) => s.setGradeJustification)
  const setActive = useStore((s) => s.setActiveSection)
  const darkMode = useStore((s) => s.darkMode)
  const openDrawer = useUI((s) => s.openDrawer)
  const metrics = useAllMetrics()

  const [selected, setSelected] = useState<string | null>(schools[0]?.id ?? null)
  useEffect(() => {
    if (selected && !schools.find((s) => s.id === selected)) setSelected(schools[0]?.id ?? null)
  }, [schools, selected])

  const sel = schools.find((s) => s.id === selected)
  const selGrade = selected ? grades[selected] : undefined

  const leaderboard = useMemo(
    () =>
      [...metrics]
        .filter((m) => grades[m.school.id]?.letter)
        .sort((a, b) => (b.gpa ?? 0) - (a.gpa ?? 0)),
    [metrics, grades],
  )

  const scatter = useMemo(
    () =>
      metrics
        .filter((m) => m.matrixTotal !== null && m.gpa !== null)
        .map((m) => ({ x: m.matrixTotal as number, y: m.gpa as number, name: m.school.name, color: TIER_CLASSES[m.school.tier].hex, id: m.school.id })),
    [metrics],
  )

  const dist = useMemo(() => {
    const counts: Record<string, number> = {}
    GRADE_ORDER.forEach((g) => (counts[g] = 0))
    Object.values(grades).forEach((g) => g.letter && (counts[g.letter] += 1))
    return GRADE_ORDER.map((g) => ({ grade: g, count: counts[g], color: gradeClasses(g).hex })).filter((d) => d.count > 0)
  }, [grades])

  if (schools.length === 0) {
    return (
      <EmptyState
        icon={<Star className="h-7 w-7" />}
        title="No schools to grade yet"
        description="Grades are your gut, holistic verdict on each school — separate from the matrix. Once you add schools you can grade them A+ through F, and a scatter plot will reveal where your instinct and the numbers agree."
        action={
          <Button variant="gold" size="lg" onClick={() => setActive('add')}>
            <GraduationCap className="h-5 w-5" /> Add a school
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Grading card */}
        <Card className="p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[200px] flex-1">
              <SchoolSelect value={selected} onChange={setSelected} />
            </div>
            {sel && (
              <div className="flex items-center gap-3">
                <GradeBadge letter={selGrade?.letter} size="lg" />
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">GPA value</div>
                  <div className="font-serif text-2xl font-semibold tabular-nums text-navy-800 dark:text-white">
                    {selGrade?.letter ? gpaFor(selGrade.letter)?.toFixed(1) : '—'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {sel && selected && (
            <div className="space-y-5">
              <div>
                <SectionLabel className="mb-2">Assign a grade</SectionLabel>
                <GradePicker value={selGrade?.letter} onChange={(g) => { setGrade(selected, g); toastSaved('Grade saved') }} />
              </div>

              {selGrade?.history && selGrade.history.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-navy-900/30">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Trend</span>
                  {selGrade.history.map((h, i) => (
                    <span key={i} className="flex items-center gap-2 text-slate-500">
                      <GradeBadge letter={h.letter} size="sm" />
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  ))}
                  <GradeBadge letter={selGrade.letter} size="sm" />
                  <span className="ml-auto text-xs text-slate-400">updated {format(selGrade.updatedAt, 'MMM d')}</span>
                </div>
              )}

              <div>
                <SectionLabel className="mb-2">Why this grade?</SectionLabel>
                <Textarea
                  value={selGrade?.justification ?? ''}
                  maxLen={200}
                  placeholder="What earns this school its grade for your goals? Be honest about the gut feeling behind it."
                  onChange={(e) => { setJust(selected, e.target.value); toastSaved() }}
                />
              </div>

              {(() => {
                const m = metrics.find((x) => x.school.id === selected)
                return (
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 dark:border-navy-700">
                    <MiniStat label="Matrix" value={<ScorePill score={m?.matrixTotal} />} />
                    <MiniStat label="Frameworks" value={<ScorePill score={m?.frameworkTotal} />} />
                    <MiniStat label="Combined" value={<ScorePill score={m?.combined} />} />
                  </div>
                )
              })()}
            </div>
          )}
        </Card>

        {/* Leaderboard */}
        <Card className="p-5">
          <h4 className="mb-3 font-serif text-base font-semibold text-navy-800 dark:text-white">Grade ranking</h4>
          {leaderboard.length ? (
            <ol className="space-y-2">
              {leaderboard.map((m, i) => (
                <li
                  key={m.school.id}
                  onClick={() => setSelected(m.school.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-navy-700',
                    m.school.id === selected && 'bg-gold-400/10',
                  )}
                >
                  <span className="w-4 text-center text-xs font-semibold tabular-nums text-slate-400">{i + 1}</span>
                  <GradeBadge letter={grades[m.school.id]?.letter} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-sm font-medium text-navy-800 dark:text-white">{m.school.name}</span>
                  </span>
                  <TierBadge tier={m.school.tier} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No grades yet. Grade a school to rank it here.</p>
          )}
        </Card>
      </div>

      {/* Scatter + distribution */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h4 className="font-serif text-base font-semibold text-navy-800 dark:text-white">Grade vs. matrix score</h4>
          <p className="mb-3 text-xs text-slate-400">
            Top-right schools are your strongest bets — high objective score and a high gut grade. Divergence reveals where instinct and numbers disagree.
          </p>
          {scatter.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 0 }}>
                <CartesianGrid stroke={darkMode ? '#243558' : '#E2E8F0'} strokeDasharray="3 3" />
                <ReferenceLine x={5} stroke={darkMode ? '#334569' : '#CBD5E1'} strokeDasharray="4 4" />
                <ReferenceLine y={2.15} stroke={darkMode ? '#334569' : '#CBD5E1'} strokeDasharray="4 4" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Matrix"
                  domain={[0, 10]}
                  tick={{ fontSize: 11, fill: darkMode ? '#94A3B8' : '#64748B' }}
                  label={{ value: 'Matrix score →', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#94A3B8' }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="GPA"
                  domain={[0, 4.3]}
                  tick={{ fontSize: 11, fill: darkMode ? '#94A3B8' : '#64748B' }}
                  label={{ value: 'Grade GPA →', angle: -90, position: 'insideLeft', offset: 16, fontSize: 11, fill: '#94A3B8' }}
                />
                <ZAxis range={[120, 120]} />
                <RTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${darkMode ? '#243558' : '#E2E8F0'}`, background: darkMode ? '#1B2A4A' : '#fff', fontSize: 12 }}
                  formatter={(v: any, n: any) => [typeof v === 'number' ? v.toFixed(1) : v, n]}
                  labelFormatter={() => ''}
                />
                <Scatter data={scatter} onClick={(d: any) => d?.id && openDrawer(d.id)}>
                  {scatter.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                  <LabelList dataKey="name" position="top" style={{ fontSize: 10, fill: darkMode ? '#CBD5E1' : '#475569' }} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[320px] items-center justify-center text-center text-sm text-slate-400">
              Score a school's matrix and assign it a grade to plot it here.
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h4 className="font-serif text-base font-semibold text-navy-800 dark:text-white">Distribution</h4>
          <p className="mb-3 text-xs text-slate-400">Schools per letter grade</p>
          {dist.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dist} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis type="category" dataKey="grade" tick={{ fontSize: 12, fill: darkMode ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} width={28} />
                <RTooltip cursor={{ fill: darkMode ? '#243558' : '#F1F5F9' }} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, background: darkMode ? '#1B2A4A' : '#fff' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {dist.map((d) => (
                    <Cell key={d.grade} fill={d.color} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: darkMode ? '#CBD5E1' : '#475569' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-center text-sm text-slate-400">No grades assigned yet.</div>
          )}
          <p className="mt-2 text-center text-xs text-slate-400">
            {Object.values(grades).filter((g) => g.letter).length} of {schools.length} graded
          </p>
        </Card>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-navy-900/30">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 font-serif text-lg">{value}</div>
    </div>
  )
}
