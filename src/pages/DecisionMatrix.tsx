import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Scale, Sliders, Trophy, GraduationCap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { InfoTooltip } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { SchoolSelect } from '@/components/common/SchoolSelect'
import { RadarPanel } from '@/components/common/RadarPanel'
import { ScorePill } from '@/components/common/bits'
import { TierBadge } from '@/components/common/badges'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/uiStore'
import { useAllMetrics } from '@/hooks/metrics'
import { CRITERIA_GROUPS, CRITERIA_BY_GROUP, DEFAULT_WEIGHT } from '@/lib/criteria'
import { matrixWeightedTotal, categorySubtotal } from '@/lib/scoring'
import { scoreBarColor } from '@/lib/schoolMeta'
import { toastSaved } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function DecisionMatrix() {
  const schools = useStore((s) => s.schools)
  const setActive = useStore((s) => s.setActiveSection)
  if (schools.length === 0) {
    return (
      <EmptyState
        icon={<Sliders className="h-7 w-7" />}
        title="No schools to score yet"
        description="The Decision Matrix scores each school across 30 weighted criteria — academics, career, research, fit, admissions, and campus life. Add a school first, then come back to weight and score it."
        action={
          <Button variant="gold" size="lg" onClick={() => setActive('add')}>
            <GraduationCap className="h-5 w-5" /> Add a school
          </Button>
        }
      />
    )
  }
  return (
    <Tabs defaultValue="score">
      <TabsList className="mb-2">
        <TabsTrigger value="score">
          <Sliders className="h-4 w-4" /> Per-school scoring
        </TabsTrigger>
        <TabsTrigger value="weights">
          <Scale className="h-4 w-4" /> Global weights
        </TabsTrigger>
      </TabsList>
      <TabsContent value="score">
        <PerSchoolScoring />
      </TabsContent>
      <TabsContent value="weights">
        <GlobalWeights />
      </TabsContent>
    </Tabs>
  )
}

function GlobalWeights() {
  const weights = useStore((s) => s.matrixWeights)
  const setWeight = useStore((s) => s.setMatrixWeight)
  const reset = useStore((s) => s.resetMatrixWeights)
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <Card className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy-800 dark:text-white">Criteria weights</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set how much each criterion matters. Weights apply to every school's weighted total instantly.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Total weight</div>
            <div className="font-serif text-2xl font-semibold tabular-nums text-navy-800 dark:text-white">{totalWeight}</div>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {CRITERIA_GROUPS.map((g) => {
          const items = CRITERIA_BY_GROUP[g.id]
          const groupWeight = items.reduce((a, c) => a + (weights[c.id] ?? DEFAULT_WEIGHT), 0)
          return (
            <Card key={g.id} className={cn('border-l-4 p-5', g.accent)}>
              <div className="mb-4 flex items-center justify-between">
                <h4 className={cn('font-serif text-base font-semibold', g.text)}>{g.label}</h4>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-slate-500 dark:bg-navy-700 dark:text-slate-300">
                  weight {groupWeight} · {totalWeight ? Math.round((groupWeight / totalWeight) * 100) : 0}%
                </span>
              </div>
              <div className="space-y-4">
                {items.map((c) => {
                  const w = weights[c.id] ?? DEFAULT_WEIGHT
                  return (
                    <div key={c.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm text-navy-700 dark:text-slate-200">
                          {c.label}
                          <InfoTooltip>
                            <span className="block font-semibold text-gold-300">Scoring guide</span>
                            <span className="mt-1 block"><b>1</b> — {c.low}</span>
                            <span className="block"><b>5</b> — {c.mid}</span>
                            <span className="block"><b>10</b> — {c.high}</span>
                          </InfoTooltip>
                        </span>
                        <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-navy-800 dark:text-white">{w}</span>
                      </div>
                      <Slider value={w} min={0} max={10} fillColor={g.hex} onValueChange={(v) => setWeight(c.id, v)} aria-label={`${c.label} weight`} />
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function PerSchoolScoring() {
  const schools = useStore((s) => s.schools)
  const weights = useStore((s) => s.matrixWeights)
  const matrixScores = useStore((s) => s.matrixScores)
  const setScore = useStore((s) => s.setMatrixScore)
  const darkMode = useStore((s) => s.darkMode)
  const matrixSchoolId = useUI((s) => s.matrixSchoolId)
  const setMatrixSchool = useUI((s) => s.setMatrixSchool)
  const metrics = useAllMetrics()

  const [selected, setSelected] = useState<string | null>(matrixSchoolId ?? schools[0]?.id ?? null)
  const [overlay, setOverlay] = useState<string>('none')

  useEffect(() => {
    if (matrixSchoolId) {
      setSelected(matrixSchoolId)
      setMatrixSchool(null)
    }
  }, [matrixSchoolId, setMatrixSchool])

  useEffect(() => {
    if (selected && !schools.find((s) => s.id === selected)) setSelected(schools[0]?.id ?? null)
  }, [schools, selected])

  const scores = selected ? matrixScores[selected] ?? {} : {}
  const total = matrixWeightedTotal(scores, weights)

  const radarData = useMemo(() => {
    return CRITERIA_GROUPS.map((g) => {
      const row: Record<string, string | number | null> = { axis: g.label.split(' ')[0] }
      if (selected) row.self = categorySubtotal(g.id, matrixScores[selected], weights) ?? 0
      if (overlay !== 'none') row.other = categorySubtotal(g.id, matrixScores[overlay], weights) ?? 0
      return row
    })
  }, [selected, overlay, matrixScores, weights])

  const leaderboard = [...metrics].filter((m) => m.matrixTotal !== null).sort((a, b) => (b.matrixTotal ?? 0) - (a.matrixTotal ?? 0))
  const selectedSchool = schools.find((s) => s.id === selected)
  const overlaySchool = schools.find((s) => s.id === overlay)

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <Card className="sticky top-[68px] z-20 flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-[200px] flex-1">
            <SchoolSelect value={selected} onChange={setSelected} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Overlay</span>
            <Select value={overlay} onValueChange={setOverlay}>
              <SelectTrigger className="h-10 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {schools
                  .filter((s) => s.id !== selected)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Weighted total</div>
            <div className="font-serif text-3xl font-semibold leading-none">
              <ScorePill score={total} className="text-3xl" />
              <span className="text-base text-slate-400"> / 10</span>
            </div>
          </div>
        </Card>

        {selected && (
          <>
            <Card className="p-4">
              <h4 className="mb-1 font-serif text-base font-semibold text-navy-800 dark:text-white">Category profile</h4>
              <p className="mb-2 text-xs text-slate-400">Weighted subtotals across the six criterion groups</p>
              <RadarPanel
                data={radarData as any}
                dark={darkMode}
                series={[
                  { key: 'self', name: selectedSchool?.name ?? 'Selected', color: '#C9A84C' },
                  ...(overlay !== 'none' ? [{ key: 'other', name: overlaySchool?.name ?? 'Overlay', color: '#3D5A99' }] : []),
                ]}
              />
            </Card>

            {CRITERIA_GROUPS.map((g) => {
              const sub = categorySubtotal(g.id, scores, weights)
              return (
                <Card key={g.id} className={cn('border-l-4 p-5', g.accent)}>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className={cn('font-serif text-base font-semibold', g.text)}>{g.label}</h4>
                    <span className="text-sm">
                      <span className="text-xs text-slate-400">subtotal </span>
                      <ScorePill score={sub} />
                    </span>
                  </div>
                  <div className="space-y-5">
                    {CRITERIA_BY_GROUP[g.id].map((c) => {
                      const val = scores[c.id]
                      const w = weights[c.id] ?? DEFAULT_WEIGHT
                      return (
                        <div key={c.id}>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-navy-700 dark:text-slate-200">
                              {c.label}
                              <InfoTooltip>
                                <span className="block font-semibold text-gold-300">What the scores mean</span>
                                <span className="mt-1 block"><b>1</b> — {c.low}</span>
                                <span className="block"><b>5</b> — {c.mid}</span>
                                <span className="block"><b>10</b> — {c.high}</span>
                              </InfoTooltip>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-navy-700 dark:text-slate-400">w{w}</span>
                            </span>
                            <span
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-colors',
                                val ? 'text-white' : 'bg-slate-100 text-slate-400 dark:bg-navy-700',
                              )}
                              style={val ? { backgroundColor: scoreBarColor(val) } : undefined}
                            >
                              {val ?? '–'}
                            </span>
                          </div>
                          <Slider
                            value={val ?? 1}
                            min={1}
                            max={10}
                            fillColor={g.hex}
                            onValueChange={(v) => {
                              setScore(selected, c.id, v)
                              toastSaved()
                            }}
                            aria-label={c.label}
                            className={cn(!val && 'opacity-70')}
                          />
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </>
        )}
      </div>

      <div className="space-y-5">
        <Card className="sticky top-[68px] p-5">
          <h4 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-navy-800 dark:text-white">
            <Trophy className="h-4 w-4 text-gold-500" /> Live ranking
          </h4>
          {leaderboard.length ? (
            <ol className="space-y-2.5">
              {leaderboard.map((m, i) => (
                <li
                  key={m.school.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-navy-700',
                    m.school.id === selected && 'bg-gold-400/10',
                  )}
                  onClick={() => setSelected(m.school.id)}
                >
                  <span className="w-4 text-center text-xs font-semibold tabular-nums text-slate-400">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-sm font-medium text-navy-800 dark:text-white">{m.school.name}</span>
                    <TierBadge tier={m.school.tier} className="mt-0.5" />
                  </span>
                  <ScorePill score={m.matrixTotal} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-400">Score a school to see it ranked here.</p>
          )}
          {leaderboard.length > 0 && (
            <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-400 dark:border-navy-700">
              Ranking updates live as you adjust scores and weights. Tap a school to jump to it.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
