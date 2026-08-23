import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { createEntry, deleteEntry, updateEntry, type WidgetEntry } from '../api/widgets'

interface EntryModalProps {
  widgetId: number
  /** null = nowy wpis, WidgetEntry = edycja istniejącego */
  entry: WidgetEntry | null
  /** Pole "opis" ma sens tylko dla wpisów w tabeli - single_value go nie pokazuje */
  showLabel: boolean
  nextPosition: number
  onClose: () => void
  /** Po zapisie/usunięciu rodzic po prostu odświeża dane zakładki */
  onChanged: () => void
}

export default function EntryModal({ widgetId, entry, showLabel, nextPosition, onClose, onChanged }: EntryModalProps) {
  const [label, setLabel] = useState(entry?.label ?? '')
  const [amount, setAmount] = useState(entry?.amount ?? '')
  const [entryDate, setEntryDate] = useState(entry?.entry_date ?? new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (entry) {
        await updateEntry(entry.id, { label: showLabel ? label : undefined, amount, entry_date: entryDate })
      } else {
        await createEntry(widgetId, {
          label: showLabel ? label : undefined,
          amount,
          entry_date: entryDate,
          position: nextPosition,
        })
      }
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać wpisu')
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!entry) return
    setBusy(true)
    try {
      await deleteEntry(entry.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się usunąć wpisu')
      setBusy(false)
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{entry ? 'Edytuj wpis' : 'Nowy wpis'}</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {showLabel && (
            <label className="field" style={{ marginTop: 18 }}>
              <span className="text-label">Opis</span>
              <input
                type="text"
                className="input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="np. Zakupy"
                autoFocus
              />
            </label>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: showLabel ? 12 : 18 }}>
            <label className="field" style={{ flex: 1 }}>
              <span className="text-label">Kwota</span>
              <input
                type="number"
                step="0.01"
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus={!showLabel}
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span className="text-label">Data</span>
              <input
                type="date"
                className="input"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </label>
          </div>

          {error && (
            <span style={{ display: 'block', marginTop: 14, color: '#e5484d', fontSize: 13 }}>{error}</span>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 9, marginTop: 24, flexWrap: 'wrap' }}>
            {entry && (
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={busy}>
                Usuń wpis
              </button>
            )}
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
