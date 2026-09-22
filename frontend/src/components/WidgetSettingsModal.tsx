import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  deleteWidget,
  updateWidget,
  type CurrencyConfig,
  type FormulaConfig,
  type FormulaToken,
  type Widget,
} from '../api/widgets'
import type { Tab } from '../api/tabs'
import CurrencySelect from './CurrencySelect'
import FormulaBuilder, { isFormulaComplete, type ReferenceField } from './FormulaBuilder'
import RateField from './RateField'

interface WidgetSettingsModalProps {
  widget: Widget
  /** kolor zakładki, do której należy edytowane pole */
  color: string
  tabs: Tab[]
  onClose: () => void
  onChanged: () => void
}

export default function WidgetSettingsModal({ widget, color, tabs, onClose, onChanged }: WidgetSettingsModalProps) {
  const currencyConfig = widget.type === 'currency' ? (widget.config as CurrencyConfig | null) : null
  const formulaConfig = widget.type === 'formula' ? (widget.config as FormulaConfig | null) : null

  const [amount, setAmount] = useState(String(currencyConfig?.amount ?? ''))
  const [rate, setRate] = useState(String(currencyConfig?.rate ?? ''))
  const [fromCurrency, setFromCurrency] = useState(currencyConfig?.from_currency ?? 'EUR')
  const [toCurrency, setToCurrency] = useState(currencyConfig?.to_currency ?? 'PLN')
  const [tokens, setTokens] = useState<FormulaToken[]>(formulaConfig?.tokens ?? [])

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // formuła nie może odwoływać się sama do siebie
  const referenceFields: ReferenceField[] = tabs.flatMap((tab) =>
    tab.widgets
      .filter((w) => w.id !== widget.id)
      .map((w) => ({ id: w.id, label: w.label, tabColor: tab.color, value: Number(w.value ?? 0) })),
  )
  const canSubmit = widget.type !== 'formula' || isFormulaComplete(tokens)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (widget.type === 'currency') {
        await updateWidget(widget.id, {
          config: { amount: Number(amount || 0), from_currency: fromCurrency, to_currency: toCurrency, rate: Number(rate || 0) },
        })
      } else {
        await updateWidget(widget.id, { config: { tokens } })
      }
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
          {widget.type === 'currency' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span className="text-label">Kwota</span>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </label>
                <RateField rate={rate} onChange={setRate} fromCurrency={fromCurrency} toCurrency={toCurrency} />
              </div>
              {/* Selecty pod sobą, nie obok siebie - część nazw walut (np.
                 "Rand południowoafrykański") nie mieści się w połówce wąskiego
                 modala i przycina się bez wielokropka tuż przy strzałce. */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                <CurrencySelect label="Z waluty" value={fromCurrency} onChange={setFromCurrency} />
                <CurrencySelect label="Na walutę" value={toCurrency} onChange={setToCurrency} />
              </div>
            </>
          )}

          {widget.type === 'formula' && (
            <div style={{ marginTop: 18 }}>
              <FormulaBuilder tokens={tokens} onChange={setTokens} referenceFields={referenceFields} color={color} />
              {!canSubmit && (
                <span style={{ display: 'block', marginTop: 8, color: 'var(--text-faint)', fontSize: 11.5 }}>
                  Formuła jest niedokończona - sprawdź, czy wszystkie nawiasy są domknięte i czy nie kończy się
                  operatorem.
                </span>
              )}
            </div>
          )}

          {error && (
            <span style={{ display: 'block', marginTop: 14, color: '#e5484d', fontSize: 13 }}>{error}</span>
          )}
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: 9, flexWrap: 'wrap' }}>
            <button type="button" className="btn-danger" onClick={handleDelete} disabled={busy}>
              Usuń pole
            </button>
            <div style={{ display: 'flex', gap: 9, marginLeft: 'auto' }}>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Anuluj
              </button>
              <button
                type="submit"
                className="btn-cta"
                style={{ width: 'auto', padding: '11px 17px' }}
                disabled={busy || !canSubmit}
              >
                Zapisz
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
