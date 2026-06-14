import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Segmented } from '@/components/ui/segmented'
import { Stars } from '@/components/ui/stars'
import { TierBadge, StatusBadge, RoundBadge } from '@/components/common/badges'
import { SectionLabel } from '@/components/common/bits'
import { useStore, type NewSchoolInput } from '@/store/useStore'
import { useUI } from '@/store/uiStore'
import { ROUNDS, ROUND_LABEL, STATUSES, TIERS, TIER_CLASSES, VISITS } from '@/lib/schoolMeta'
import { toastSaved } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { AppRound, SchoolStatus, Tier, VisitStatus } from '@/lib/types'

type Draft = Required<Omit<NewSchoolInput, 'admitRate' | 'usNewsRank' | 'enrollment' | 'distanceFromNYC'>> & {
  admitRate: string
  usNewsRank: string
  enrollment: string
  distanceFromNYC: string
}

const EMPTY: Draft = {
  name: '',
  tier: 'Target',
  status: 'Applying',
  priority: 3,
  bestRound: 'RD',
  visitStatus: 'Not Visited',
  admitRate: '',
  usNewsRank: '',
  enrollment: '',
  location: '',
  distanceFromNYC: '',
  oneStrongReason: '',
  whyConsidering: '',
  concerns: '',
  notes: '',
}

const STEPS = ['Basic info', 'Narrative', 'Review']

export function AddEditSchool() {
  const editId = useUI((s) => s.editSchoolId)
  const setEditSchool = useUI((s) => s.setEditSchool)
  const setMatrixSchool = useUI((s) => s.setMatrixSchool)
  const existing = useStore((s) => s.schools.find((x) => x.id === editId))
  const addSchool = useStore((s) => s.addSchool)
  const updateSchool = useStore((s) => s.updateSchool)
  const setActive = useStore((s) => s.setActiveSection)

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [touched, setTouched] = useState(false)

  const isEdit = !!existing

  useEffect(() => {
    if (existing) {
      setDraft({
        name: existing.name,
        tier: existing.tier,
        status: existing.status,
        priority: existing.priority,
        bestRound: existing.bestRound,
        visitStatus: existing.visitStatus,
        admitRate: existing.admitRate?.toString() ?? '',
        usNewsRank: existing.usNewsRank?.toString() ?? '',
        enrollment: existing.enrollment?.toString() ?? '',
        location: existing.location,
        distanceFromNYC: existing.distanceFromNYC?.toString() ?? '',
        oneStrongReason: existing.oneStrongReason,
        whyConsidering: existing.whyConsidering,
        concerns: existing.concerns,
        notes: existing.notes,
      })
    } else {
      setDraft(EMPTY)
    }
    setStep(0)
    setTouched(false)
  }, [editId, existing])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!draft.name.trim()) e.name = 'School name is required.'
    const ar = Number(draft.admitRate)
    if (draft.admitRate && (Number.isNaN(ar) || ar < 0 || ar > 100)) e.admitRate = 'Enter a percentage between 0 and 100.'
    if (draft.usNewsRank && Number(draft.usNewsRank) < 1) e.usNewsRank = 'Rank must be 1 or higher.'
    return e
  }, [draft])

  const numericPayload = (): NewSchoolInput => ({
    name: draft.name.trim(),
    tier: draft.tier,
    status: draft.status,
    priority: draft.priority,
    bestRound: draft.bestRound,
    visitStatus: draft.visitStatus,
    admitRate: draft.admitRate ? Number(draft.admitRate) : null,
    usNewsRank: draft.usNewsRank ? Number(draft.usNewsRank) : null,
    enrollment: draft.enrollment ? Number(draft.enrollment) : null,
    location: draft.location.trim(),
    distanceFromNYC: draft.distanceFromNYC ? Number(draft.distanceFromNYC) : null,
    oneStrongReason: draft.oneStrongReason,
    whyConsidering: draft.whyConsidering,
    concerns: draft.concerns,
    notes: draft.notes,
  })

  const canAdvance = step === 0 ? Object.keys(errors).length === 0 : true

  const goNext = () => {
    setTouched(true)
    if (step === 0 && Object.keys(errors).length > 0) return
    setStep((s) => Math.min(2, s + 1))
  }

  const commit = (jumpToMatrix: boolean) => {
    if (Object.keys(errors).length > 0) {
      setStep(0)
      setTouched(true)
      return
    }
    const payload = numericPayload()
    let id = editId
    if (isEdit && editId) {
      updateSchool(editId, payload as Partial<typeof existing>)
      toastSaved('Changes saved')
    } else {
      id = addSchool(payload)
      toastSaved('School added')
    }
    setEditSchool(null)
    if (jumpToMatrix && id) {
      setMatrixSchool(id)
      setActive('matrix')
    } else {
      setActive('schools')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => (i < step || (i === 1 && canAdvance) ? setStep(i) : undefined)}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all',
                i < step
                  ? 'bg-green-500 text-white'
                  : i === step
                    ? 'bg-navy-800 text-white dark:bg-gold-400 dark:text-navy-900'
                    : 'bg-slate-200 text-slate-400 dark:bg-navy-700',
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span className={cn('hidden text-sm font-medium sm:block', i === step ? 'text-navy-800 dark:text-white' : 'text-slate-400')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className={cn('h-px flex-1', i < step ? 'bg-green-500' : 'bg-slate-200 dark:bg-navy-700')} />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {step === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="mb-2 block text-sm font-medium text-navy-700 dark:text-slate-200">
                  School name <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Georgetown University"
                  className={cn(
                    'w-full rounded-xl border bg-white px-4 py-3 font-serif text-2xl font-medium text-navy-800 placeholder:text-slate-300 transition focus:outline-none focus:ring-2 focus:ring-gold-400 dark:bg-navy-900/40 dark:text-white',
                    touched && errors.name ? 'border-red-400' : 'border-slate-200 dark:border-navy-600',
                  )}
                />
                {touched && errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Tier">
                  <Segmented<Tier>
                    grid
                    size="sm"
                    options={TIERS.map((t) => ({ value: t, label: t, activeClass: `${TIER_CLASSES[t].badge} shadow-sm` }))}
                    value={draft.tier}
                    onChange={(v) => set('tier', v)}
                  />
                </Field>
                <Field label="Status">
                  <Segmented<SchoolStatus>
                    grid
                    size="sm"
                    options={STATUSES.map((t) => ({ value: t, label: t }))}
                    value={draft.status}
                    onChange={(v) => set('status', v)}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Personal priority">
                  <div className="flex h-9 items-center">
                    <Stars value={draft.priority} onChange={(v) => set('priority', v)} size={22} />
                  </div>
                </Field>
                <Field label="Visit status">
                  <Segmented<VisitStatus>
                    grid
                    size="sm"
                    options={VISITS.map((t) => ({ value: t, label: t }))}
                    value={draft.visitStatus}
                    onChange={(v) => set('visitStatus', v)}
                  />
                </Field>
              </div>

              <Field label="Best application round">
                <div className="flex flex-wrap gap-2">
                  {ROUNDS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set('bestRound', r)}
                      title={ROUND_LABEL[r]}
                      className={cn(
                        'rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-95',
                        draft.bestRound === r
                          ? 'border-gold-400 bg-gold-400/10 text-gold-600 dark:text-gold-300'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-navy-600 dark:text-slate-400',
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Historical admit rate from my HS" error={touched ? errors.admitRate : undefined}>
                  <Input suffix="%" type="number" min={0} max={100} value={draft.admitRate} onChange={(e) => set('admitRate', e.target.value)} placeholder="18" />
                </Field>
                <Field label="US News ranking" error={touched ? errors.usNewsRank : undefined}>
                  <Input type="number" min={1} value={draft.usNewsRank} onChange={(e) => set('usNewsRank', e.target.value)} placeholder="24" />
                </Field>
                <Field label="Undergraduate enrollment">
                  <Input type="number" min={0} value={draft.enrollment} onChange={(e) => set('enrollment', e.target.value)} placeholder="7500" />
                </Field>
                <Field label="Distance from NYC">
                  <Input suffix="hrs" type="number" min={0} value={draft.distanceFromNYC} onChange={(e) => set('distanceFromNYC', e.target.value)} placeholder="4" />
                </Field>
                <Field label="Location / city" className="sm:col-span-2">
                  <Input value={draft.location} onChange={(e) => set('location', e.target.value)} placeholder="Washington, D.C." />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-xl border border-gold-300/60 bg-gold-400/5 p-4 dark:border-gold-500/40">
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gold-600 dark:text-gold-300">
                  <Sparkles className="h-4 w-4" /> One Strong Reason
                </label>
                <p className="mb-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  The single non-replicable reason this school is on your list. If you can't fill this in, reconsider the school.
                </p>
                <Textarea value={draft.oneStrongReason} maxLen={200} highlight onChange={(e) => set('oneStrongReason', e.target.value)} placeholder="The one thing no other school offers you…" />
              </div>
              <Field label="Why I'm considering this school">
                <Textarea value={draft.whyConsidering} maxLen={500} onChange={(e) => set('whyConsidering', e.target.value)} placeholder="What draws you in — programs, people, place…" />
              </Field>
              <Field label="My concerns about this school">
                <Textarea value={draft.concerns} maxLen={300} onChange={(e) => set('concerns', e.target.value)} placeholder="What gives you pause…" />
              </Field>
              <Field label="Notes">
                <Textarea value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything else worth remembering…" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-xl border border-slate-200 p-5 dark:border-navy-700">
                <h2 className="font-serif text-2xl font-semibold text-navy-800 dark:text-white">{draft.name || 'Untitled school'}</h2>
                {draft.location && <p className="mt-0.5 text-sm text-slate-400">{draft.location}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <TierBadge tier={draft.tier} />
                  <StatusBadge status={draft.status} />
                  <RoundBadge round={draft.bestRound} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  <Summary label="Priority" value={'★'.repeat(draft.priority) || '—'} />
                  <Summary label="Admit rate" value={draft.admitRate ? `${draft.admitRate}%` : '—'} />
                  <Summary label="US News" value={draft.usNewsRank ? `#${draft.usNewsRank}` : '—'} />
                  <Summary label="Enrollment" value={draft.enrollment ? Number(draft.enrollment).toLocaleString() : '—'} />
                  <Summary label="From NYC" value={draft.distanceFromNYC ? `${draft.distanceFromNYC} hrs` : '—'} />
                  <Summary label="Visit" value={draft.visitStatus} />
                </div>
                {draft.oneStrongReason && (
                  <div className="mt-4 border-t border-slate-200 pt-3 dark:border-navy-700">
                    <SectionLabel>One strong reason</SectionLabel>
                    <p className="mt-1 text-sm italic text-navy-700 dark:text-slate-300">"{draft.oneStrongReason}"</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="gold" size="lg" className="flex-1" onClick={() => commit(false)}>
                  <Check className="h-5 w-5" /> {isEdit ? 'Save changes' : 'Confirm & add school'}
                </Button>
                {!isEdit && (
                  <Button variant="outline" size="lg" onClick={() => commit(true)}>
                    Add & score matrix <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Nav */}
          {step < 2 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-5 dark:border-navy-700">
              <Button variant="ghost" onClick={() => (step === 0 ? (setEditSchool(null), setActive('schools')) : setStep((s) => s - 1))}>
                <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
              </Button>
              <Button variant="default" onClick={goNext} disabled={step === 0 && !canAdvance && touched}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="flex border-t border-slate-200 pt-5 dark:border-navy-700">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Back to narrative
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children, error, className }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-navy-700 dark:text-slate-200">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-medium text-navy-800 dark:text-white">{value}</div>
    </div>
  )
}
