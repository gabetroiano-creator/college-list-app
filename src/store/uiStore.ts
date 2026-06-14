import { create } from 'zustand'

/** Transient, non-persisted UI state used to coordinate cross-section navigation. */
interface UIStore {
  drawerSchoolId: string | null
  editSchoolId: string | null
  matrixSchoolId: string | null
  frameworkSchoolId: string | null
  frameworkJumpTo: number | null

  openDrawer: (id: string | null) => void
  setEditSchool: (id: string | null) => void
  setMatrixSchool: (id: string | null) => void
  setFrameworkSchool: (id: string | null) => void
  setFrameworkJump: (n: number | null) => void
}

export const useUI = create<UIStore>((set) => ({
  drawerSchoolId: null,
  editSchoolId: null,
  matrixSchoolId: null,
  frameworkSchoolId: null,
  frameworkJumpTo: null,

  openDrawer: (id) => set({ drawerSchoolId: id }),
  setEditSchool: (id) => set({ editSchoolId: id }),
  setMatrixSchool: (id) => set({ matrixSchoolId: id }),
  setFrameworkSchool: (id) => set({ frameworkSchoolId: id }),
  setFrameworkJump: (n) => set({ frameworkJumpTo: n }),
}))
