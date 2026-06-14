import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip as RTooltip,
} from 'recharts'

export interface RadarSeries {
  key: string
  name: string
  color: string
}

interface RadarPanelProps {
  /** rows keyed by `axis` plus one numeric field per series key */
  data: Array<Record<string, string | number | null>>
  series: RadarSeries[]
  height?: number
  showLegend?: boolean
  dark?: boolean
}

export function RadarPanel({ data, series, height = 320, showLegend = true, dark }: RadarPanelProps) {
  const gridColor = dark ? '#243558' : '#E2E8F0'
  const tickColor = dark ? '#94A3B8' : '#64748B'
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke={gridColor} />
        <PolarAngleAxis dataKey="axis" tick={{ fill: tickColor, fontSize: 11 }} />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 10]}
          tickCount={6}
          tick={{ fill: tickColor, fontSize: 9 }}
          stroke={gridColor}
        />
        {series.map((s) => (
          <Radar
            key={s.key}
            name={s.name}
            dataKey={s.key}
            stroke={s.color}
            fill={s.color}
            fillOpacity={series.length > 1 ? 0.16 : 0.28}
            strokeWidth={2}
            isAnimationActive
          />
        ))}
        <RTooltip
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${gridColor}`,
            background: dark ? '#1B2A4A' : '#fff',
            fontSize: 12,
            color: dark ? '#E2E8F0' : '#1B2A4A',
          }}
          formatter={(v: any) => (typeof v === 'number' ? v.toFixed(1) : v)}
        />
        {showLegend && series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
      </RadarChart>
    </ResponsiveContainer>
  )
}
