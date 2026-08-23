import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { deleteWidget, updateWidget, type Widget } from '../api/widgets'

interface WidgetSettingsModalProps {
  widget: Widget
  onClose: () => void
  onChanged: () => void
}

export default function WidgetSettingsModal({ widget, onClose, onChanged }: WidgetSettingsModalProps) {
  const [label, setLabel] = useState(widget.label)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await updateWidget(widget.id, { label })
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać pola')
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteWidget(widget.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się usunąć pola')
      setBusy(false)
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Ustawienia pola</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field" style={{ marginTop: 18 }}>
            <span className="text-label">Nazwa</span>
            <input
              type="text"
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              autoFocus
            />
          </label>

          {error && (
            <span style={{ display: 'block', marginTop: 14, color: '#e5484d', fontSize: 13 }}>{error}</span>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 9, marginTop: 24, flexWrap: 'wrap' }}>
            <button type="button" className="btn-danger" onClick={handleDelete} disabled={busy}>
              Usuń pole
            </button>
            <div style={{ display: 'flex', gap: 9, marginLeft: 'auto' }}>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Anuluj
              </button>
              <button type="submit" className="btn-cta" style={{ width: 'auto', padding: '11px 17px' }} disabled={busy}>
                Zapisz
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
