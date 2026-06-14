import { useMemo, useState } from 'react'
import { Search, Moon, Sun, Menu } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/uiStore'
import { NAV_ITEMS } from './Sidebar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TierBadge } from '@/components/common/badges'
import { cn } from '@/lib/utils'

const SECTION_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your list at a glance' },
  schools: { title: 'My Schools', subtitle: 'Every school you are tracking' },
  add: { title: 'Add a School', subtitle: 'Build out a new candidate' },
  matrix: { title: 'Decision Matrix', subtitle: '30 weighted criteria' },
  frameworks: { title: 'Framework Evaluator', subtitle: 'Eight decision frameworks' },
  comparison: { title: 'School Comparison', subtitle: 'Up to four side by side' },
  grades: { title: 'Grades', subtitle: 'Your holistic letter grades' },
  export: { title: 'Export Summary', subtitle: 'A print-ready dossier' },
}

export function TopBar() {
  const active = useStore((s) => s.activeSection)
  const setActive = useStore((s) => s.setActiveSection)
  const darkMode = useStore((s) => s.darkMode)
  const toggleDark = useStore((s) => s.toggleDarkMode)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const schools = useStore((s) => s.schools)
  const openDrawer = useUI((s) => s.openDrawer)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const meta = SECTION_META[active] ?? SECTION_META.dashboard
  const editId = useUI((s) => s.editSchoolId)
  const title = active === 'add' && editId ? 'Edit School' : meta.title

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return schools.filter((s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)).slice(0, 8)
  }, [query, schools])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-[var(--bg-app)]/90 px-4 backdrop-blur-md dark:border-navy-700 md:px-8">
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-navy-700 md:hidden"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0">
        <h1 className="truncate font-serif text-xl font-semibold text-navy-800 dark:text-white">{title}</h1>
        <p className="truncate text-xs text-slate-400">
          {meta.subtitle}
          {schools.length > 0 && active !== 'add' && (
            <span className="ml-2 tabular-nums">· {schools.length} school{schools.length === 1 ? '' : 's'}</span>
          )}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Global search */}
        <Popover open={open && results.length > 0} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search schools…"
                className="h-10 w-44 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-navy-800 transition-all focus:w-64 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-1.5" onOpenAutoFocus={(e) => e.preventDefault()}>
            {results.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActive('schools')
                  openDrawer(s.id)
                  setOpen(false)
                  setQuery('')
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-navy-700"
              >
                <span className="min-w-0">
                  <span className="block truncate font-serif text-sm font-medium text-navy-800 dark:text-white">{s.name}</span>
                  {s.location && <span className="block truncate text-xs text-slate-400">{s.location}</span>}
                </span>
                <TierBadge tier={s.tier} />
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:scale-[1.04] hover:text-navy-700 dark:border-navy-600 dark:bg-navy-800 dark:text-slate-300',
          )}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  )
}
