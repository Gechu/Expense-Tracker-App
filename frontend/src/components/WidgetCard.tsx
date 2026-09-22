import { GripVertical, Plus, Settings, Trash2, X } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { formatAmount, formatDate } from '../lib/format'
import { deleteEntry, type CurrencyConfig, type FormulaConfig, type Widget, type WidgetEntry } from '../api/widgets'
import type { DragReorderControls } from '../hooks/useDragReorder'
import { OP_LABELS } from './FormulaBuilder'

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
  /** id widgetu -> kolor JEGO zakładki, do pokolorowania pigułek składników
   * formuły po tym, skąd pochodzą (a nie kolorem zakładki, na której jest
   * sama formuła) */
  widgetColors: Record<number, string>
  onOpenSettings: () => void
  onAddEntry: () => void
  onEditEntry: (entry: WidgetEntry) => void
  onChanged: () => void
  onRename: (label: string) => void
  onDelete: () => void
  dragControls: DragReorderControls
  /** Tryb edycji układu - tylko wtedy da się przeciągać karty */
  editMode: boolean
}

export default function WidgetCard({
  widget,
  color,
  widgetLabels,
  widgetColors,
  onOpenSettings,
  onAddEntry,
  onEditEntry,
  onChanged,
  onRename,
  onDelete,
  dragControls,
  editMode,
}: WidgetCardProps) {
  const [labelDraft, setLabelDraft] = useState(widget.label)

  useEffect(() => {
    setLabelDraft(widget.label)
  }, [widget.label])

  // Nazwa edytuje się wprost na kafelku w trybie edycji - dla każdego typu
  // pola. Zębatka (gdy jest) otwiera modal z resztą, właściwą konfiguracją
  // (formuła/waluta), a nie z podstawowym info jak nazwa.
  const isNameEditable = editMode
  const canDeleteInline = editMode && (widget.type === 'single_value' || widget.type === 'table')

  function commitLabel() {
    const trimmed = labelDraft.trim()
    if (trimmed && trimmed !== widget.label) {
      onRename(trimmed)
    } else {
      setLabelDraft(widget.label)
    }
  }

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

  const isDragging = dragControls.draggedId === widget.id
  const isDragOver = dragControls.overId === widget.id

  return (
    <div
      className="panel field-card"
      ref={(el) => dragControls.registerNode(widget.id, el)}
      style={{
        opacity: isDragging ? 0.4 : 1,
        outline: isDragOver ? `2px dashed ${color}` : 'none',
        outlineOffset: -2,
      }}
    >
      <div className="field-card-header">
        {editMode && (
          <GripVertical
            size={14}
            className="field-drag-handle"
            onPointerDown={(e) => dragControls.handlePointerDown(widget.id, e)}
            onPointerMove={dragControls.handlePointerMove}
            onPointerUp={dragControls.handlePointerUp}
          />
        )}
        <span className="tab-dot" style={{ background: color, width: 8, height: 8 }} />
        {isNameEditable ? (
          <input
            type="text"
            className="field-title-input"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') {
                setLabelDraft(widget.label)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="field-title">{widget.label}</span>
        )}
        <span className="field-badge" style={badgeStyle}>
          {BADGES[widget.type]}
        </span>
        {(widget.type === 'formula' || widget.type === 'currency') && (
          <button type="button" className="field-icon-btn" onClick={onOpenSettings} aria-label="Ustawienia pola">
            <Settings size={12} />
          </button>
        )}
        {canDeleteInline && (
          <button type="button" className="field-icon-btn" onClick={onDelete} aria-label="Usuń pole">
            <Trash2 size={12} />
          </button>
        )}
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
            {soleEntry
              ? widget.updated_at
                ? `zaktualizowano ${formatDate(widget.updated_at.slice(0, 10))}`
                : ''
              : 'kliknij, aby ustawić kwotę'}
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

          <div className="token-strip" style={{ marginTop: 16 }}>
            {(formulaConfig?.tokens ?? []).map((token, index) => {
              if (token.kind === 'field') {
                // Pigułka w kolorze zakładki źródłowej pola, nie tej, na
                // której jest sama formuła - widać wtedy skąd bierze się wartość.
                const fieldColor = widgetColors[token.widget_id] ?? color
                return (
                  <span
                    key={index}
                    className="token-field"
                    style={{ border: `1px solid ${fieldColor}3a`, background: `${fieldColor}20` }}
                  >
                    {widgetLabels[token.widget_id] ?? 'usunięte pole'}
                  </span>
                )
              }
              if (token.kind === 'number') {
                return (
                  <span key={index} className="token-number">
                    {token.value}
                  </span>
                )
              }
              return (
                <span key={index} className="token-op">
                  {OP_LABELS[token.value]}
                </span>
              )
            })}
            {(formulaConfig?.tokens ?? []).length === 0 && (
              <span className="text-meta">brak formuły - edytuj pole, żeby ją zbudować</span>
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
