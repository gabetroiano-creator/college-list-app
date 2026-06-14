import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  LabelList,
  ScatterChart,
  Scatter,
  CartesianGrid,
  Tooltip as RTooltip,
  ZAxis,
  LabelList as SLabelList,
} from 'recharts'
import { GitCompare, Plus, X, Check, Swords } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmptyState } from '@/components/common/EmptyState'
import { RadarPanel } from '@/components/common/RadarPanel'
import { TierBadge, GradeBadge, RecBadge } from '@/components/common/badges'
import { ScorePill, SectionLabel } from '@/components/common/bits'
import { useStore } from '@/store/useStore'
import { useAllMetrics, type SchoolMetrics } from '@/hooks/metrics'
import { CRITERIA, CRITERIA_GROUPS, CRITERIA_BY_GROUP } from '@/lib/criteria'
import { categorySubtotal } from '@/lib/scoring'
import { FRAMEWORKS } from '@/lib/frameworks'
import { TIER_CLASSES, admitRateClass, scoreBarColor } from '@/lib/schoolMeta'
import { cn, fmtScore, pct } from '@/lib/utils'

const SERIES_COLORS = ['#C9A84C', '#3D5A99', '#2D6A4F', '#E07A5F']

export function Comparison() {
  const schools = useStore((s) => s.schools)
  const selectedIds = useStore((s) => s.comparisonSchools)
  const setComparison = useStore((s) => s.setComparisonSchools)
  const matrixScores = useStore((s) => s.matrixScores)
  const weights = useStore((s) => s.matrixWeights)
  const grades = useStore((s) => s.grades)
  const darkMode = useStore((s) => s.darkMode)
  const setActive = useStore((s) => s.setActiveSection)
  const allMetrics = useAllMetrics()

  const selected = useMemo(
    () => selectedIds.map((id) => allMetrics.find((m) => m.school.id === id)).filter((m): m is SchoolMetrics => !!m),
    [selectedIds, allMetrics],
  )

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) setComparison(selectedIds.filter((x) => x !== id))
    else if (selectedIds.length < 4) setComparison([...selectedIds, id])
  }

  if (schools.length < 2) {
    return (
      <EmptyState
        icon={<GitCompare className="h-7 w-7" />}
        title="Add at least two schools to compare"
        description="The comparison view puts schools side by side across every stat, all 30 matrix criteria, and the eight frameworks — then writes a head-to-head breakdown of who wins each category. Add a couple more schools to unlock it."
        action={
          <Button variant="gold" size="lg" onClick={() => setActive('add')}>
            <Plus className="h-5 w-5" /> Add a school
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Selector */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-navy-700 dark:text-slate-200">Comparing</span>
          {selected.map((m, i) => (
            <span
              key={m.school.id}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium"
              style={{ borderColor: SERIES_COLORS[i], color: SERIES_COLORS[i] }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SERIES_COLORS[i] }} />
              <span className="font-serif">{m.school.name}</span>
              <button onClick={() => toggle(m.school.id)} className="opacity-60 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {selected.length < 4 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-500 transition-colors hover:border-gold-400 hover:text-gold-600 dark:border-navy-600 dark:text-slate-400">
                  <Plus className="h-3.5 w-3.5" /> Add school
                </button>
              </PopoverTrigger>
              <PopoverContent className="max-h-64 w-60 overflow-y-auto p-1.5">
                {schools.map((s) => {
                  const active = selectedIds.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      disabled={!active && selectedIds.length >= 4}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-navy-700 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-navy-700"
                    >
                      <span className="truncate font-serif">{s.name}</span>
                      {active && <Check className="h-4 w-4 shrink-0 text-gold-500" />}
                    </button>
                  )
                })}
              </PopoverContent>
            </Popover>
          )}
          <span className="ml-auto text-xs text-slate-400">{selected.length}/4 selected</span>
        </div>
      </Card>

      {selected.length < 2 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-slate-400">Select at least two schools above to see them side by side.</p>
        </Card>
      ) : (
        <Tabs defaultValue="stats">
          <TabsList className="mb-2">
            <TabsTrigger value="stats">Quick stats</TabsTrigger>
            <TabsTrigger value="matrix">Matrix</TabsTrigger>
            <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
            <TabsTrigger value="viz">Visualize</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <QuickStats selected={selected} grades={grades} />
          </TabsContent>
          <TabsContent value="matrix">
            <MatrixCompare selected={selected} matrixScores={matrixScores} weights={weights} />
          </TabsContent>
          <TabsContent value="frameworks">
            <FrameworkCompare selected={selected} />
          </TabsContent>
          <TabsContent value="viz">
            <Visualize selected={selected} matrixScores={matrixScores} weights={weights} darkMode={darkMode} grades={grades} />
          </TabsContent>
        </Tabs>
      )}

      {selected.length >= 2 && <HeadToHead selected={selected} matrixScores={matrixScores} weights={weights} />}
    </div>
  )
}

function ColGrid({ count, children, className }: { count: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid items-center gap-3', className)} style={{ gridTemplateColumns: `minmax(140px,1.4fr) repeat(${count}, minmax(0,1fr))` }}>
      {children}
    </div>
  )
}

function QuickStats({ selected, grades }: { selected: SchoolMetrics[]; grades: ReturnType<typeof useStore.getState>['grades'] }) {
  const rows: { label: string; render: (m: SchoolMetrics) => React.ReactNode }[] = [
    { label: 'Tier', render: (m) => <TierBadge tier={m.school.tier} /> },
    { label: 'Grade', render: (m) => <GradeBadge letter={grades[m.school.id]?.letter} size="sm" /> },
    { label: 'Admit rate', render: (m) => <span className={cn('font-semibold tabular-nums', admitRateClass(m.school.admitRate))}>{pct(m.school.admitRate)}</span> },
    { label: 'Best round', render: (m) => <span className="font-medium">{m.school.bestRound}</span> },
    { label: 'US News rank', render: (m) => <span className="tabular-nums">{m.school.usNewsRank ? `#${m.school.usNewsRank}` : '—'}</span> },
    { label: 'Enrollment', render: (m) => <span className="tabular-nums">{m.school.enrollment?.toLocaleString() ?? '—'}</span> },
    { label: 'From NYC', render: (m) => <span className="tabular-nums">{m.school.distanceFromNYC != null ? `${m.school.distanceFromNYC} hrs` : '—'}</span> },
    { label: 'Matrix score', render: (m) => <ScorePill score={m.matrixTotal} /> },
    { label: 'Recommendation', render: (m) => (m.recommendation.combined !== null ? <RecBadge label={m.recommendation.label} /> : <span className="text-xs text-slate-400">—</span>) },
    { label: 'One Strong Reason', render: (m) => <span className="text-xs italic text-slate-500 dark:text-slate-400">{m.school.oneStrongReason || '—'}</span> },
  ]
  return (
    <Card className="overflow-hidden p-5">
      <ColGrid count={selected.length} className="border-b border-slate-200 pb-3 dark:border-navy-700">
        <span />
        {selected.map((m, i) => (
          <span key={m.school.id} className="font-serif text-sm font-semibold" style={{ color: SERIES_COLORS[i] }}>
            {m.school.name}
          </span>
        ))}
      </ColGrid>
      <div className="divide-y divide-slate-100 dark:divide-navy-700/60">
        {rows.map((row) => (
          <ColGrid key={row.label} count={selected.length} className="py-2.5">
            <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
            {selected.map((m) => (
              <span key={m.school.id} className="text-sm text-navy-800 dark:text-white">
                {row.render(m)}
              </span>
            ))}
          </ColGrid>
        ))}
      </div>
    </Card>
  )
}

function cellScore(scores: Record<string, number> | undefined, cid: string): number | null {
  const v = scores?.[cid]
  return typeof v === 'number' ? v : null
}

function MatrixCompare({
  selected,
  matrixScores,
  weights,
}: {
  selected: SchoolMetrics[]
  matrixScores: Record<string, Record<string, number>>
  weights: Record<string, number>
}) {
  return (
    <Card className="overflow-hidden p-5">
      <ColGrid count={selected.length} className="border-b border-slate-200 pb-3 dark:border-navy-700">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Criterion</span>
        {selected.map((m, i) => (
          <span key={m.school.id} className="truncate font-serif text-sm font-semibold" style={{ color: SERIES_COLORS[i] }}>
            {m.school.name}
          </span>
        ))}
      </ColGrid>

      {CRITERIA_GROUPS.map((g) => (
        <div key={g.id}>
          <ColGrid count={selected.length} className={cn('border-l-4 bg-slate-50 py-2 pl-3 dark:bg-navy-900/30', g.accent)}>
            <span className={cn('text-xs font-bold uppercase tracking-wide', g.text)}>{g.label}</span>
            {selected.map((m) => {
              const sub = categorySubtotal(g.id, matrixScores[m.school.id], weights)
              return (
                <span key={m.school.id}>
                  <ScorePill score={sub} className="text-sm" />
                </span>
              )
            })}
          </ColGrid>
          {CRITERIA_BY_GROUP[g.id].map((c) => {
            const vals = selected.map((m) => cellScore(matrixScores[m.school.id], c.id))
            const max = Math.max(...vals.filter((v): v is number => v !== null), -1)
            return (
              <ColGrid key={c.id} count={selected.length} className="py-2">
                <span className="text-xs text-slate-600 dark:text-slate-300">{c.label}</span>
                {vals.map((v, i) => (
                  <div key={selected[i].school.id} className="flex items-center gap-2">
                    {v === null ? (
                      <span className="text-xs text-slate-400">Not scored</span>
                    ) : (
                      <>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-700">
                          <div className="h-full rounded-full" style={{ width: `${(v / 10) * 100}%`, backgroundColor: scoreBarColor(v) }} />
                        </div>
                        <span className={cn('w-5 text-right text-xs font-semibold tabular-nums', v === max && max > 0 ? 'text-gold-600 dark:text-gold-300' : 'text-navy-700 dark:text-slate-300')}>
                          {v}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </ColGrid>
            )
          })}
        </div>
      ))}
    </Card>
  )
}

function FrameworkCompare({ selected }: { selected: SchoolMetrics[] }) {
  return (
    <Card className="overflow-hidden p-5">
      <ColGrid count={selected.length} className="border-b border-slate-200 pb-3 dark:border-navy-700">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Framework</span>
        {selected.map((m, i) => (
          <span key={m.school.id} className="truncate font-serif text-sm font-semibold" style={{ color: SERIES_COLORS[i] }}>
            {m.school.name}
          </span>
        ))}
      </ColGrid>
      <div className="divide-y divide-slate-100 dark:divide-navy-700/60">
        {FRAMEWORKS.map((fw) => (
          <ColGrid key={fw.key} count={selected.length} className="py-2.5">
            <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className={cn('h-2 w-2 rounded-full', fw.accentDot)} /> {fw.title.replace('The ', '')}
            </span>
            {selected.map((m) => (
              <span key={m.school.id}>
                <ScorePill score={m.frameworkResults[fw.n]?.score ?? null} className="text-sm" />
              </span>
            ))}
          </ColGrid>
        ))}
        <ColGrid count={selected.length} className="bg-slate-50 py-3 dark:bg-navy-900/30">
          <span className="text-xs font-bold uppercase tracking-wide text-navy-700 dark:text-slate-200">Recommendation</span>
          {selected.map((m) => (
            <span key={m.school.id}>
              {m.recommendation.combined !== null ? <RecBadge label={m.recommendation.label} /> : <span className="text-xs text-slate-400">—</span>}
            </span>
          ))}
        </ColGrid>
      </div>
    </Card>
  )
}

function Visualize({
  selected,
  matrixScores,
  weights,
  darkMode,
  grades,
}: {
  selected: SchoolMetrics[]
  matrixScores: Record<string, Record<string, number>>
  weights: Record<string, number>
  darkMode: boolean
  grades: ReturnType<typeof useStore.getState>['grades']
}) {
  const radarData = CRITERIA_GROUPS.map((g) => {
    const row: Record<string, string | number> = { axis: g.label.split(' ')[0] }
    selected.forEach((m, i) => {
      row[`s${i}`] = categorySubtotal(g.id, matrixScores[m.school.id], weights) ?? 0
    })
    return row
  })
  const series = selected.map((m, i) => ({ key: `s${i}`, name: m.school.name, color: SERIES_COLORS[i] }))
  const barData = selected.map((m, i) => ({ name: m.school.name, value: m.matrixTotal ?? 0, color: SERIES_COLORS[i] }))
  const scatter = selected.map((m, i) => ({ x: m.matrixTotal ?? 0, y: m.gpa ?? 0, name: m.school.name, color: SERIES_COLORS[i] })).filter((d) => d.x > 0 || d.y > 0)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h4 className="mb-2 font-serif text-base font-semibold text-navy-800 dark:text-white">Matrix profile overlay</h4>
        <RadarPanel data={radarData as any} series={series} dark={darkMode} height={340} />
      </Card>
      <Card className="p-5">
        <h4 className="mb-2 font-serif text-base font-semibold text-navy-800 dark:text-white">Matrix totals</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: darkMode ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: darkMode ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {barData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
              <LabelList dataKey="value" position="top" formatter={(v: any) => (typeof v === 'number' ? v.toFixed(1) : v)} style={{ fontSize: 11, fill: darkMode ? '#CBD5E1' : '#475569' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card className="p-5 lg:col-span-2">
        <h4 className="mb-2 font-serif text-base font-semibold text-navy-800 dark:text-white">Grade vs. matrix (selected schools)</h4>
        {scatter.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
              <CartesianGrid stroke={darkMode ? '#243558' : '#E2E8F0'} strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" domain={[0, 10]} name="Matrix" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis type="number" dataKey="y" domain={[0, 4.3]} name="GPA" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <ZAxis range={[160, 160]} />
              <RTooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, background: darkMode ? '#1B2A4A' : '#fff' }} formatter={(v: any) => (typeof v === 'number' ? v.toFixed(1) : v)} />
              <Scatter data={scatter}>
                {scatter.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
                <SLabelList dataKey="name" position="top" style={{ fontSize: 10, fill: darkMode ? '#CBD5E1' : '#475569' }} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">Score matrices and assign grades to the selected schools to plot them.</p>
        )}
        <p className="mt-1 text-center text-xs text-slate-400">{Object.keys(grades).length > 0 ? '' : 'Tip: assign grades in the Grades section.'}</p>
      </Card>
    </div>
  )
}

function HeadToHead({
  selected,
  matrixScores,
  weights,
}: {
  selected: SchoolMetrics[]
  matrixScores: Record<string, Record<string, number>>
  weights: Record<string, number>
}) {
  const pairs: [SchoolMetrics, SchoolMetrics][] = []
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) pairs.push([selected[i], selected[j]])
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-navy-800 dark:text-white">
        <Swords className="h-5 w-5 text-gold-500" /> Head-to-head analysis
      </h3>
      <div className="space-y-5">
        {pairs.map(([a, b]) => {
          const diffs = CRITERIA_GROUPS.map((g) => {
            const av = categorySubtotal(g.id, matrixScores[a.school.id], weights)
            const bv = categorySubtotal(g.id, matrixScores[b.school.id], weights)
            const delta = av !== null && bv !== null ? av - bv : null
            return { label: g.label, delta, winner: delta === null ? null : delta > 0 ? a : delta < 0 ? b : null }
          })
          const aWins = diffs.filter((d) => d.winner?.school.id === a.school.id)
          const bWins = diffs.filter((d) => d.winner?.school.id === b.school.id)
          const aAdv = aWins.filter((d) => d.delta !== null).sort((x, y) => (y.delta ?? 0) - (x.delta ?? 0)).slice(0, 2)
          const bAdv = bWins.filter((d) => d.delta !== null).sort((x, y) => Math.abs(y.delta ?? 0) - Math.abs(x.delta ?? 0)).slice(0, 2)
          const scored = diffs.some((d) => d.delta !== null)

          return (
            <div key={a.school.id + b.school.id} className="rounded-xl border border-slate-200 p-4 dark:border-navy-700">
              <div className="mb-2 flex items-center gap-2 font-serif text-base font-medium text-navy-800 dark:text-white">
                {a.school.name} <span className="text-xs text-slate-400">vs</span> {b.school.name}
              </div>
              {scored ? (
                <>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="font-medium text-navy-800 dark:text-white">{a.school.name}</span>{' '}
                    {aAdv.length ? (
                      <>outscores {b.school.name} in {aAdv.map((d) => `${d.label} (+${(d.delta ?? 0).toFixed(1)})`).join(' and ')}</>
                    ) : (
                      <>holds no clear category edge</>
                    )}
                    {bAdv.length ? (
                      <> but lags in {bAdv.map((d) => `${d.label} (${(d.delta ?? 0).toFixed(1)})`).join(' and ')}.</>
                    ) : (
                      <>.</>
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {diffs.map((d) => (
                      <span
                        key={d.label}
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          d.winner?.school.id === a.school.id
                            ? 'border-gold-300 bg-gold-400/10 text-gold-600 dark:text-gold-300'
                            : d.winner?.school.id === b.school.id
                              ? 'border-navy-300 bg-navy-500/10 text-navy-600 dark:text-navy-300'
                              : 'border-slate-200 text-slate-400 dark:border-navy-600',
                        )}
                      >
                        {d.label}: {d.delta === null ? '—' : d.winner ? d.winner.school.name.split(' ')[0] : 'tie'}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-slate-400">
                    Category wins — {a.school.name.split(' ')[0]}: {aWins.length} · {b.school.name.split(' ')[0]}: {bWins.length}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">Score both schools' matrices to generate a head-to-head breakdown.</p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
