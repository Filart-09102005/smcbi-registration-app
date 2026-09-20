import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { GraduationCap, School, Users } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import Alert from '../../components/ui/Alert'
import { fetchStats } from '../../lib/adminApi'
import { fetchDistribution } from '../../lib/adminStats'

const CHART_COLORS = [
  'var(--color-primary)',
  '#0ea5e9',
  '#14b8a6',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
]

const STATUS_META = [
  { key: 'total', label: 'Total' },
  { key: 'pending_count', label: 'Pending', color: '#f59e0b' },
  { key: 'approved_count', label: 'Approved', color: 'var(--color-success)' },
  { key: 'imported_count', label: 'Imported', color: 'var(--color-primary)' },
  { key: 'rejected_count', label: 'Rejected', color: 'var(--color-error)' },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [distribution, setDistribution] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [statsData, distributionData] = await Promise.all([fetchStats(), fetchDistribution()])
        if (cancelled) return
        setStats(statsData)
        setDistribution(distributionData)
      } catch {
        if (!cancelled) setError('Unable to load dashboard statistics. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Overview of all student and personnel registrations.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : !stats || Number(stats.total) === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          <TotalCard total={stats.total} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={GraduationCap} label="College" value={stats.college_count} />
            <StatCard icon={School} label="BED" value={stats.bed_count} />
            <StatCard icon={Users} label="Personnel" value={stats.staff_count} />
          </div>

          <StatusRow stats={stats} />

          <ProgramChart data={distribution.program} />

          <SecondaryDistributions distribution={distribution} />
        </div>
      )}
    </AdminShell>
  )
}

function LoadingState() {
  return (
    <div
      className="flex items-center justify-center rounded-xl border py-16 text-sm font-semibold"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
    >
      Loading student registrations...
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border py-16 text-center"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
    >
      <p className="text-sm font-semibold">No student registrations yet.</p>
    </div>
  )
}

function TotalCard({ total }) {
  return (
    <div
      className="rounded-xl border p-8 text-center"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
    >
      <p
        className="text-xs font-black uppercase tracking-[0.16em]"
        style={{ color: 'var(--color-muted)' }}
      >
        Total Registered
      </p>
      <p className="mt-2 text-5xl font-black" style={{ color: 'var(--color-text)' }}>
        {total}
      </p>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl border p-5"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
    >
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
          color: 'var(--color-primary)',
        }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>
          {value}
        </p>
        <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

function StatusRow({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {STATUS_META.map((item) => (
        <div
          key={item.key}
          className="rounded-xl border p-4 text-center"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <p
            className="text-2xl font-black"
            style={{ color: item.color ?? 'var(--color-text)' }}
          >
            {stats[item.key] ?? 0}
          </p>
          <p className="mt-0.5 text-[0.7rem] font-bold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )
}

function ProgramChart({ data }) {
  const rows = (data ?? []).slice().sort((a, b) => b.count - a.count)

  return (
    <div
      className="rounded-xl border p-5 sm:p-6"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
    >
      <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
        Student Distribution by Course
      </h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
          No college program registrations yet.
        </p>
      ) : (
        <div className="mt-4" style={{ width: '100%', height: Math.max(200, rows.length * 48) }}>
          <ResponsiveContainer>
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
              <YAxis
                type="category"
                dataKey="label"
                width={64}
                tick={{ fontSize: 12, fontWeight: 700, fill: 'var(--color-text)' }}
              />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {rows.map((row, index) => (
                  <Cell key={row.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function SecondaryDistributions({ distribution }) {
  const sections = [
    { title: 'Department', rows: distribution.department },
    { title: 'Year Level', rows: distribution.year_level },
    { title: 'Grade Level', rows: distribution.grade_level },
    { title: 'Strand', rows: distribution.strand },
    { title: 'Gender', rows: distribution.gender },
  ].filter((section) => (section.rows ?? []).length > 0)

  if (sections.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border p-5"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
            {section.title}
          </h3>
          <ul className="mt-3 space-y-2">
            {section.rows
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((row) => (
                <li key={row.label} className="flex items-center justify-between text-sm">
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    {row.label}
                  </span>
                  <span className="font-black" style={{ color: 'var(--color-primary)' }}>
                    {row.count}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
