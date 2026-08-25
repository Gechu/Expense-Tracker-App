import { ArrowLeftRight, Sigma, Table2, Type, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { createEntry, createWidget, type FormulaToken, type WidgetType } from '../api/widgets'
import type { Tab } from '../api/tabs'
import CurrencySelect from './CurrencySelect'
import FormulaBuilder, { type ReferenceField } from './FormulaBuilder'
import RateField from './RateField'

const TYPE_OPTIONS: { type: WidgetType; label: string; hint: string; icon: typeof Type }[] = [
  { type: 'single_value', label: 'Pojedyncze pole', hint: 'opis, kwota, data', icon: Type },
  { type: 'table', label: 'Tabela', hint: 'lista wpisów + suma', icon: Table2 },
  { type: 'formula', label: 'Formuła', hint: 'wynik z innych pól', icon: Sigma },
  { type: 'currency', label: 'Waluta', hint: 'kwota → kwota', icon: ArrowLeftRight },
]

interface AddFieldModalProps {
  tabId: number
  nextPosition: number
  /** kolor bieżącej zakładki - pigułki formuły i podgląd wyniku */
  color: string
  /** wszystkie zakładki - do wyboru składników formuły spoza bieżącej zakładki */
  tabs: Tab[]
  onClose: () => void
  onCreated: () => void
}

export default function AddFieldModal({ tabId, nextPosition, color, tabs, onClose, onCreated }: AddFieldModalProps) {
  const [type, setType] = useState<WidgetType>('single_value')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [fromCurrency, setFromCurrency] = useState('EUR')
  const [toCurrency, setToCurrency] = useState('PLN')
  const [rate, setRate] = useState('')
  const [tokens, setTokens] = useState<FormulaToken[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const referenceFields: ReferenceField[] = tabs.flatMap((tab) =>
    tab.widgets.map((w) => ({ id: w.id, label: w.label, tabColor: tab.color, value: Number(w.value ?? 0) })),
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (type === 'single_value') {
        const widget = await createWidget(tabId, type, label, nextPosition)
        await createEntry(widget.id, { amount: amount || 0, entry_date: entryDate })
      } else if (type === 'currency') {
        await createWidget(tabId, type, label, nextPosition, {
          amount: Number(amount || 0),
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate: Number(rate || 0),
        })
      } else if (type === 'formula') {
        await createWidget(tabId, type, label, nextPosition, { tokens })
      } else {
        await createWidget(tabId, type, label, nextPosition)
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
            <div style={{ display: 'flex', gap: 9, marginTop: 9, flexWrap: 'wrap' }}>
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
                      flex: '1 1 calc(50% - 5px)',
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

          {type === 'currency' && (
            <div className="field-animate">
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span className="text-label">Kwota</span>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </label>
                <RateField rate={rate} onChange={setRate} fromCurrency={fromCurrency} toCurrency={toCurrency} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <CurrencySelect label="Z waluty" value={fromCurrency} onChange={setFromCurrency} />
                <CurrencySelect label="Na walutę" value={toCurrency} onChange={setToCurrency} />
              </div>
            </div>
          )}

          {type === 'formula' && (
            <div className="field-animate">
              <FormulaBuilder tokens={tokens} onChange={setTokens} referenceFields={referenceFields} color={color} />
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
