import { GripVertical, X } from 'lucide-react'
import type { Pin } from '../api/pins'
import type { DragReorderControls } from '../hooks/useDragReorder'
import { formatAmount } from '../lib/format'
import { BADGES } from './WidgetCard'

interface PinnedWidgetCardProps {
  pin: Pin
  onOpenSource: () => void
  onUnpin: () => void
  dragControls: DragReorderControls
  /** Tryb edycji układu - tylko wtedy da się przeciągać karty i odpinać */
  editMode: boolean
}

/** Kompaktowa karta na stronie głównej - żywe odwołanie do widgetu z innej
 * zakładki (patrz PinPickerModal), nie kopia. Pokazuje tylko nazwę i jedną
 * główną liczbę (widget.value - dla table to już policzona suma) bez listy
 * wpisów czy inline-edycji - edycja dzieje się na właściwej zakładce, na
 * którą przenosi klik w kartę. Kolor kropki to kolor zakładki ŹRÓDŁOWEJ
 * (pin.tab_color), nie strony głównej - ten sam pomysł co pigułki formuły. */
export default function PinnedWidgetCard({ pin, onOpenSource, onUnpin, dragControls, editMode }: PinnedWidgetCardProps) {
  const { widget } = pin
  const isDragging = dragControls.draggedId === pin.id
  const isDragOver = dragControls.overId === pin.id

  const badgeStyle = {
    color: pin.tab_color,
    borderColor: `${pin.tab_color}33`,
    background: `${pin.tab_color}14`,
    border: '1px solid',
  }

  return (
    <div
      className="panel field-card"
      ref={(el) => dragControls.registerNode(pin.id, el)}
      style={{
        opacity: isDragging ? 0.4 : 1,
        outline: isDragOver ? `2px dashed ${pin.tab_color}` : 'none',
        outlineOffset: -2,
        cursor: 'pointer',
      }}
      onClick={onOpenSource}
    >
      <div className="field-card-header">
        {editMode && (
          <GripVertical
            size={14}
            className="field-drag-handle"
            onPointerDown={(e) => {
              e.stopPropagation()
              dragControls.handlePointerDown(pin.id, e)
            }}
            onPointerMove={dragControls.handlePointerMove}
            onPointerUp={dragControls.handlePointerUp}
          />
        )}
        <span className="tab-dot" style={{ background: pin.tab_color, width: 8, height: 8 }} />
        <span className="field-title">{widget.label}</span>
        <span className="field-badge" style={badgeStyle}>
          {BADGES[widget.type]}
        </span>
        {editMode && (
          <button
            type="button"
            className="field-icon-btn"
            onClick={(e) => {
              e.stopPropagation()
              onUnpin()
            }}
            aria-label="Odepnij pole"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <span className="field-value-big" style={{ color: pin.tab_color }}>
        {formatAmount(widget.value ?? 0)}
      </span>
      <span className="text-meta" style={{ display: 'block', marginTop: 6 }}>{pin.tab_name}</span>
    </div>
  )
}
