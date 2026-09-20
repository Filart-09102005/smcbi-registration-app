const STATUS_STYLE = {
  pending: { label: 'Pending', color: '#f59e0b' },
  approved: { label: 'Approved', color: 'var(--color-success)' },
  rejected: { label: 'Rejected', color: 'var(--color-error)' },
  imported: { label: 'Imported', color: 'var(--color-primary)' },
}

export default function StatusBadge({ status }) {
  const meta = STATUS_STYLE[status] ?? { label: status, color: 'var(--color-muted)' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-wide"
      style={{
        color: meta.color,
        backgroundColor: `color-mix(in srgb, ${meta.color}, transparent 88%)`,
      }}
    >
      {meta.label}
    </span>
  )
}
