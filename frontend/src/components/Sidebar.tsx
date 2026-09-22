import { GripVertical, Pencil, Plus, Settings } from 'lucide-react'
import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { User } from '../api/auth'
import type { Tab } from '../api/tabs'
import type { DragReorderControls } from '../hooks/useDragReorder'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
  /** Strona główna - osobny, stały wiersz nad listą zakładek (patrz niżej),
   * nigdy nieprzesuwalny. Może być null tylko na ułamek sekundy przed
   * pierwszym pobraniem danych. */
  homeTab: Tab | null
  tabs: Tab[]
  activeTabId: number | null
  onSelect: (id: number) => void
  onAddTab: () => void
  onEditTab: (tab: Tab) => void
  user: User
  onLogout: () => void
  /** Czy nakładka na wąskim ekranie jest otwarta (bez znaczenia na desktopie) */
  isOpen: boolean
  onClose: () => void
  dragControls: DragReorderControls
  /** Tryb edycji układu - tylko wtedy da się przeciągać zakładki i pola,
   * i dopiero wtedy widać zębatkę zakładki (ustawienia w modalu). */
  editMode: boolean
  onToggleEditMode: () => void
}

interface TabRowProps {
  tab: Tab
  isActive: boolean
  editMode: boolean
  onSelect: () => void
  onEditTab: () => void
  dragControls: DragReorderControls
  onDragPointerMove: (event: ReactPointerEvent<Element>) => void
  /** Strona główna jest zawsze pierwsza i nieprzesuwalna - bez uchwytu
   * przeciągania nawet w trybie edycji (patrz Sidebar). */
  draggable?: boolean
}

/** Wiersz zakładki - uchwyt do przeciągania (Pointer Events, działa myszą
 * i dotykiem - patrz useDragReorder) jest widoczny tylko w trybie edycji,
 * tak samo jak zębatka (pełne ustawienia w modalu). */
function TabRow({ tab, isActive, editMode, onSelect, onEditTab, dragControls, onDragPointerMove, draggable = true }: TabRowProps) {
  const isDragging = dragControls.draggedId === tab.id
  const isDragOver = dragControls.overId === tab.id

  return (
    <div
      className="tab-row"
      ref={(el) => dragControls.registerNode(tab.id, el)}
      style={{
        opacity: isDragging ? 0.4 : 1,
        outline: isDragOver ? `2px dashed ${tab.color}` : 'none',
        outlineOffset: -2,
      }}
    >
      {editMode && draggable && (
        <GripVertical
          size={13}
          className="tab-drag-handle"
          onPointerDown={(e) => dragControls.handlePointerDown(tab.id, e)}
          onPointerMove={onDragPointerMove}
          onPointerUp={dragControls.handlePointerUp}
        />
      )}
      <button type="button" className={`tab-item ${isActive ? 'is-active' : ''}`} onClick={onSelect}>
        <span className="tab-dot" style={{ background: tab.color }} />
        <span className="tab-name">{tab.name}</span>
      </button>
      {editMode && (
        <button type="button" className="tab-gear" onClick={onEditTab} aria-label={`Ustawienia zakładki ${tab.name}`}>
          <Settings size={13} />
        </button>
      )}
    </div>
  )
}

export default function Sidebar({
  homeTab,
  tabs,
  activeTabId,
  onSelect,
  onAddTab,
  onEditTab,
  user,
  onLogout,
  isOpen,
  onClose,
  dragControls,
  editMode,
  onToggleEditMode,
}: SidebarProps) {
  const initial = user.email.charAt(0).toUpperCase()
  const railRef = useRef<HTMLElement | null>(null)

  function handleSelect(id: number) {
    onSelect(id)
    onClose()
  }

  // Na mobilnym szuflada zakładek (.rail) leży NAD przyciemnionym tłem
  // (.nav-scrim), które zasłania resztę ekranu - jak palec podczas
  // przeciągania zjedzie poza szufladę (czyli na to przyciemnione tło),
  // przeciąganie ma się od razu zakończyć (bez zmiany kolejności), zamiast
  // dalej "wisieć" nad zasłoniętą zawartością.
  function handleTabDragPointerMove(event: ReactPointerEvent<Element>) {
    const rail = railRef.current
    if (rail && dragControls.draggedId != null) {
      const rect = rail.getBoundingClientRect()
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      if (!inside) {
        dragControls.handlePointerUp(event)
        return
      }
    }
    dragControls.handlePointerMove(event)
  }

  return (
    <aside className={`rail ${isOpen ? 'is-open' : ''}`} ref={railRef}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div className="brand-mark brand-mark--sm" />
        <span className="brand-word" style={{ fontSize: 14.5 }}>
          Ledger
        </span>
        <ThemeToggle variant="inline" />
      </div>

      {homeTab && (
        <div style={{ marginTop: 20 }}>
          <TabRow
            tab={homeTab}
            isActive={homeTab.id === activeTabId}
            editMode={editMode}
            onSelect={() => handleSelect(homeTab.id)}
            onEditTab={() => onEditTab(homeTab)}
            dragControls={dragControls}
            onDragPointerMove={handleTabDragPointerMove}
            draggable={false}
          />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 20,
          padding: '0 8px 6px',
        }}
      >
        <span className="text-label">Zakładki</span>
        <button
          type="button"
          className={`edit-mode-btn ${editMode ? 'is-active' : ''}`}
          onClick={onToggleEditMode}
        >
          <Pencil size={11} />
          <span>{editMode ? 'Gotowe' : 'Edytuj'}</span>
        </button>
      </div>
      <div className="rail-tabs">
        {tabs.map((tab) => (
          <TabRow
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            editMode={editMode}
            onSelect={() => handleSelect(tab.id)}
            onEditTab={() => onEditTab(tab)}
            dragControls={dragControls}
            onDragPointerMove={handleTabDragPointerMove}
          />
        ))}
        <button
          type="button"
          className="add-tab-btn"
          onClick={() => {
            onAddTab()
            onClose()
          }}
        >
          <Plus size={14} />
          <span>Nowa zakładka</span>
        </button>
      </div>

      <div className="user-card">
        <div className="user-btn">
          <span className="avatar">{initial}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, textAlign: 'left' }}>
            <span className="user-name">{user.email}</span>
            <span className="text-meta">Konto</span>
          </span>
        </div>
        <button type="button" className="btn-ghost" onClick={onLogout}>
          Wyloguj się
        </button>
      </div>
    </aside>
  )
}
