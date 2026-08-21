import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { createTab, deleteTab, updateTab, type Tab } from '../api/tabs'

const PALETTE = ['#3fbf94', '#e8963c', '#5b93e0', '#d9b234', '#e07aa8', '#8c95a6', '#9b7ce8']

interface TabModalProps {
  /** null = tworzenie nowej zakładki, Tab = edycja istniejącej */
  tab: Tab | null
  nextPosition: number
  onClose: () => void
  onSaved: (tab: Tab) => void
  onDeleted: (id: number) => void
}

export default function TabModal({ tab, nextPosition, onClose, onSaved, onDeleted }: TabModalProps) {
  const [name, setName] = useState(tab?.name ?? '')
  const [color, setColor] = useState(tab?.color ?? PALETTE[0])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(tab?.name ?? '')
    setColor(tab?.color ?? PALETTE[0])
  }, [tab])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const saved = tab ? await updateTab(tab.id, { name, color }) : await createTab(name, color, nextPosition)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać zakładki')
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!tab) return
    setBusy(true)
    try {
      await deleteTab(tab.id)
      onDeleted(tab.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się usunąć zakładki')
      setBusy(false)
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{tab ? 'Ustawienia zakładki' : 'Nowa zakładka'}</h2>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Samochód"
              required
              autoFocus
            />
          </label>

          <div style={{ marginTop: 16 }}>
            <span className="text-label">Kolor</span>
            <div className="swatch-row">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="swatch"
                  style={{
                    background: color === c ? c : `${c}2e`,
                    borderColor: color === c ? c : `${c}44`,
                    boxShadow: color === c ? `0 0 0 3px ${c}2a` : 'none',
                  }}
                  onClick={() => setColor(c)}
                  aria-label={`Wybierz kolor ${c}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <span style={{ display: 'block', marginTop: 14, color: '#e5484d', fontSize: 13 }}>{error}</span>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 9, marginTop: 24, flexWrap: 'wrap' }}>
            {tab && (
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={busy}>
                Usuń zakładkę
              </button>
            )}
            <div style={{ display: 'flex', gap: 9, marginLeft: 'auto' }}>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Anuluj
              </button>
              <button type="submit" className="btn-cta" style={{ width: 'auto', padding: '11px 17px' }} disabled={busy}>
                {tab ? 'Zapisz' : 'Utwórz'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
