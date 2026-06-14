import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import {
  GraduationCap,
  PlusCircle,
  AlertTriangle,
  MapPinOff,
  FileQuestion,
  Sparkles,
  Activity,
  ClipboardCheck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/EmptyState'
import { TierBadge, GradeBadge } from '@/components/common/badges'
import { ScorePill } from '@/components/common/bits'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/uiStore'
import { useAllMetrics } from '@/hooks/metrics'
import { TIERS, TIER_CLASSES, scoreBarColor } from '@/lib/schoolMeta'
import { GRADE_ORDER, gradeClasses } from '@/lib/grades'
import { fmtScore } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Tier } from '@/lib/types'

export function Dashboard() {
  const schools = useStore((s) => s.schools)
  const grades = useStore((s) => s.grades)
  const notes = useStore((s) => s.dashboardNotes)
  const setNotes = useStore((s) => s.setDashboardNotes)
  const activity = useStore((s) => s.recentActivity)
  const seed = useStore((s) => s.seedSampleData)
  const setActive = useStore((s) => s.setActiveSection)
  const darkMode = useStore((s) => s.darkMode)
  const openDrawer = useUI((s) => s.openDrawer)
  const metrics = useAllMetrics()

  const tierCounts = useMemo(() => {
    const c: Record<Tier, number> = { Unlikely: 0, Reach: 0, Target: 0, Likely: 0 }
    schools.forEach((s) => (c[s.tier] += 1))
    return c
  }, [schools])

  const avgMatrix = useMemo(() => {
    const vals = metrics.map((m) => m.matrixTotal).filter((v): v is number => v !== null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [metrics])

  const frameworksDone = useMemo(() => metrics.reduce((a, m) => a + m.frameworksCompleted, 0), [metrics])
  const frameworksTotal = schools.length * 8
  const visited = schools.filter((s) => s.visitStatus === 'Visited').length

  const leaderboard = useMemo(
    () =>
      [...metrics]
        .filter((m) => m.matrixTotal !== null)
        .sort((a, b) => (b.matrixTotal ?? 0) - (a.matrixTotal ?? 0))
        .slice(0, 8),
    [metrics],
  )

  const tierPie = TIERS.map((t) => ({ name: t, value: tierCounts[t], color: TIER_CLASSES[t].hex })).filter((d) => d.value > 0)

  const gradeDist = useMemo(() => {
    const counts: Record<string, number> = {}
    GRADE_ORDER.forEach((g) => (counts[g] = 0))
    Object.values(grades).forEach((g) => {
      if (g.letter) counts[g.letter] += 1
    })
    return GRADE_ORDER.map((g) => ({ grade: g, count: counts[g], color: gradeClasses(g).hex })).filter((d) => d.count > 0)
  }, [grades])

  const actions = useMemo(() => {
    const missingOSR = schools.filter((s) => !s.oneStrongReason.trim())
    const choppingNoFw = metrics.filter((m) => m.school.status === 'Chopping Block' && m.frameworksCompleted === 0)
    const notVisited = schools.filter((s) => s.visitStatus === 'Not Visited' && s.status === 'Applying')
    return { missingOSR, choppingNoFw, notVisited }
  }, [schools, metrics])

  if (schools.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-7 w-7" />}
        title="Start building your college list"
        description="Add your first school to begin. Your tier breakdown, matrix scores, framework evaluations, and grades will all surface here as you work through each school."
        action={
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button variant="gold" size="lg" onClick={() => setActive('add')}>
              <PlusCircle className="h-5 w-5" /> Add your first school
            </Button>
            <Button variant="outline" onClick={seed}>
              <Sparkles className="h-4 w-4" /> Load a 6-school example list
            </Button>
          </div>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Schools" value={schools.length.toString()} icon={<GraduationCap className="h-5 w-5" />}>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {TIERS.filter((t) => tierCounts[t] > 0).map((t) => (
              <span key={t} className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', TIER_CLASSES[t].badge)}>
                {tierCounts[t]} {t}
              </span>
            ))}
          </div>
        </StatCard>
        <StatCard label="Avg Matrix Score" value={fmtScore(avgMatrix)} icon={<Activity className="h-5 w-5" />} accent>
          <p className="mt-3 text-xs text-slate-400">Across {metrics.filter((m) => m.matrixTotal !== null).length} scored schools</p>
        </StatCard>
        <StatCard label="Frameworks Complete" value={`${frameworksDone} / ${frameworksTotal}`} icon={<ClipboardCheck className="h-5 w-5" />}>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-navy-700">
            <div className="h-full rounded-full bg-gold-400 transition-all" style={{ width: `${frameworksTotal ? (frameworksDone / frameworksTotal) * 100 : 0}%` }} />
          </div>
        </StatCard>
        <StatCard label="Schools Visited" value={`${visited} / ${schools.length}`} icon={<MapPinOff className="h-5 w-5" />}>
          <p className="mt-3 text-xs text-slate-400">{schools.length - visited} still to visit</p>
        </StatCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tier donut */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-1 font-serif text-base font-semibold text-navy-800 dark:text-white">Tier distribution</h3>
                <p className="mb-2 text-xs text-slate-400">Where your list sits on the reach–likely spectrum</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={tierPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} stroke="none">
                      {tierPie.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle(darkMode)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade distribution */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-1 font-serif text-base font-semibold text-navy-800 dark:text-white">Grade distribution</h3>
                <p className="mb-2 text-xs text-slate-400">Your holistic letter grades</p>
                {gradeDist.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={gradeDist} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="grade" tick={{ fontSize: 11, fill: darkMode ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: darkMode ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                      <RTooltip cursor={{ fill: darkMode ? '#243558' : '#F1F5F9' }} contentStyle={tooltipStyle(darkMode)} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {gradeDist.map((d) => (
                          <Cell key={d.grade} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-center text-sm text-slate-400">
                    No grades assigned yet. Visit the Grades section to start grading.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-1 font-serif text-base font-semibold text-navy-800 dark:text-white">Top schools by matrix score</h3>
              <p className="mb-4 text-xs text-slate-400">Weighted across all 30 criteria</p>
              {leaderboard.length ? (
                <div className="space-y-3">
                  {leaderboard.map((m, i) => (
                    <button
                      key={m.school.id}
                      onClick={() => openDrawer(m.school.id)}
                      className="group flex w-full items-center gap-3 text-left"
                    >
                      <span className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-slate-400">{i + 1}</span>
                      <span className="w-40 shrink-0 truncate font-serif text-sm font-medium text-navy-800 group-hover:text-gold-600 dark:text-white">
                        {m.school.name}
                      </span>
                      <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-slate-100 dark:bg-navy-900/50">
                        <div
                          className="flex h-full items-center justify-end rounded-lg px-2 transition-all duration-700"
                          style={{ width: `${((m.matrixTotal ?? 0) / 10) * 100}%`, backgroundColor: scoreBarColor(m.matrixTotal) }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right"><ScorePill score={m.matrixTotal} /></span>
                      <TierBadge tier={m.school.tier} className="hidden shrink-0 sm:inline-flex" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">No matrix scores yet — score a school to populate the leaderboard.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Action required */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-navy-800 dark:text-white">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Action required
              </h3>
              <div className="space-y-2.5">
                <ActionGroup
                  icon={<Sparkles className="h-4 w-4" />}
                  title="Missing One Strong Reason"
                  items={actions.missingOSR.map((s) => ({ id: s.id, name: s.name }))}
                  onClick={openDrawer}
                  empty="Every school has a strong reason. Nice."
                />
                <ActionGroup
                  icon={<FileQuestion className="h-4 w-4" />}
                  title="On chopping block, not evaluated"
                  items={actions.choppingNoFw.map((m) => ({ id: m.school.id, name: m.school.name }))}
                  onClick={openDrawer}
                  empty="No unevaluated chopping-block schools."
                />
                <ActionGroup
                  icon={<MapPinOff className="h-4 w-4" />}
                  title="Applying but not visited"
                  items={actions.notVisited.map((s) => ({ id: s.id, name: s.name }))}
                  onClick={openDrawer}
                  empty="All active schools have visit plans."
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 font-serif text-base font-semibold text-navy-800 dark:text-white">Next steps</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot down what to tackle next — visits to book, essays to start, schools to revisit. Auto-saved."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-navy-800 dark:text-white">
                <Activity className="h-4 w-4 text-slate-400" /> Recent activity
              </h3>
              {activity.length ? (
                <ul className="space-y-2.5">
                  {activity.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-start gap-2.5 text-sm">
                      <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', activityColor(a.kind))} />
                      <span className="flex-1 text-navy-700 dark:text-slate-300">
                        {a.message}
                        <span className="ml-1 text-xs text-slate-400">· {formatDistanceToNow(a.at, { addSuffix: true })}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">Your edits will show up here as a running log.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  children,
  accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  children?: React.ReactNode
  accent?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
            <div className={cn('mt-1 font-serif text-3xl font-semibold tabular-nums', accent ? 'text-gold-500' : 'text-navy-800 dark:text-white')}>
              {value}
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-slate-300">
            {icon}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function ActionGroup({
  icon,
  title,
  items,
  onClick,
  empty,
}: {
  icon: React.ReactNode
  title: string
  items: { id: string; name: string }[]
  onClick: (id: string) => void
  empty: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-navy-700">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-navy-700 dark:text-slate-200">
          <span className="text-amber-500">{icon}</span> {title}
        </span>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', items.length ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300')}>
          {items.length}
        </span>
      </div>
      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.slice(0, 6).map((it) => (
            <button
              key={it.id}
              onClick={() => onClick(it.id)}
              className="rounded-md bg-slate-100 px-2 py-1 font-serif text-xs text-navy-700 transition-colors hover:bg-gold-400/20 hover:text-gold-700 dark:bg-navy-900/50 dark:text-slate-300"
            >
              {it.name}
            </button>
          ))}
          {items.length > 6 && <span className="self-center text-xs text-slate-400">+{items.length - 6} more</span>}
        </div>
      ) : (
        <p className="mt-1 text-xs text-slate-400">{empty}</p>
      )}
    </div>
  )
}

function activityColor(kind: string) {
  switch (kind) {
    case 'school':
      return 'bg-navy-500'
    case 'matrix':
      return 'bg-blue-500'
    case 'framework':
      return 'bg-gold-400'
    case 'grade':
      return 'bg-emerald-500'
    default:
      return 'bg-slate-400'
  }
}

function tooltipStyle(dark: boolean) {
  return {
    borderRadius: 12,
    border: `1px solid ${dark ? '#243558' : '#E2E8F0'}`,
    background: dark ? '#1B2A4A' : '#fff',
    fontSize: 12,
    color: dark ? '#E2E8F0' : '#1B2A4A',
  }
}
