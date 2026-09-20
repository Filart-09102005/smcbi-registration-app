import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import Alert from '../../components/ui/Alert'
import DistributionChart from '../../components/admin/charts/DistributionChart'
import { fetchStats } from '../../lib/adminApi'
import { fetchDistribution } from '../../lib/adminStats'

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
        <div className="space-y-6">
          <TotalHero total={Number(stats.total)} />
          <ChartGrid stats={stats} distribution={distribution} />
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

function TotalHero({ total }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-8 text-center"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--series-3))' }}
      />
      <div
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)' }}
      >
        <Users size={20} />
      </div>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.16em]" style={{ color: 'var(--color-muted)' }}>
        Total Registered
      </p>
      <p className="mt-2 text-5xl font-black" style={{ color: 'var(--color-text)' }}>
        {total.toLocaleString()}
      </p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function ChartGrid({ stats, distribution }) {
  const sections = [
    {
      title: 'Registrations by Type',
      rows: [
        { label: 'College', count: Number(stats.college_count) },
        { label: 'BED', count: Number(stats.bed_count) },
        { label: 'Personnel', count: Number(stats.staff_count) },
      ].filter((row) => row.count > 0),
    },
    { title: 'Student Distribution by Course', rows: distribution.program },
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
        <ChartCard key={section.title} title={section.title}>
          <DistributionChart rows={section.rows} />
        </ChartCard>
      ))}
    </div>
  )
}
