import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStore } from '@/store/useStore'

export function SchoolSelect({
  value,
  onChange,
  placeholder = 'Select a school…',
  className,
  exclude,
}: {
  value: string | null
  onChange: (id: string) => void
  placeholder?: string
  className?: string
  exclude?: string[]
}) {
  const schools = useStore((s) => s.schools)
  const list = schools.filter((s) => !exclude?.includes(s.id))
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {list.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <span className="font-serif">{s.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
