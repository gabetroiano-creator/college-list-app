import { useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { Printer, ClipboardCopy, Check, Download, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useStore } from '@/store/useStore'
import { useAllMetrics, type SchoolMetrics } from '@/hooks/metrics'
import { TIERS, TIER_CLASSES } from '@/lib/schoolMeta'
import { CRITERIA_GROUPS } from '@/lib/criteria'
import { gpaFor } from '@/lib/grades'
import { fmtScore, pct } from '@/lib/utils'
import { toastSaved } from '@/lib/toast'
import { format } from 'date-fns'
import type { Tier } from '@/lib/types'

export function ExportSummary() {
  const schools = useStore((s) => s.schools)
  const grades = useStore((s) => s.grades)
  const setActive = useStore((s) => s.setActiveSection)
  const metrics = useAllMetrics()
  const printRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `College List — ${format(new Date(), 'MMM d yyyy')}`,
  })

  const ranked = useMemo(() => [...metrics].sort((a, b) => (b.composite ?? -1) - (a.composite ?? -1)), [metrics])
  const recommended = ranked.slice(0, 12)

  const avgMatrix = useMemo(() => {
    const v = metrics.map((m) => m.matrixTotal).filter((x): x is number => x !== null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
  }, [metrics])

  const tierCounts = useMemo(() => {
    const c: Record<Tier, number> = { Unlikely: 0, Reach: 0, Target: 0, Likely: 0 }
    schools.forEach((s) => (c[s.tier] += 1))
    return c
  }, [schools])

  const copyText = async () => {
    const text = buildText(metrics, ranked, recommended, avgMatrix, tierCounts, grades)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toastSaved('Copied to clipboard')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  if (schools.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-7 w-7" />}
        title="Nothing to export yet"
        description="Once you've added schools and worked through their matrices, frameworks, and grades, this section assembles a polished, print-ready dossier — overview, full table, per-school deep dives, and a recommended shortlist."
        action={
          <Button variant="gold" size="lg" onClick={() => setActive('add')}>
            <Download className="h-5 w-5" /> Add a school
          </Button>
        }
      />
    )
  }

  const tierPie = TIERS.map((t) => ({ name: t, value: tierCounts[t], color: TIER_CLASSES[t].hex })).filter((d) => d.value > 0)

  return (
    <div className="space-y-5">
      {/* Controls */}
      <Card className="no-print flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy-800 dark:text-white">Export your list</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">A print-ready dossier with overview, deep dives, and a recommended shortlist.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyText}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy as text'}
          </Button>
          <Button variant="gold" onClick={() => handlePrint()}>
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </Card>

      {/* Printable document */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-navy-700">
        <div ref={printRef} className="bg-white text-navy-900">
          <style>{`@page { size: A4; margin: 14mm; }`}</style>

          {/* Page 1 — Overview */}
          <PrintPage>
            <Header title="College List" subtitle={format(new Date(), 'MMMM d, yyyy')} />
            <div className="mt-6 grid grid-cols-4 gap-3">
              <Stat label="Schools" value={schools.length.toString()} />
              <Stat label="Avg matrix" value={fmtScore(avgMatrix)} />
              <Stat label="Graded" value={`${Object.values(grades).filter((g) => g.letter).length}/${schools.length}`} />
              <Stat label="Visited" value={`${schools.filter((s) => s.visitStatus === 'Visited').length}/${schools.length}`} />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <PrintH2>Tier breakdown</PrintH2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={tierPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} stroke="none" isAnimationActive={false}>
                      {tierPie.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {tierPie.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} /> {d.name} · {d.value}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <PrintH2>Matrix score by school</PrintH2>
                <ResponsiveContainer width="100%" height={Math.max(220, schools.length * 26)}>
                  <BarChart data={ranked.filter((m) => m.matrixTotal !== null).map((m) => ({ name: m.school.name, v: m.matrixTotal }))} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <XAxis type="number" domain={[0, 10]} hide />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="v" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                      {ranked.filter((m) => m.matrixTotal !== null).map((m) => (
                        <Cell key={m.school.id} fill={TIER_CLASSES[m.school.tier].hex} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </PrintPage>

          {/* Page 2 — Full table */}
          <PrintPage>
            <PrintH1>Full school list</PrintH1>
            <table className="mt-4 w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-navy-800 text-left text-navy-700">
                  <th className="py-2 pr-2 font-semibold">School</th>
                  <th className="px-2 font-semibold">Tier</th>
                  <th className="px-2 font-semibold">Grade</th>
                  <th className="px-2 font-semibold">Admit</th>
                  <th className="px-2 font-semibold">Round</th>
                  <th className="px-2 font-semibold">Matrix</th>
                  <th className="px-2 font-semibold">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((m) => (
                  <tr key={m.school.id} className="border-b border-slate-200 align-top">
                    <td className="py-2 pr-2">
                      <div className="font-serif font-medium text-navy-900">{m.school.name}</div>
                      {m.school.oneStrongReason && <div className="mt-0.5 max-w-[220px] text-[10px] italic text-slate-500">{m.school.oneStrongReason}</div>}
                    </td>
                    <td className="px-2">{m.school.tier}</td>
                    <td className="px-2">{grades[m.school.id]?.letter ?? '—'}</td>
                    <td className="px-2 tabular-nums">{pct(m.school.admitRate)}</td>
                    <td className="px-2">{m.school.bestRound}</td>
                    <td className="px-2 font-semibold tabular-nums">{fmtScore(m.matrixTotal)}</td>
                    <td className="px-2 font-medium">{m.recommendation.combined !== null ? m.recommendation.label : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintPage>

          {/* Page 3+ — Deep dives */}
          {ranked.map((m) => (
            <DeepDive key={m.school.id} m={m} grade={grades[m.school.id]?.letter ? gpaFor(grades[m.school.id]?.letter) : null} gradeLetter={grades[m.school.id]?.letter ?? null} justification={grades[m.school.id]?.justification} />
          ))}

          {/* Final — Recommended list */}
          <PrintPage>
            <PrintH1>Recommended shortlist</PrintH1>
            <p className="mt-1 text-xs text-slate-500">Top {recommended.length} by combined matrix, framework, and grade signal.</p>
            <ol className="mt-4 space-y-3">
              {recommended.map((m, i) => (
                <li key={m.school.id} className="flex gap-3 border-b border-slate-200 pb-3">
                  <span className="font-serif text-lg font-bold text-gold-600">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-serif text-base font-semibold text-navy-900">{m.school.name}</span>
                      <span className="text-xs font-semibold tabular-nums text-navy-700">
                        {fmtScore(m.composite)} · {m.recommendation.combined !== null ? m.recommendation.label : 'Incomplete'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{m.recommendation.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-center text-[10px] text-slate-400">Generated {format(new Date(), 'PPpp')} · College List Decision Studio</p>
          </PrintPage>
        </div>
      </div>
    </div>
  )
}

function PrintPage({ children }: { children: React.ReactNode }) {
  return <div className="print-page px-10 py-9">{children}</div>
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between border-b-2 border-navy-800 pb-4">
      <div>
        <h1 className="font-serif text-4xl font-bold text-navy-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 font-serif text-2xl font-bold text-gold-300">C</div>
    </div>
  )
}

function PrintH1({ children }: { children: React.ReactNode }) {
  return <h2 className="border-b-2 border-navy-800 pb-2 font-serif text-2xl font-bold text-navy-900">{children}</h2>
}
function PrintH2({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{children}</h3>
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 font-serif text-2xl font-bold text-navy-900">{value}</div>
    </div>
  )
}

function DeepDive({
  m,
  grade,
  gradeLetter,
  justification,
}: {
  m: SchoolMetrics
  grade: number | null
  gradeLetter: string | null
  justification?: string
}) {
  const s = m.school
  const catData = m.categories.map((c) => ({ name: c.label.split(' ')[0], v: c.value ?? 0 }))
  return (
    <PrintPage>
      <div className="flex items-end justify-between border-b border-slate-300 pb-2">
        <h2 className="font-serif text-3xl font-bold text-navy-900">{s.name}</h2>
        <span className="text-sm text-slate-500">{s.location}</span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        <KV k="Tier" v={s.tier} />
        <KV k="Status" v={s.status} />
        <KV k="Best round" v={s.bestRound} />
        <KV k="Priority" v={'★'.repeat(s.priority) || '—'} />
        <KV k="Admit rate" v={pct(s.admitRate)} />
        <KV k="US News" v={s.usNewsRank ? `#${s.usNewsRank}` : '—'} />
        <KV k="Enrollment" v={s.enrollment?.toLocaleString() ?? '—'} />
        <KV k="From NYC" v={s.distanceFromNYC != null ? `${s.distanceFromNYC} hrs` : '—'} />
        <KV k="Matrix" v={fmtScore(m.matrixTotal)} />
        <KV k="Frameworks" v={fmtScore(m.frameworkTotal)} />
        <KV k="Grade" v={gradeLetter ? `${gradeLetter} (${grade?.toFixed(1)})` : '—'} />
        <KV k="Combined" v={fmtScore(m.combined)} />
      </div>

      {s.oneStrongReason && (
        <div className="mt-4">
          <PrintH2>One strong reason</PrintH2>
          <p className="text-sm italic text-navy-800">"{s.oneStrongReason}"</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <PrintH2>Matrix by category</PrintH2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={catData} margin={{ top: 8, left: -24, right: 8 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Bar dataKey="v" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {catData.map((_, i) => (
                  <Cell key={i} fill={CRITERIA_GROUPS[i]?.hex ?? '#3D5A99'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <PrintH2>Recommendation · {m.recommendation.confidence} confidence</PrintH2>
          <div className="mb-1 inline-block rounded border border-navy-800 px-2 py-0.5 text-xs font-bold text-navy-900">
            {m.recommendation.combined !== null ? m.recommendation.label : 'NOT ENOUGH DATA'}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{m.recommendation.summary}</p>
        </div>
      </div>

      {(justification || s.concerns || s.notes) && (
        <div className="mt-4 space-y-2">
          {justification && <KVBlock k="Grade rationale" v={justification} />}
          {s.concerns && <KVBlock k="Concerns" v={s.concerns} />}
          {s.notes && <KVBlock k="Notes" v={s.notes} />}
        </div>
      )}
    </PrintPage>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded border border-slate-200 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-slate-400">{k}</div>
      <div className="font-medium text-navy-900">{v}</div>
    </div>
  )
}
function KVBlock({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{k}</div>
      <div className="text-[11px] text-slate-700">{v}</div>
    </div>
  )
}

function buildText(
  metrics: SchoolMetrics[],
  ranked: SchoolMetrics[],
  recommended: SchoolMetrics[],
  avgMatrix: number | null,
  tierCounts: Record<Tier, number>,
  grades: ReturnType<typeof useStore.getState>['grades'],
): string {
  const L: string[] = []
  L.push(`COLLEGE LIST — ${format(new Date(), 'MMMM d, yyyy')}`)
  L.push('='.repeat(48))
  L.push(`Total schools: ${metrics.length}`)
  L.push(`Average matrix score: ${fmtScore(avgMatrix)}`)
  L.push(`Tiers: ${TIERS.map((t) => `${t} ${tierCounts[t]}`).join(', ')}`)
  L.push('')
  L.push('FULL LIST')
  L.push('-'.repeat(48))
  ranked.forEach((m) => {
    L.push(
      `• ${m.school.name} | ${m.school.tier} | grade ${grades[m.school.id]?.letter ?? '—'} | admit ${pct(m.school.admitRate)} | ${m.school.bestRound} | matrix ${fmtScore(m.matrixTotal)} | ${m.recommendation.combined !== null ? m.recommendation.label : 'incomplete'}`,
    )
    if (m.school.oneStrongReason) L.push(`    Reason: ${m.school.oneStrongReason}`)
  })
  L.push('')
  L.push(`RECOMMENDED SHORTLIST (top ${recommended.length})`)
  L.push('-'.repeat(48))
  recommended.forEach((m, i) => {
    L.push(`${i + 1}. ${m.school.name} — ${fmtScore(m.composite)} (${m.recommendation.combined !== null ? m.recommendation.label : 'incomplete'})`)
    L.push(`   ${m.recommendation.summary}`)
  })
  return L.join('\n')
}
