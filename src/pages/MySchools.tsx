import { useMemo, useState } from 'react'
import {
  Search,
  SlidersHorizontal,
  MoreVertical,
  Pencil,
  BarChart3,
  ClipboardCheck,
  GitCompare,
  Copy,
  Trash2,
  Eye,
  MapPin,
  CalendarClock,
  Check,
  PlusCircle,
  GraduationCap,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stars } from '@/components/ui/stars'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmptyState } from '@/components/common/EmptyState'
import { TierBadge, StatusBadge, RoundBadge, GradeBadge } from '@/components/common/badges'
import { ScorePill } from '@/components/common/bits'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/uiStore'
import { useAllMetrics, type SchoolMetrics } from '@/hooks/metrics'
import { TIERS, STATUSES, VISITS, admitRateClass, scoreBarColor } from '@/lib/schoolMeta'
import { GRADE_ORDER } from '@/lib/grades'
import { pct, cn } from '@/lib/utils'
import { toastInfo } from '@/lib/toast'
import type { SchoolStatus, Tier, VisitStatus } from '@/lib/types'

type SortKey = 'name' | 'matrix' | 'admit' | 'grade' | 'priority'
const FW_FILTERS = ['Not Started', 'In Progress', 'Complete'] as const
type FwFilter = (typeof FW_FILTERS)[number]

function fwStatus(m: SchoolMetrics): FwFilter {
  if (m.frameworksCompleted === 0) return 'Not Started'
  if (m.frameworksCompleted >= m.frameworksTotal) return 'Complete'
  return 'In Progress'
}

export function MySchools() {
  const metrics = useAllMetrics()
  const grades = useStore((s) => s.grades)
  const updateSchool = useStore((s) => s.updateSchool)
  const duplicateSchool = useStore((s) => s.duplicateSchool)
  const removeSchool = useStore((s) => s.removeSchool)
  const setComparison = useStore((s) => s.setComparisonSchools)
  const comparison = useStore((s) => s.comparisonSchools)
  const setActive = useStore((s) => s.setActiveSection)
  const openDrawer = useUI((s) => s.openDrawer)
  const setEditSchool = useUI((s) => s.setEditSchool)
  const setMatrixSchool = useUI((s) => s.setMatrixSchool)
  const setFrameworkSchool = useUI((s) => s.setFrameworkSchool)

  const [search, setSearch] = useState('')
  const [tierF, setTierF] = useState<Tier[]>([])
  const [statusF, setStatusF] = useState<SchoolStatus[]>([])
  const [visitF, setVisitF] = useState<VisitStatus[]>([])
  const [fwF, setFwF] = useState<FwFilter[]>([])
  const [gradeF, setGradeF] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('matrix')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = metrics.filter((m) => {
      if (q && !m.school.name.toLowerCase().includes(q) && !m.school.location.toLowerCase().includes(q)) return false
      if (tierF.length && !tierF.includes(m.school.tier)) return false
      if (statusF.length && !statusF.includes(m.school.status)) return false
      if (visitF.length && !visitF.includes(m.school.visitStatus)) return false
      if (fwF.length && !fwF.includes(fwStatus(m))) return false
      if (gradeF !== 'all') {
        const letter = grades[m.school.id]?.letter
        if (gradeF === 'ungraded' ? !!letter : letter !== gradeF) return false
      }
      return true
    })
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.school.name.localeCompare(b.school.name)
        case 'admit':
          return (b.school.admitRate ?? -1) - (a.school.admitRate ?? -1)
        case 'priority':
          return b.school.priority - a.school.priority
        case 'grade':
          return (b.gpa ?? -1) - (a.gpa ?? -1)
        case 'matrix':
        default:
          return (b.matrixTotal ?? -1) - (a.matrixTotal ?? -1)
      }
    })
    return rows
  }, [metrics, search, tierF, statusF, visitF, fwF, gradeF, sort, grades])

  const totalSchools = metrics.length

  if (totalSchools === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-7 w-7" />}
        title="No schools on your list yet"
        description="Add a school and it will appear here in a sortable, filterable table — with its tier, matrix score, framework status, grade, and visit progress all in one row."
        action={
          <Button variant="gold" size="lg" onClick={() => setActive('add')}>
            <PlusCircle className="h-5 w-5" /> Add a school
          </Button>
        }
      />
    )
  }

  const toggleCompare = (id: string) => {
    if (comparison.includes(id)) setComparison(comparison.filter((x) => x !== id))
    else if (comparison.length >= 4) toastInfo('Comparison holds up to 4 schools')
    else setComparison([...comparison, id])
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or location…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:border-navy-600 dark:bg-navy-900/40 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MultiFilter label="Tier" options={TIERS} selected={tierF} onChange={setTierF} />
            <MultiFilter label="Status" options={STATUSES} selected={statusF} onChange={setStatusF} />
            <MultiFilter label="Visit" options={VISITS} selected={visitF} onChange={setVisitF} />
            <MultiFilter label="Frameworks" options={FW_FILTERS as unknown as string[]} selected={fwF} onChange={(v) => setFwF(v as FwFilter[])} />
            <Select value={gradeF} onValueChange={setGradeF}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                <SelectItem value="ungraded">Ungraded</SelectItem>
                {GRADE_ORDER.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-9 w-[150px]">
                <SlidersHorizontal className="h-3.5 w-3.5 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matrix">Sort: Matrix score</SelectItem>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="admit">Sort: Admit rate</SelectItem>
                <SelectItem value="grade">Sort: Grade</SelectItem>
                <SelectItem value="priority">Sort: Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {(tierF.length > 0 || statusF.length > 0 || visitF.length > 0 || fwF.length > 0 || gradeF !== 'all' || search.trim().length > 0) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span className="tabular-nums">
              Showing {filtered.length} of {totalSchools}
            </span>
            <button
              onClick={() => {
                setSearch('')
                setTierF([])
                setStatusF([])
                setVisitF([])
                setFwF([])
                setGradeF('all')
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-navy-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-700"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {/* header */}
        <div className="hidden grid-cols-[minmax(0,2.4fr)_repeat(6,minmax(0,1fr))_auto] items-center gap-3 border-b border-slate-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-navy-700 lg:grid">
          <span>School</span>
          <span>Priority</span>
          <span>Admit</span>
          <span>Round</span>
          <span>Matrix</span>
          <span>Grade</span>
          <span>Frameworks</span>
          <span />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-navy-700/60">
          {filtered.map((m) => {
            const s = m.school
            const grade = grades[s.id]
            const fws = fwStatus(m)
            return (
              <div
                key={s.id}
                onClick={() => openDrawer(s.id)}
                className="group grid cursor-pointer grid-cols-2 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-navy-50/60 dark:hover:bg-navy-900/40 lg:grid-cols-[minmax(0,2.4fr)_repeat(6,minmax(0,1fr))_auto]"
              >
                {/* Name */}
                <div className="col-span-2 min-w-0 lg:col-span-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-serif text-[15px] font-medium text-navy-800 group-hover:text-gold-600 dark:text-white">{s.name}</span>
                    {comparison.includes(s.id) && <Check className="h-3.5 w-3.5 shrink-0 text-gold-500" />}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <TierBadge tier={s.tier} />
                    <StatusBadge status={s.status} />
                    {s.location && (
                      <span className="hidden items-center gap-1 text-xs text-slate-400 sm:inline-flex">
                        <MapPin className="h-3 w-3" /> {s.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Stars value={s.priority} size={15} onChange={(v) => updateSchool(s.id, { priority: v })} />
                </div>

                {/* Admit */}
                <div className={cn('text-sm font-semibold tabular-nums', admitRateClass(s.admitRate))}>{pct(s.admitRate)}</div>

                {/* Round */}
                <div><RoundBadge round={s.bestRound} /></div>

                {/* Matrix */}
                <div className="flex items-center gap-2">
                  {m.matrixTotal !== null ? (
                    <>
                      <Progress value={(m.matrixTotal / 10) * 100} barColor={scoreBarColor(m.matrixTotal)} size="sm" animate={false} className="w-12" />
                      <ScorePill score={m.matrixTotal} className="text-sm" />
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Not scored</span>
                  )}
                </div>

                {/* Grade */}
                <div><GradeBadge letter={grade?.letter} size="sm" /></div>

                {/* Frameworks */}
                <div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
                      fws === 'Complete'
                        ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
                        : fws === 'In Progress'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-slate-400',
                    )}
                  >
                    {fws === 'In Progress' ? `${m.frameworksCompleted}/8` : fws}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1 lg:col-span-1" onClick={(e) => e.stopPropagation()}>
                  <VisitIcon status={s.visitStatus} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-navy-700 group-hover:opacity-100 dark:hover:bg-navy-700 lg:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => openDrawer(s.id)}>
                        <Eye className="h-4 w-4" /> View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditSchool(s.id); setActive('add') }}>
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMatrixSchool(s.id); setActive('matrix') }}>
                        <BarChart3 className="h-4 w-4" /> Score matrix
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setFrameworkSchool(s.id); setActive('frameworks') }}>
                        <ClipboardCheck className="h-4 w-4" /> Run frameworks
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleCompare(s.id)}>
                        <GitCompare className="h-4 w-4" /> {comparison.includes(s.id) ? 'Remove from comparison' : 'Add to comparison'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateSchool(s.id)}>
                        <Copy className="h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        destructive
                        onClick={() => {
                          if (confirm(`Remove ${s.name}?`)) removeSchool(s.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-slate-400">No schools match these filters. Try clearing a few.</div>
          )}
        </div>
      </Card>
    </div>
  )
}

function MultiFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (v: any[]) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
            selected.length
              ? 'border-gold-400 bg-gold-400/10 text-gold-600 dark:text-gold-300'
              : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-navy-600 dark:text-slate-400',
          )}
        >
          {label}
          {selected.length > 0 && <span className="rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-navy-900">{selected.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onChange(active ? selected.filter((x) => x !== opt) : [...selected, opt])}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-navy-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-navy-700"
            >
              {opt}
              {active && <Check className="h-4 w-4 text-gold-500" />}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

function VisitIcon({ status }: { status: VisitStatus }) {
  if (status === 'Visited')
    return (
      <span title="Visited" className="text-green-500">
        <MapPin className="h-4 w-4" />
      </span>
    )
  if (status === 'Planned')
    return (
      <span title="Visit planned" className="text-amber-500">
        <CalendarClock className="h-4 w-4" />
      </span>
    )
  return (
    <span title="Not visited" className="text-slate-300 dark:text-navy-500">
      <MapPin className="h-4 w-4" />
    </span>
  )
}
