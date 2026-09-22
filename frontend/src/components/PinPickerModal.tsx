import { X } from 'lucide-react'
import { useState } from 'react'
import { pinWidget } from '../api/pins'
import type { Tab } from '../api/tabs'
import { formatAmount } from '../lib/format'

interface PinPickerModalProps {
  tabs: Tab[]
  /** id-ki widgetów już przypiętych - żeby nie dało się przypiąć drugi raz */
  pinnedWidgetIds: Set<number>
  nextPosition: number
  onClose: () => void
  onPinned: () => void
}

interface PickableField {
  widgetId: number
  label: string
  value: string | null
  tabName: string
  tabColor: string
}

export default function PinPickerModal({ tabs, pinnedWidgetIds, nextPosition, onClose, onPinned }: PinPickerModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const pickable: PickableField[] = tabs
    .filter((tab) => !tab.is_home)
    .flatMap((tab) =>
      tab.widgets
        .filter((widget) => !pinnedWidgetIds.has(widget.id))
        .map((widget) => ({
          widgetId: widget.id,
          label: widget.label,
          value: widget.value,
          tabName: tab.name,
          tabColor: tab.color,
        })),
    )

  async function handlePin(widgetId: number) {
    setError(null)
    setBusyId(widgetId)
    try {
      await pinWidget(widgetId, nextPosition)
      onPinned()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się przypiąć pola')
      setBusyId(null)
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Przypnij pole</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={14} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 18 }}>
            {pickable.map((field) => (
              <button
                key={field.widgetId}
                type="button"
                className="field-picker-row"
                onClick={() => handlePin(field.widgetId)}
                disabled={busyId !== null}
              >
                <span className="tab-dot" style={{ background: field.tabColor, width: 6, height: 6 }} />
                <span className="field-picker-name">{field.label}</span>
                <span className="field-picker-value">{field.value != null ? formatAmount(field.value) : '—'}</span>
              </button>
            ))}
            {pickable.length === 0 && (
              <span className="text-meta">Wszystkie pola są już przypięte, albo nie ma jeszcze żadnych.</span>
            )}
          </div>

          {error && (
            <span style={{ display: 'block', marginTop: 14, color: '#e5484d', fontSize: 13 }}>{error}</span>
          )}
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  )
}
