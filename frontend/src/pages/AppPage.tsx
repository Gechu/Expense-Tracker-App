import { Menu, Pencil, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, me, type User } from '../api/auth'
import { listPins, unpin, updatePinPosition, type Pin } from '../api/pins'
import { listTabs, updateTab, type Tab } from '../api/tabs'
import { deleteWidget, updateWidget, type Widget, type WidgetEntry } from '../api/widgets'
import AddFieldModal from '../components/AddFieldModal'
import DragGhost from '../components/DragGhost'
import EntryModal from '../components/EntryModal'
import FieldsMasonry from '../components/FieldsMasonry'
import PinnedWidgetCard from '../components/PinnedWidgetCard'
import PinPickerModal from '../components/PinPickerModal'
import Sidebar from '../components/Sidebar'
import TabModal from '../components/TabModal'
import WidgetCard from '../components/WidgetCard'
import WidgetSettingsModal from '../components/WidgetSettingsModal'
import { useDragReorder } from '../hooks/useDragReorder'

interface EntryModalState {
  widget: Widget
  entry: WidgetEntry | null
}

export default function AppPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [pins, setPins] = useState<Pin[]>([])
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [tabModalOpen, setTabModalOpen] = useState(false)
  const [tabModalTarget, setTabModalTarget] = useState<Tab | null>(null)
  const [navOpen, setNavOpen] = useState(false)
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const [pinPickerOpen, setPinPickerOpen] = useState(false)
  const [widgetSettingsTarget, setWidgetSettingsTarget] = useState<Widget | null>(null)
  const [entryModal, setEntryModal] = useState<EntryModalState | null>(null)
  const [editMode, setEditMode] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    // tabs[0] to zawsze strona główna (backend sortuje is_home first) - staje
    // się domyślną aktywną zakładką, więc pokazuje się od razu po wejściu.
    Promise.all([me(), listTabs(), listPins()])
      .then(([currentUser, currentTabs, currentPins]) => {
        if (!active) return
        setUser(currentUser)
        setTabs(currentTabs)
        setPins(currentPins)
        if (currentTabs.length > 0) setActiveTabId(currentTabs[0].id)
      })
      .catch(() => {
        if (active) navigate('/login', { replace: true })
      })
    return () => {
      active = false
    }
  }, [navigate])

  // Na mobile cała strona scrolluje jako jedna całość (.rail jest position:fixed
  // nałożony na wierzch) - bez tego kafelki pod otwartą szufladą dałoby się
  // przewinąć "przez" przyciemnione tło.
  useEffect(() => {
    if (!navOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [navOpen])

  // "Coś się zmieniło" - odświeża i zakładki, i piny naraz. Piny na stronie
  // głównej to żywe odwołania do widgetów z innych zakładek, więc każda
  // zmiana widgetu (albo usunięcie, przez kaskadę FK - patrz backend) musi
  // się w nich odbić, nie tylko w samych zakładkach.
  async function refreshTabs() {
    const [freshTabs, freshPins] = await Promise.all([listTabs(), listPins()])
    setTabs(freshTabs)
    setPins(freshPins)
  }

  async function handleRenameWidget(widgetId: number, label: string) {
    await updateWidget(widgetId, { label })
    await refreshTabs()
  }

  async function handleDeleteWidget(widgetId: number) {
    await deleteWidget(widgetId)
    await refreshTabs()
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  function openCreateTabModal() {
    setTabModalTarget(null)
    setTabModalOpen(true)
  }

  function openEditTabModal(tab: Tab) {
    setTabModalTarget(tab)
    setTabModalOpen(true)
  }

  function handleTabSaved(saved: Tab) {
    setTabs((current) => {
      const exists = current.some((t) => t.id === saved.id)
      return exists ? current.map((t) => (t.id === saved.id ? saved : t)) : [...current, saved]
    })
    setActiveTabId(saved.id)
    setTabModalOpen(false)
  }

  function handleTabDeleted(id: number) {
    setTabs((current) => {
      const next = current.filter((t) => t.id !== id)
      setActiveTabId((currentActive) => (currentActive === id ? (next[0]?.id ?? null) : currentActive))
      return next
    })
    setTabModalOpen(false)
  }

  const homeTab = tabs.find((t) => t.is_home) ?? null
  // Strona główna jest zawsze pierwsza i nieprzesuwalna - nie bierze udziału
  // w przeciąganiu/zmianie kolejności zwykłych zakładek.
  const regularTabs = tabs.filter((t) => !t.is_home)

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null
  // useMemo (nie zwykłe [...].sort() przy każdym renderze) - inaczej FieldsMasonry
  // dostaje "nową" tablicę i przelicza cały układ murku od zera przy każdej
  // aktualizacji stanu przeciągania (a to potrafi lecieć kilkadziesiąt razy
  // na sekundę), co na słabszym CPU telefonu dawało odczuwalne lagi.
  const activeWidgets = useMemo(
    () => (activeTab ? [...activeTab.widgets].sort((a, b) => a.position - b.position) : []),
    [activeTab],
  )

  const widgetDrag = useDragReorder(activeWidgets, async (reordered) => {
    if (!activeTab) return
    const withPositions = reordered.map((w, index) => ({ ...w, position: index }))
    setTabs((current) => current.map((t) => (t.id === activeTab.id ? { ...t, widgets: withPositions } : t)))
    await Promise.all(withPositions.map((w, index) => updateWidget(w.id, { position: index })))
    await refreshTabs()
  })

  const tabDrag = useDragReorder(regularTabs, async (reordered) => {
    const withPositions = reordered.map((t, index) => ({ ...t, position: index }))
    setTabs((current) => [...current.filter((t) => t.is_home), ...withPositions])
    await Promise.all(withPositions.map((t, index) => updateTab(t.id, { position: index })))
    await refreshTabs()
  })

  const pinDrag = useDragReorder(pins, async (reordered) => {
    const withPositions = reordered.map((p, index) => ({ ...p, position: index }))
    setPins(withPositions)
    await Promise.all(withPositions.map((p, index) => updatePinPosition(p.id, index)))
    await refreshTabs()
  })

  if (!user) {
    return null
  }

  const widgetLabels = Object.fromEntries(
    tabs.flatMap((t) => t.widgets.map((w) => [w.id, w.label] as const)),
  )
  const widgetColors = Object.fromEntries(
    tabs.flatMap((t) => t.widgets.map((w) => [w.id, t.color] as const)),
  )

  return (
    <div className="shell">
      {navOpen && <div className="nav-scrim" onClick={() => setNavOpen(false)} />}
      <DragGhost ghost={tabDrag.ghost} />
      <DragGhost ghost={widgetDrag.ghost} />
      <DragGhost ghost={pinDrag.ghost} />

      <Sidebar
        homeTab={homeTab}
        tabs={regularTabs}
        activeTabId={activeTabId}
        onSelect={setActiveTabId}
        onAddTab={openCreateTabModal}
        onEditTab={openEditTabModal}
        user={user}
        onLogout={handleLogout}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        dragControls={tabDrag}
        editMode={editMode}
        onToggleEditMode={() => setEditMode((current) => !current)}
      />

      <main>
        <div className="mobile-topbar">
          <button type="button" className="menu-toggle" onClick={() => setNavOpen(true)} aria-label="Otwórz menu">
            <Menu size={18} />
          </button>
          {activeTab && <span className="tab-dot" style={{ background: activeTab.color, width: 8, height: 8 }} />}
          <span className="mobile-topbar-title">{activeTab ? activeTab.name : 'Ledger'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <button
              type="button"
              className={`menu-toggle ${editMode ? 'is-active' : ''}`}
              onClick={() => setEditMode((current) => !current)}
              aria-label={editMode ? 'Zakończ edycję układu' : 'Edytuj układ'}
            >
              <Pencil size={16} />
            </button>
            {activeTab && (
              <button
                type="button"
                className="menu-toggle"
                onClick={() => (activeTab.is_home ? setPinPickerOpen(true) : setAddFieldOpen(true))}
                aria-label={activeTab.is_home ? 'Przypnij pole' : 'Dodaj pole'}
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>

        {activeTab ? (
          <>
            <header className="main-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span className="tab-dot" style={{ background: activeTab.color, width: 8, height: 8 }} />
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {activeTab.name}
                </h1>
              </div>
              <button
                type="button"
                className="btn-cta"
                style={{ width: 'auto' }}
                onClick={() => (activeTab.is_home ? setPinPickerOpen(true) : setAddFieldOpen(true))}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} />
                  {activeTab.is_home ? 'Przypnij pole' : 'Dodaj pole'}
                </span>
              </button>
            </header>

            <div className="main-content">
              {activeTab.is_home ? (
                pins.length === 0 ? (
                  <div className="panel panel--lg fields-empty">
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Brak przypiętych pól</h2>
                    <p className="text-dim" style={{ margin: 0 }}>
                      Przypnij pierwsze, żeby mieć je zawsze pod ręką od razu po wejściu do apki.
                    </p>
                    <button type="button" className="btn-cta" style={{ width: 'auto', marginTop: 8 }} onClick={() => setPinPickerOpen(true)}>
                      + Przypnij pole
                    </button>
                  </div>
                ) : (
                  <FieldsMasonry
                    key={activeTab.id}
                    widgets={pins}
                    renderCard={(pin) => (
                      <PinnedWidgetCard
                        pin={pin}
                        onOpenSource={() => setActiveTabId(pin.tab_id)}
                        onUnpin={async () => {
                          await unpin(pin.id)
                          await refreshTabs()
                        }}
                        dragControls={pinDrag}
                        editMode={editMode}
                      />
                    )}
                  />
                )
              ) : activeTab.widgets.length === 0 ? (
                <div className="panel panel--lg fields-empty">
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Brak pól w tej zakładce</h2>
                  <p className="text-dim" style={{ margin: 0 }}>
                    Dodaj pojedyncze pole albo tabelę, żeby zacząć zbierać tu dane.
                  </p>
                  <button type="button" className="btn-cta" style={{ width: 'auto', marginTop: 8 }} onClick={() => setAddFieldOpen(true)}>
                    + Dodaj pole
                  </button>
                </div>
              ) : (
                <FieldsMasonry
                  key={activeTab.id}
                  widgets={activeWidgets}
                  renderCard={(widget) => (
                    <WidgetCard
                      widget={widget}
                      color={activeTab.color}
                      widgetLabels={widgetLabels}
                      widgetColors={widgetColors}
                      onOpenSettings={() => setWidgetSettingsTarget(widget)}
                      onAddEntry={() => setEntryModal({ widget, entry: null })}
                      onEditEntry={(entry) => setEntryModal({ widget, entry })}
                      onChanged={refreshTabs}
                      onRename={(label) => handleRenameWidget(widget.id, label)}
                      onDelete={() => handleDeleteWidget(widget.id)}
                      dragControls={widgetDrag}
                      editMode={editMode}
                    />
                  )}
                />
              )}
            </div>
          </>
        ) : (
          <div className="main-content">
            <div className="panel panel--lg empty-state">
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>Nie masz jeszcze żadnej zakładki</h2>
              <p className="text-dim" style={{ margin: 0 }}>
                Dodaj pierwszą, żeby zacząć układać swoje finanse.
              </p>
              <button type="button" className="btn-cta" style={{ width: 'auto', marginTop: 8 }} onClick={openCreateTabModal}>
                + Nowa zakładka
              </button>
            </div>
          </div>
        )}
      </main>

      {tabModalOpen && (
        <TabModal
          tab={tabModalTarget}
          nextPosition={tabs.length}
          onClose={() => setTabModalOpen(false)}
          onSaved={handleTabSaved}
          onDeleted={handleTabDeleted}
        />
      )}

      {addFieldOpen && activeTab && (
        <AddFieldModal
          tabId={activeTab.id}
          nextPosition={activeTab.widgets.length}
          color={activeTab.color}
          tabs={tabs}
          onClose={() => setAddFieldOpen(false)}
          onCreated={() => {
            setAddFieldOpen(false)
            refreshTabs()
          }}
        />
      )}

      {pinPickerOpen && (
        <PinPickerModal
          tabs={tabs}
          pinnedWidgetIds={new Set(pins.map((p) => p.widget.id))}
          nextPosition={pins.length}
          onClose={() => setPinPickerOpen(false)}
          onPinned={() => {
            setPinPickerOpen(false)
            refreshTabs()
          }}
        />
      )}

      {widgetSettingsTarget && (
        <WidgetSettingsModal
          widget={widgetSettingsTarget}
          color={tabs.find((t) => t.id === widgetSettingsTarget.tab_id)?.color ?? '#8c95a6'}
          tabs={tabs}
          onClose={() => setWidgetSettingsTarget(null)}
          onChanged={() => {
            setWidgetSettingsTarget(null)
            refreshTabs()
          }}
        />
      )}

      {entryModal && (
        <EntryModal
          widgetId={entryModal.widget.id}
          entry={entryModal.entry}
          showLabel={entryModal.widget.type === 'table'}
          nextPosition={entryModal.widget.entries.length}
          onClose={() => setEntryModal(null)}
          onChanged={() => {
            setEntryModal(null)
            refreshTabs()
          }}
        />
      )}
    </div>
  )
}
