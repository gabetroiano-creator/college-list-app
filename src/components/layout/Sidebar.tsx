import {
  LayoutDashboard,
  GraduationCap,
  PlusCircle,
  BarChart3,
  ClipboardCheck,
  GitCompare,
  Star,
  Download,
  ChevronLeft,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/uiStore'
import { cn } from '@/lib/utils'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'schools', label: 'My Schools', icon: GraduationCap },
  { id: 'add', label: 'Add School', icon: PlusCircle },
  { id: 'matrix', label: 'Decision Matrix', icon: BarChart3 },
  { id: 'frameworks', label: 'Framework Evaluator', icon: ClipboardCheck },
  { id: 'comparison', label: 'School Comparison', icon: GitCompare },
  { id: 'grades', label: 'Grades', icon: Star },
  { id: 'export', label: 'Export', icon: Download },
]

export function Sidebar() {
  const expanded = useStore((s) => s.sidebarExpanded)
  const toggle = useStore((s) => s.toggleSidebar)
  const active = useStore((s) => s.activeSection)
  const setActive = useStore((s) => s.setActiveSection)
  const setEditSchool = useUI((s) => s.setEditSchool)
  const schoolCount = useStore((s) => s.schools.length)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-navy-900 text-white transition-[width] duration-300 ease-out',
        expanded ? 'w-64' : 'w-16',
      )}
    >
      {/* Brand */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-white/5', !expanded && 'justify-center px-0')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 font-serif text-lg font-bold text-navy-900 shadow-lift">
          C
        </div>
        {expanded && (
          <div className="min-w-0 leading-tight animate-fade-in">
            <div className="truncate font-serif text-base font-semibold">College List</div>
            <div className="truncate text-[11px] text-slate-400">Decision Studio</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2.5 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.id === 'add') setEditSchool(null)
                    setActive(item.id)
                  }}
                  title={!expanded ? item.label : undefined}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    !expanded && 'justify-center px-0',
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full bg-gold-400 transition-all duration-200',
                      isActive ? 'w-1' : 'w-0',
                    )}
                  />
                  <Icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive && 'text-gold-300')} />
                  {expanded && <span className="truncate">{item.label}</span>}
                  {expanded && item.id === 'schools' && schoolCount > 0 && (
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] tabular-nums text-slate-300">
                      {schoolCount}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/5 p-2.5">
        <button
          onClick={toggle}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white',
            !expanded && 'justify-center px-0',
          )}
        >
          {expanded ? <ChevronLeft className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          {expanded && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
