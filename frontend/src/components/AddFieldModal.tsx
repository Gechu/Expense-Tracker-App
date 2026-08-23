import { Table2, Type, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { createEntry, createWidget, type WidgetType } from '../api/widgets'

const TYPE_OPTIONS: { type: WidgetType; label: string; hint: string; icon: typeof Type }[] = [
  { type: 'single_value', label: 'Pojedyncze pole', hint: 'opis, kwota, data', icon: Type },
  { type: 'table', label: 'Tabela', hint: 'lista wpisów + suma', icon: Table2 },
]

interface AddFieldModalProps {
  tabId: number
  nextPosition: number
  onClose: () => void
  onCreated: () => void
}

export default function AddFieldModal({ tabId, nextPosition, onClose, onCreated }: AddFieldModalProps) {
  const [type, setType] = useState<WidgetType>('single_value')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const widget = await createWidget(tabId, type, label, nextPosition)
      if (type === 'single_value') {
        await createEntry(widget.id, { amount: amount || 0, entry_date: entryDate })
      }
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się dodać pola')
      setBusy(false)
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nowe pole</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginTop: 18 }}>
            <span className="text-label">Typ</span>
            <div style={{ display: 'flex', gap: 9, marginTop: 9 }}>
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon
                const active = option.type === type
                return (
                  <button
                    key={option.type}
                    type="button"
                    className="panel"
                    onClick={() => setType(option.type)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '14px 10px',
                      cursor: 'pointer',
                      borderColor: active ? 'var(--text)' : undefined,
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{option.label}</span>
                    <span className="text-meta">{option.hint}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="field" style={{ marginTop: 16 }}>
            <span className="text-label">Nazwa</span>
            <input
              type="text"
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="np. Stan konta"
              required
              autoFocus
            />
          </label>

          {type === 'single_value' && (
            <div className="field-animate" style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="text-label">Kwota</span>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="text-label">Data</span>
                <input
                  type="date"
                  className="input"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </label>
            </div>
          )}

          {error && (
            <span style={{ display: 'block', marginTop: 14, color: '#e5484d', fontSize: 13 }}>{error}</span>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 24 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-cta" style={{ width: 'auto', padding: '11px 17px' }} disabled={busy}>
              Utwórz
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
