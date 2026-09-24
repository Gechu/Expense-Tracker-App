import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { changeEmail, type User } from '../api/auth'

interface ChangeEmailModalProps {
  user: User
  onClose: () => void
  onSaved: (user: User) => void
}

export default function ChangeEmailModal({ user, onClose, onSaved }: ChangeEmailModalProps) {
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const updated = await changeEmail(newEmail, currentPassword)
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić adresu e-mail')
      setBusy(false)
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Zmień adres e-mail</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            <span className="text-meta" style={{ display: 'block', marginTop: 18 }}>
              Obecny adres: {user.email}
            </span>

            <label className="field" style={{ marginTop: 16 }}>
              <span className="text-label">Nowy adres e-mail</span>
              <input
                type="email"
                className="input"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="kamil@mail.com"
                required
                autoFocus
              />
            </label>

            <label className="field" style={{ marginTop: 16 }}>
              <span className="text-label">Hasło</span>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
