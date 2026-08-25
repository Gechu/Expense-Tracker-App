import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { deleteWidget, updateWidget, type CurrencyConfig, type FormulaConfig, type Widget } from '../api/widgets'
import type { Tab } from '../api/tabs'
import CurrencySelect from './CurrencySelect'
import FormulaTermsField, { termsToConfig, type ReferenceOption } from './FormulaTermsField'
import RateField from './RateField'

interface WidgetSettingsModalProps {
  widget: Widget
  tabs: Tab[]
  onClose: () => void
  onChanged: () => void
}

export default function WidgetSettingsModal({ widget, tabs, onClose, onChanged }: WidgetSettingsModalProps) {
  const [label, setLabel] = useState(widget.label)
  const currencyConfig = widget.type === 'currency' ? (widget.config as CurrencyConfig | null) : null
  const formulaConfig = widget.type === 'formula' ? (widget.config as FormulaConfig | null) : null

  const [amount, setAmount] = useState(String(currencyConfig?.amount ?? ''))
  const [rate, setRate] = useState(String(currencyConfig?.rate ?? ''))
  const [fromCurrency, setFromCurrency] = useState(currencyConfig?.from_currency ?? 'EUR')
  const [toCurrency, setToCurrency] = useState(currencyConfig?.to_currency ?? 'PLN')
  const [terms, setTerms] = useState<{ widgetId: number | ''; sign: '+' | '-' }[]>(
    formulaConfig && formulaConfig.terms.length > 0
      ? formulaConfig.terms.map((t) => ({ widgetId: t.widget_id, sign: t.sign }))
      : [{ widgetId: '', sign: '+' }],
  )

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // formuła nie może odwoływać się do samej siebie ani do innych formuł
  const referenceOptions: ReferenceOption[] = tabs.flatMap((tab) =>
    tab.widgets
      .filter((w) => w.type !== 'formula' && w.id !== widget.id)
      .map((w) => ({ id: w.id, label: w.label, tabName: tab.name })),
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (widget.type === 'currency') {
        await updateWidget(widget.id, {
          label,
          config: { amount: Number(amount || 0), from_currency: fromCurrency, to_currency: toCurrency, rate: Number(rate || 0) },
        })
      } else if (widget.type === 'formula') {
        await updateWidget(widget.id, { label, config: { terms: termsToConfig(terms) } })
      } else {
        await updateWidget(widget.id, { label })
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

          {widget.type === 'currency' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
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
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <CurrencySelect label="Z waluty" value={fromCurrency} onChange={setFromCurrency} />
                <CurrencySelect label="Na walutę" value={toCurrency} onChange={setToCurrency} />
              </div>
            </>
          )}

          {widget.type === 'formula' && (
            <FormulaTermsField terms={terms} onChange={setTerms} options={referenceOptions} />
          )}

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
