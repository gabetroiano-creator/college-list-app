import { useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardCheck, GraduationCap, Sparkles, TrendingUp, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Segmented } from '@/components/ui/segmented'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { SchoolSelect } from '@/components/common/SchoolSelect'
import { RadarPanel } from '@/components/common/RadarPanel'
import { ScorePill, SectionLabel } from '@/components/common/bits'
import { RecBadge } from '@/components/common/badges'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/uiStore'
import { useSchoolMetrics } from '@/hooks/metrics'
import { FRAMEWORKS, questionVisible, type Framework, type FwQuestion } from '@/lib/frameworks'
import { toastSaved } from '@/lib/toast'
import { cn, fmtScore } from '@/lib/utils'
import type { FrameworkAnswerValue } from '@/lib/types'

const EMPTY_ANSWERS: Record<string, FrameworkAnswerValue> = {}

export function Frameworks() {
  const schools = useStore((s) => s.schools)
  const setActive = useStore((s) => s.setActiveSection)
  const frameworkSchoolId = useUI((s) => s.frameworkSchoolId)
  const setFrameworkSchool = useUI((s) => s.setFrameworkSchool)
  const jumpTo = useUI((s) => s.frameworkJumpTo)
  const setJump = useUI((s) => s.setFrameworkJump)

  const [selected, setSelected] = useState<string | null>(frameworkSchoolId ?? schools[0]?.id ?? null)
  const refs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    if (frameworkSchoolId) {
      setSelected(frameworkSchoolId)
      setFrameworkSchool(null)
    }
  }, [frameworkSchoolId, setFrameworkSchool])

  useEffect(() => {
    if (selected && !schools.find((s) => s.id === selected)) setSelected(schools[0]?.id ?? null)
  }, [schools, selected])

  useEffect(() => {
    if (jumpTo && refs.current[jumpTo]) {
      refs.current[jumpTo]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setJump(null)
    }
  }, [jumpTo, setJump])

  const metrics = useSchoolMetrics(selected)

  if (schools.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="h-7 w-7" />}
        title="No schools to evaluate yet"
        description="The Framework Evaluator walks each school through eight decision frameworks — from the Would-I-Go-There Test to the Safety Net Check — then synthesizes a keep-or-cut recommendation. Add a school to begin."
        action={
          <Button variant="gold" size="lg" onClick={() => setActive('add')}>
            <GraduationCap className="h-5 w-5" /> Add a school
          </Button>
        }
      />
    )
  }

  const completed = metrics ? metrics.frameworksCompleted : 0

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      {/* Mini-nav */}
      <div className="hidden lg:block">
        <Card className="sticky top-[68px] p-3">
          <SectionLabel className="px-2 pb-2">Frameworks</SectionLabel>
          <ul className="space-y-0.5">
            {FRAMEWORKS.map((fw) => {
              const r = metrics?.frameworkResults[fw.n]
              return (
                <li key={fw.key}>
                  <button
                    onClick={() => refs.current[fw.n]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-navy-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-700"
                  >
                    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white', fw.accentDot)}>
                      {fw.n}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs">{fw.title.replace('The ', '')}</span>
                    {r?.complete && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="space-y-5">
        {/* Header */}
        <Card className="sticky top-[68px] z-20 flex flex-wrap items-center gap-4 p-4">
          <div className="min-w-[200px] flex-1">
            <SchoolSelect value={selected} onChange={setSelected} />
          </div>
          <div className="flex flex-1 items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-navy-700">
              <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-300 transition-all duration-500" style={{ width: `${(completed / 8) * 100}%` }} />
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-navy-700 dark:text-slate-200">{completed}/8</span>
          </div>
        </Card>

        {selected &&
          FRAMEWORKS.map((fw) => (
            <div key={fw.key} ref={(el) => { refs.current[fw.n] = el }}>
              <FrameworkCard framework={fw} schoolId={selected} />
            </div>
          ))}

        {selected && metrics && <FinalRecommendation schoolId={selected} />}
      </div>
    </div>
  )
}

function FrameworkCard({ framework, schoolId }: { framework: Framework; schoolId: string }) {
  const answers = useStore((s) => s.frameworkAnswers[schoolId]?.[framework.key]) ?? EMPTY_ANSWERS
  const metrics = useSchoolMetrics(schoolId)
  const result = metrics?.frameworkResults[framework.n]

  return (
    <Card className={cn('border-l-4 p-6', framework.accentBorder)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white', framework.accentDot)}>
            {framework.n}
          </span>
          <div>
            <h3 className="font-serif text-lg font-semibold text-navy-800 dark:text-white">{framework.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{framework.subtitle}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-serif text-2xl"><ScorePill score={result?.score ?? null} /></div>
          <div className={cn('text-xs font-medium', framework.accentText)}>{result?.interpretation}</div>
        </div>
      </div>

      <div className="space-y-5">
        {framework.questions.map((q) => (
          <QuestionField key={q.key} framework={framework} q={q} schoolId={schoolId} answers={answers} />
        ))}
      </div>
    </Card>
  )
}

function QuestionField({
  framework,
  q,
  schoolId,
  answers,
}: {
  framework: Framework
  q: FwQuestion
  schoolId: string
  answers: Record<string, FrameworkAnswerValue>
}) {
  const setAnswer = useStore((s) => s.setFrameworkAnswer)
  const school = useStore((s) => s.schools.find((x) => x.id === schoolId))
  const allSchools = useStore((s) => s.schools)
  const otherSchools = allSchools.filter((x) => x.id !== schoolId)
  const updateSchool = useStore((s) => s.updateSchool)

  if (!questionVisible(q, answers)) return null
  const value = answers[q.key]
  const set = (v: FrameworkAnswerValue) => {
    setAnswer(schoolId, framework.key, q.key, v)
    toastSaved()
  }

  return (
    <div className="animate-fade-in">
      <label className="mb-2 flex items-start gap-1.5 text-sm font-medium text-navy-700 dark:text-slate-200">
        {q.type !== 'reason' && <span className="text-slate-300">•</span>}
        <span>{q.prompt}</span>
      </label>
      {q.help && <p className="mb-2 text-xs leading-relaxed text-slate-400">{q.help}</p>}

      {q.type === 'number' && (
        <Input
          type="number"
          min={q.min}
          max={q.max}
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))}
          className="w-32"
          placeholder={`${q.min}–${q.max}`}
        />
      )}

      {q.type === 'slider' && (
        <div className="flex items-center gap-4">
          <Slider
            value={typeof value === 'number' ? value : q.min ?? 1}
            min={q.min ?? 1}
            max={q.max ?? 10}
            fillColor={framework.accentHex}
            onValueChange={set}
            aria-label={q.prompt}
            className={cn(typeof value !== 'number' && 'opacity-70')}
          />
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: typeof value === 'number' ? framework.accentHex : '#CBD5E1' }}
          >
            {typeof value === 'number' ? value : '–'}
          </span>
        </div>
      )}
      {q.type === 'slider' && (q.lowLabel || q.highLabel) && (
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>{q.lowLabel}</span>
          <span>{q.highLabel}</span>
        </div>
      )}

      {q.type === 'text' && (
        <Input value={typeof value === 'string' ? value : ''} maxLength={q.maxLen} onChange={(e) => set(e.target.value)} placeholder="One sentence…" />
      )}

      {q.type === 'textarea' && (
        <Textarea value={typeof value === 'string' ? value : ''} maxLen={q.maxLen} onChange={(e) => set(e.target.value)} />
      )}

      {(q.type === 'toggle' || q.type === 'tri' || q.type === 'segmented') && q.options && (
        <Segmented
          options={q.options.map((o) => ({ value: o.value, label: o.label }))}
          value={typeof value === 'string' ? value : null}
          onChange={(v) => set(v)}
          grid={q.type === 'segmented' && q.options.length > 3}
        />
      )}

      {q.type === 'school-select' && (
        <Select value={typeof value === 'string' ? value : undefined} onValueChange={set}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Choose the most similar school…" />
          </SelectTrigger>
          <SelectContent>
            {otherSchools.length === 0 && <SelectItem value="__none" disabled>No other schools yet</SelectItem>}
            {otherSchools.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {q.type === 'reason' && (
        <div className="rounded-xl border border-gold-300/60 bg-gold-400/5 p-3 dark:border-gold-500/40">
          <Textarea
            value={school?.oneStrongReason ?? ''}
            maxLen={200}
            highlight
            placeholder="The single non-replicable reason this school is on your list…"
            onChange={(e) => {
              updateSchool(schoolId, { oneStrongReason: e.target.value })
              toastSaved()
            }}
          />
        </div>
      )}
    </div>
  )
}

function FinalRecommendation({ schoolId }: { schoolId: string }) {
  const metrics = useSchoolMetrics(schoolId)
  const fwWeights = useStore((s) => s.frameworkWeights)
  const setFwWeight = useStore((s) => s.setFrameworkWeight)
  const darkMode = useStore((s) => s.darkMode)
  const [showWeights, setShowWeights] = useState(false)

  const radarData = useMemo(
    () =>
      FRAMEWORKS.map((fw) => ({
        axis: `F${fw.n}`,
        value: metrics?.frameworkResults[fw.n]?.score ?? 0,
      })),
    [metrics],
  )

  if (!metrics) return null
  const visitIncomplete = !metrics.frameworkResults[4]?.complete

  return (
    <Card className="overflow-hidden border-2 border-navy-800/10 dark:border-gold-400/20">
      <div className="bg-gradient-to-br from-navy-900 to-navy-700 px-6 py-5 text-white">
        <div className="flex items-center gap-2 text-gold-300">
          <Sparkles className="h-5 w-5" />
          <SectionLabel className="text-gold-300">Final recommendation</SectionLabel>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <RecBadge label={metrics.recommendation.label} className="text-sm" />
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium">{metrics.recommendation.confidence} confidence</span>
          <div className="ml-auto text-right">
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Combined score</div>
            <div className="font-serif text-3xl font-semibold tabular-nums text-gold-300">{fmtScore(metrics.combined)}<span className="text-base text-slate-400">/10</span></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <div>
          <h4 className="mb-1 font-serif text-base font-semibold text-navy-800 dark:text-white">Eight-framework profile</h4>
          <p className="mb-2 text-xs text-slate-400">Each axis is one framework's score (0–10)</p>
          <RadarPanel data={radarData as any} dark={darkMode} showLegend={false} height={260} series={[{ key: 'value', name: 'Framework score', color: '#C9A84C' }]} />
        </div>

        <div className="space-y-4">
          {visitIncomplete && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Campus Visit Veto is incomplete. This recommendation is capped until you record a visit.</span>
            </div>
          )}
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-navy-900/30">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold-500" />
              <SectionLabel>Synthesis</SectionLabel>
            </div>
            <p className="text-sm leading-relaxed text-navy-700 dark:text-slate-300">{metrics.recommendation.summary}</p>
          </div>

          <button onClick={() => setShowWeights((v) => !v)} className="text-xs font-medium text-gold-600 hover:underline dark:text-gold-300">
            {showWeights ? 'Hide' : 'Adjust'} framework weights
          </button>
          {showWeights && (
            <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-navy-700">
              {FRAMEWORKS.map((fw) => (
                <div key={fw.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-navy-700 dark:text-slate-300">
                      <span className={cn('h-2 w-2 rounded-full', fw.accentDot)} /> {fw.title.replace('The ', '')}
                    </span>
                    <span className="font-semibold tabular-nums">{fwWeights[fw.n] ?? 5}</span>
                  </div>
                  <Slider value={fwWeights[fw.n] ?? 5} min={0} max={10} fillColor={fw.accentHex} onValueChange={(v) => setFwWeight(fw.n, v)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
