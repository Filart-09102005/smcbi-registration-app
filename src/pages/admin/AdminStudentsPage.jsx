import { useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import RegistrationSection from '../../components/admin/RegistrationSection'
import RegistrationDetailModal from '../../components/admin/RegistrationDetailModal'
import { updateStatus } from '../../lib/adminApi'

export default function AdminStudentsPage() {
  const [selected, setSelected] = useState(null)
  const [refreshToken, setRefreshToken] = useState(0)

  async function handleUpdateStatus(id, status) {
    await updateStatus(id, status)
    setRefreshToken((current) => current + 1)
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Students
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          All student and personnel registrations, filterable by role, department, program, year
          level, grade level, strand, and gender.
        </p>
      </div>

      <RegistrationSection onOpenDetail={setSelected} refreshToken={refreshToken} />

      {selected && (
        <RegistrationDetailModal
          registration={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </AdminShell>
  )
}
