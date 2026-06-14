import toast from 'react-hot-toast'

let lastSave = 0

/** Lightweight "saved" confirmation — debounced so rapid edits don't spam. */
export function toastSaved(label = 'Saved') {
  const now = Date.now()
  if (now - lastSave < 900) return
  lastSave = now
  toast.success(label, { id: 'saved', duration: 1200 })
}

export function toastInfo(label: string) {
  toast(label, { id: label, duration: 1800 })
}

export function toastError(label: string) {
  toast.error(label, { duration: 2400 })
}
