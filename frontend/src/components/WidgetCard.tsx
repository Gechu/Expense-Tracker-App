import { Plus, Settings, X } from 'lucide-react'
import type { MouseEvent } from 'react'
import { formatAmount, formatDate } from '../lib/format'
import { deleteEntry, type CurrencyConfig, type FormulaConfig, type Widget, type WidgetEntry } from '../api/widgets'

const BADGES: Record<Widget['type'], string> = {
  single_value: 'Pole',
  table: 'Tabela',
  formula: 'Formuła',
  currency: 'Waluta',
}

interface WidgetCardProps {
  widget: Widget
  color: string
  /** id widgetu -> jego nazwa, do podpisania składników formuły */
  widgetLabels: Record<number, string>
  onOpenSettings: () => void
  onAddEntry: () => void
  onEditEntry: (entry: WidgetEntry) => void
  onChanged: () => void
}

export default function WidgetCard({
  widget,
  color,
  widgetLabels,
  onOpenSettings,
  onAddEntry,
  onEditEntry,
  onChanged,
}: WidgetCardProps) {
  const badgeStyle = {
    color,
    borderColor: `${color}33`,
    background: `${color}14`,
    border: '1px solid',
  }

  async function handleDeleteEntry(event: MouseEvent, entryId: number) {
    event.stopPropagation()
    await deleteEntry(entryId)
    onChanged()
  }

  const soleEntry = widget.entries[0] ?? null
  const currencyConfig = widget.type === 'currency' ? (widget.config as CurrencyConfig | null) : null
  const formulaConfig = widget.type === 'formula' ? (widget.config as FormulaConfig | null) : null

  return (
    <div className="panel field-card">
      <div className="field-card-header">
        <span className="tab-dot" style={{ background: color, width: 8, height: 8 }} />
        <span className="field-title">{widget.label}</span>
        <span className="field-badge" style={badgeStyle}>
          {BADGES[widget.type]}
        </span>
        <button type="button" className="field-icon-btn" onClick={onOpenSettings} aria-label="Ustawienia pola">
          <Settings size={12} />
        </button>
      </div>

      {widget.type === 'single_value' && (
        <div>
          <button
            type="button"
            onClick={() => (soleEntry ? onEditEntry(soleEntry) : onAddEntry())}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span className="field-value-big">{formatAmount(widget.value ?? 0)}</span>
              <span className="field-currency">zł</span>
            </div>
          </button>
          <div className="field-foot">
            {soleEntry ? `dodano ${formatDate(soleEntry.entry_date)}` : 'kliknij, aby ustawić kwotę'}
          </div>
        </div>
      )}

      {widget.type === 'table' && (
        <div>
          <div className="field-rows">
            {widget.entries.map((entry) => (
              <div key={entry.id} className="field-row" role="button" tabIndex={0} onClick={() => onEditEntry(entry)}>
                <span className="field-row-label">{entry.label || '(bez opisu)'}</span>
                <span className="field-row-date">{formatDate(entry.entry_date)}</span>
                <span
                  className="field-row-amount"
                  style={{ color: Number(entry.amount) < 0 ? '#e0655f' : 'var(--text)' }}
                >
                  {formatAmount(entry.amount)}
                </span>
                <button
                  type="button"
                  className="field-icon-btn"
                  onClick={(e) => handleDeleteEntry(e, entry.id)}
                  aria-label="Usuń wpis"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="add-entry-btn" onClick={onAddEntry}>
            <Plus size={12} />
            <span>Dodaj wpis</span>
          </button>

          <div className="field-sum-row" style={{ border: `1px solid ${color}30`, background: `${color}18` }}>
            <span className="field-sum-label">Suma</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="field-sum-value" style={{ color }}>
                {formatAmount(widget.value ?? 0)}
              </span>
              <span className="field-currency">zł</span>
            </span>
          </div>

          <div className="field-foot">
            {widget.updated_at ? `zaktualizowano ${formatDate(widget.updated_at.slice(0, 10))}` : ''}
          </div>
        </div>
      )}

      {widget.type === 'formula' && (
        <div>
          <span className="field-result" style={{ color }}>
            {formatAmount(widget.value ?? 0)}
          </span>

          <div className="field-tokens">
            {(formulaConfig?.terms ?? []).map((term, index) => (
              <span
                key={index}
                className="field-token"
                style={{ border: `1px solid ${color}3a`, background: `${color}20` }}
              >
                {term.sign === '-' ? '−' : '+'} {widgetLabels[term.widget_id] ?? 'usunięte pole'}
              </span>
            ))}
            {(formulaConfig?.terms ?? []).length === 0 && (
              <span className="text-meta">brak składników - edytuj pole, żeby je dodać</span>
            )}
          </div>

          <div className="field-foot-split">
            <span>{widget.updated_at ? `na żywo od ${formatDate(widget.updated_at.slice(0, 10))}` : ''}</span>
            <span>na żywo</span>
          </div>
        </div>
      )}

      {widget.type === 'currency' && currencyConfig && (
        <div>
          <div className="field-fx-grid">
            <div className="field-fx-side">
              <span className="field-fx-amount">{formatAmount(currencyConfig.amount)}</span>
              <span className="field-fx-tag">{currencyConfig.from_currency}</span>
            </div>
            <span style={{ fontSize: 16, color }}>→</span>
            <div className="field-fx-side field-fx-side--right">
              <span className="field-result" style={{ fontSize: 22, color }}>
                {formatAmount(widget.value ?? 0)}
              </span>
              <span className="field-fx-tag">{currencyConfig.to_currency}</span>
            </div>
          </div>

          <div className="field-foot-split">
            <span>
              1 {currencyConfig.from_currency} = {formatAmount(currencyConfig.rate)} {currencyConfig.to_currency}
            </span>
            <span>{widget.updated_at ? formatDate(widget.updated_at.slice(0, 10)) : ''}</span>
          </div>
        </div>
      )}
    </div>
  )
}
