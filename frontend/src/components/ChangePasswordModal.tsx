import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { changePassword } from '../api/auth'

interface ChangePasswordModalProps {
  onClose: () => void
  onSaved: () => void
}

export default function ChangePasswordModal({ onClose, onSaved }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Nowe hasła nie są takie same')
      return
    }

    setBusy(true)
    try {
      await changePassword(currentPassword, newPassword)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić hasła')
      setBusy(false)
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Zmień hasło</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            <label className="field" style={{ marginTop: 18 }}>
              <span className="text-label">Obecne hasło</span>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="field" style={{ marginTop: 16 }}>
              <span className="text-label">Nowe hasło</span>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <label className="field" style={{ marginTop: 16 }}>
              <span className="text-label">Powtórz nowe hasło</span>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            {error && (
              <span style={{ display: 'block', marginTop: 14, color: '#e5484d', fontSize: 13 }}>{error}</span>
            )}
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-cta" style={{ width: 'auto', padding: '11px 17px' }} disabled={busy}>
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
