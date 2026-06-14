import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useStore } from '@/store/useStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SchoolDrawer } from '@/components/common/SchoolDrawer'
import { Dashboard } from '@/pages/Dashboard'
import { MySchools } from '@/pages/MySchools'
import { AddEditSchool } from '@/pages/AddEditSchool'
import { DecisionMatrix } from '@/pages/DecisionMatrix'
import { Frameworks } from '@/pages/Frameworks'
import { Comparison } from '@/pages/Comparison'
import { Grades } from '@/pages/Grades'
import { ExportSummary } from '@/pages/ExportSummary'
import { cn } from '@/lib/utils'

const SECTIONS: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  schools: MySchools,
  add: AddEditSchool,
  matrix: DecisionMatrix,
  frameworks: Frameworks,
  comparison: Comparison,
  grades: Grades,
  export: ExportSummary,
}

export default function App() {
  const darkMode = useStore((s) => s.darkMode)
  const expanded = useStore((s) => s.sidebarExpanded)
  const active = useStore((s) => s.activeSection)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const Section = SECTIONS[active] ?? Dashboard

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-[var(--bg-app)] text-navy-800 dark:text-slate-200">
        <Sidebar />
        <div
          className={cn(
            'flex min-h-screen flex-col transition-[padding] duration-300',
            expanded ? 'pl-64' : 'pl-16',
          )}
        >
          <TopBar />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div key={active} className="mx-auto max-w-7xl animate-fade-in">
              <Section />
            </div>
          </main>
        </div>
        <SchoolDrawer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#1B2A4A',
              color: '#fff',
              fontSize: '13px',
              boxShadow: '0 10px 30px -10px rgba(15,27,45,0.4)',
            },
            success: { iconTheme: { primary: '#C9A84C', secondary: '#1B2A4A' } },
          }}
        />
      </div>
    </TooltipProvider>
  )
}
