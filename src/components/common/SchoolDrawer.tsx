import { useMemo } from 'react'
import { BarChart3, ClipboardCheck, MapPin, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { Separator } from '@/components/ui/separator'
import { Stars } from '@/components/ui/stars'
import { RadarPanel } from '@/components/common/RadarPanel'
import { GradePicker } from '@/components/common/GradePicker'
import { TierBadge, StatusBadge, RoundBadge, GradeBadge, RecBadge } from '@/components/common/badges'
import { FieldRow, ScorePill, SectionLabel } from '@/components/common/bits'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/uiStore'
import { useSchoolMetrics } from '@/hooks/metrics'
import { FRAMEWORKS } from '@/lib/frameworks'
import { TIERS, STATUSES, TIER_CLASSES, admitRateClass } from '@/lib/schoolMeta'
import { fmtScore, pct } from '@/lib/utils'
import { toastSaved } from '@/lib/toast'
import type { GradeLetter, SchoolStatus, Tier } from '@/lib/types'

export function SchoolDrawer() {
  const drawerId = useUI((s) => s.drawerSchoolId)
  const openDrawer = useUI((s) => s.openDrawer)
  const setEditSchool = useUI((s) => s.setEditSchool)
  const setMatrixSchool = useUI((s) => s.setMatrixSchool)
  const setFrameworkSchool = useUI((s) => s.setFrameworkSchool)
  const setActive = useStore((s) => s.setActiveSection)
  const updateSchool = useStore((s) => s.updateSchool)
  const removeSchool = useStore((s) => s.removeSchool)
  const setGrade = useStore((s) => s.setGrade)
  const darkMode = useStore((s) => s.darkMode)
  const grade = useStore((s) => (drawerId ? s.grades[drawerId] : undefined))

  const metrics = useSchoolMetrics(drawerId)

  const radarData = useMemo(
    () =>
      metrics
        ? metrics.categories.map((c) => ({ axis: c.label.replace(' & ', ' &\n'), value: c.value ?? 0 }))
        : [],
    [metrics],
  )

  if (!drawerId || !metrics) return null
  const school = metrics.school

  const update = (patch: Partial<typeof school>) => {
    updateSchool(school.id, patch)
    toastSaved()
  }

  const navTo = (section: string, fn?: () => void) => {
    fn?.()
    setActive(section)
    openDrawer(null)
  }

  return (
    <Sheet open={!!drawerId} onOpenChange={(o) => !o && openDrawer(null)}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-navy-800/95">
          <div className="flex flex-wrap items-center gap-2">
            <TierBadge tier={school.tier} />
            <StatusBadge status={school.status} />
            <RoundBadge round={school.bestRound} />
            {metrics.recommendation.combined !== null && <RecBadge label={metrics.recommendation.label} />}
          </div>
          <SheetTitle className="mt-2 pr-8">{school.name}</SheetTitle>
          {school.location && (
            <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> {school.location}
            </p>
          )}
        </SheetHeader>

        <div className="space-y-7 px-6 py-6">
          {/* Score summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-navy-700 dark:bg-navy-900/30">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Matrix</div>
              <div className="mt-1 text-2xl"><ScorePill score={metrics.matrixTotal} /></div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-navy-700 dark:bg-navy-900/30">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Frameworks</div>
              <div className="mt-1 text-2xl"><ScorePill score={metrics.frameworkTotal} /></div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-navy-700 dark:bg-navy-900/30">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Grade</div>
              <div className="mt-1 flex justify-center"><GradeBadge letter={grade?.letter} size="md" /></div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => navTo('add', () => setEditSchool(school.id))}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => navTo('matrix', () => setMatrixSchool(school.id))}>
              <BarChart3 className="h-4 w-4" /> Matrix
            </Button>
            <Button variant="outline" size="sm" onClick={() => navTo('frameworks', () => setFrameworkSchool(school.id))}>
              <ClipboardCheck className="h-4 w-4" /> Frameworks
            </Button>
          </div>

          {/* Inline editable basics */}
          <div className="space-y-4">
            <SectionLabel>Profile</SectionLabel>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">School name</label>
              <Input
                value={school.name}
                onChange={(e) => update({ name: e.target.value })}
                className="font-serif text-base font-medium"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">Tier</label>
                <Segmented<Tier>
                  size="sm"
                  grid
                  options={TIERS.map((t) => ({ value: t, label: t, activeClass: `${TIER_CLASSES[t].badge} shadow-sm` }))}
                  value={school.tier}
                  onChange={(v) => update({ tier: v })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">Priority</label>
                <div className="flex h-9 items-center">
                  <Stars value={school.priority} onChange={(v) => update({ priority: v })} />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">Status</label>
              <Segmented<SchoolStatus>
                size="sm"
                grid
                options={STATUSES.map((t) => ({ value: t, label: t }))}
                value={school.status}
                onChange={(v) => update({ status: v })}
              />
            </div>

            <div className="rounded-xl border border-slate-200 px-4 dark:border-navy-700">
              <FieldRow label="Admit rate (my HS)">
                <span className={admitRateClass(school.admitRate)}>{pct(school.admitRate)}</span>
              </FieldRow>
              <Separator />
              <FieldRow label="US News rank">{school.usNewsRank ? `#${school.usNewsRank}` : '—'}</FieldRow>
              <Separator />
              <FieldRow label="Enrollment">{school.enrollment ? school.enrollment.toLocaleString() : '—'}</FieldRow>
              <Separator />
              <FieldRow label="Distance from NYC">{school.distanceFromNYC != null ? `${school.distanceFromNYC} hrs` : '—'}</FieldRow>
              <Separator />
              <FieldRow label="Visit status">{school.visitStatus}</FieldRow>
            </div>
          </div>

          {/* Radar */}
          <div className="space-y-2">
            <SectionLabel>Matrix profile by category</SectionLabel>
            {metrics.matrixTotal !== null ? (
              <div className="rounded-xl border border-slate-200 p-2 dark:border-navy-700">
                <RadarPanel
                  data={radarData}
                  series={[{ key: 'value', name: school.name, color: '#C9A84C' }]}
                  height={260}
                  showLegend={false}
                  dark={darkMode}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400 dark:border-navy-600">
                Not scored yet. Open the Decision Matrix to score this school across the 30 criteria.
              </p>
            )}
          </div>

          {/* One strong reason */}
          <div className="space-y-2">
            <SectionLabel>One Strong Reason</SectionLabel>
            <Textarea
              value={school.oneStrongReason}
              maxLen={200}
              highlight
              placeholder="The single non-replicable reason this school is on your list…"
              onChange={(e) => update({ oneStrongReason: e.target.value })}
            />
          </div>

          {/* Framework summary */}
          <div className="space-y-2">
            <SectionLabel>Framework signals</SectionLabel>
            <div className="space-y-1.5">
              {FRAMEWORKS.map((fw) => {
                const r = metrics.frameworkResults[fw.n]
                return (
                  <div
                    key={fw.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-navy-700"
                  >
                    <span className="flex items-center gap-2 truncate text-sm text-navy-700 dark:text-slate-200">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${fw.accentDot}`} />
                      <span className="truncate">{fw.title}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="hidden text-xs text-slate-400 sm:inline">{r.interpretation}</span>
                      <span className="w-8 text-right"><ScorePill score={r.score} /></span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <SectionLabel>Holistic grade</SectionLabel>
              {grade?.letter && (
                <span className="text-xs tabular-nums text-slate-400">
                  GPA {metrics.gpa?.toFixed(1)} · {fmtScore(metrics.combined)} combined
                </span>
              )}
            </div>
            <GradePicker value={grade?.letter} size="sm" onChange={(g: GradeLetter) => { setGrade(school.id, g); toastSaved('Grade saved') }} />
          </div>

          {/* Why / concerns / notes */}
          <div className="space-y-3">
            <div>
              <SectionLabel className="mb-1.5">Why I'm considering it</SectionLabel>
              <Textarea value={school.whyConsidering} maxLen={500} onChange={(e) => update({ whyConsidering: e.target.value })} />
            </div>
            <div>
              <SectionLabel className="mb-1.5">My concerns</SectionLabel>
              <Textarea value={school.concerns} maxLen={300} onChange={(e) => update({ concerns: e.target.value })} />
            </div>
            <div>
              <SectionLabel className="mb-1.5">Notes</SectionLabel>
              <Textarea value={school.notes} onChange={(e) => update({ notes: e.target.value })} />
            </div>
          </div>

          {/* Recommendation */}
          {metrics.recommendation.combined !== null && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-900/30">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold-500" />
                <SectionLabel>Recommendation · {metrics.recommendation.confidence} confidence</SectionLabel>
              </div>
              <p className="text-sm leading-relaxed text-navy-700 dark:text-slate-300">{metrics.recommendation.summary}</p>
            </div>
          )}

          <Separator />
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              if (confirm(`Remove ${school.name} from your list? This deletes its scores, frameworks, and grade.`)) {
                removeSchool(school.id)
                openDrawer(null)
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Remove school
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
