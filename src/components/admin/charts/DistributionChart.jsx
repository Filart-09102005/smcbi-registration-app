import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

// Fixed categorical hue order (dataviz skill default, validated for CVD
// separation/contrast against this app's card surfaces) - assigned by
// descending share, never cycled or re-picked by filter state.
const SERIES_COLORS = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
  'var(--series-7)',
  'var(--series-8)',
]

function percentOf(count, total) {
  return total ? Math.round((count / total) * 100) : 0
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value, percent } = payload[0].payload
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
    >
      <p className="font-black" style={{ color: 'var(--color-text)' }}>
        {value.toLocaleString()} <span className="font-semibold" style={{ color: 'var(--color-muted)' }}>({percent}%)</span>
      </p>
      <p className="font-semibold" style={{ color: 'var(--color-muted)' }}>
        {name}
      </p>
    </div>
  )
}

// A single category is trivially 100% of itself - a pie/donut here would be
// a solid circle with nothing to compare, so it reads as a stat instead.
function StatRow({ rows }) {
  const [row] = rows
  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-5"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div>
        <p className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>
          {row.count.toLocaleString()}
        </p>
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
          {row.label}
        </p>
      </div>
      <span
        className="rounded-full px-2.5 py-1 text-xs font-black"
        style={{ backgroundColor: 'color-mix(in srgb, var(--series-1) 15%, transparent)', color: 'var(--series-1)' }}
      >
        100%
      </span>
    </div>
  )
}

// A 2-slice pie is an anti-pattern (a circle cut exactly in half reads no
// better than the two numbers) - a split bar shows the same share more
// legibly at a glance.
function SplitBar({ rows, total }) {
  const sorted = [...rows].sort((a, b) => b.count - a.count)
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
        {sorted.map((row, index) => (
          <div
            key={row.label}
            style={{ width: `${percentOf(row.count, total)}%`, backgroundColor: SERIES_COLORS[index] }}
          />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {sorted.map((row, index) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text)' }}>
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: SERIES_COLORS[index] }} />
              {row.label}
            </span>
            <span className="font-black" style={{ color: 'var(--color-muted)' }}>
              {row.count.toLocaleString()}{' '}
              <span className="font-semibold">({percentOf(row.count, total)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// >=3 categories is where part-to-whole-at-a-glance actually earns a donut.
// The legend list doubles as the table-view twin - every value stays
// reachable without hovering the chart.
function Donut({ rows, total }) {
  const data = [...rows]
    .sort((a, b) => b.count - a.count)
    .map((row) => ({ name: row.label, value: row.count, percent: percentOf(row.count, total) }))

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-[170px] w-[170px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={2}
              stroke="var(--color-card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((row, index) => (
                <Cell key={row.name} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black" style={{ color: 'var(--color-text)' }}>
            {total.toLocaleString()}
          </span>
          <span className="text-[0.65rem] font-bold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
            Total
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((row, index) => (
          <li key={row.name} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
            <span className="flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text)' }}>
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
              />
              {row.name}
            </span>
            <span className="flex-shrink-0 font-black" style={{ color: 'var(--color-muted)' }}>
              {row.value.toLocaleString()} <span className="font-semibold">({row.percent}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Picks stat / split-bar / donut by category count - see the anti-pattern notes on each. */
export default function DistributionChart({ rows }) {
  if (!rows || rows.length === 0) return null

  const total = rows.reduce((sum, row) => sum + row.count, 0)

  if (rows.length === 1) return <StatRow rows={rows} />
  if (rows.length === 2) return <SplitBar rows={rows} total={total} />
  return <Donut rows={rows} total={total} />
}
