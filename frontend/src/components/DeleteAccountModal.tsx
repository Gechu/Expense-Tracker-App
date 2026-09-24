import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { deleteAccount } from '../api/auth'

interface DeleteAccountModalProps {
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteAccountModal({ onClose, onDeleted }: DeleteAccountModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await deleteAccount(currentPassword)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się usunąć konta')
      setBusy(false)
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Usuń konto</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            <span style={{ display: 'block', marginTop: 18, color: '#e0655f', fontSize: 13, lineHeight: 1.5 }}>
              Ta operacja jest nieodwracalna. Wszystkie zakładki, pola i wpisy zostaną trwale usunięte.
            </span>

            <label className="field" style={{ marginTop: 16 }}>
              <span className="text-label">Hasło</span>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoFocus
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
            <button type="submit" className="btn-danger" style={{ width: 'auto', padding: '11px 17px' }} disabled={busy}>
              Usuń konto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
