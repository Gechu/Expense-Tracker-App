import { Menu, Pencil, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, me, type User } from '../api/auth'
import { listTabs, updateTab, type Tab } from '../api/tabs'
import { deleteWidget, updateWidget, type Widget, type WidgetEntry } from '../api/widgets'
import AddFieldModal from '../components/AddFieldModal'
import DragGhost from '../components/DragGhost'
import EntryModal from '../components/EntryModal'
import FieldsMasonry from '../components/FieldsMasonry'
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
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [tabModalOpen, setTabModalOpen] = useState(false)
  const [tabModalTarget, setTabModalTarget] = useState<Tab | null>(null)
  const [navOpen, setNavOpen] = useState(false)
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const [widgetSettingsTarget, setWidgetSettingsTarget] = useState<Widget | null>(null)
  const [entryModal, setEntryModal] = useState<EntryModalState | null>(null)
  const [editMode, setEditMode] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    Promise.all([me(), listTabs()])
      .then(([currentUser, currentTabs]) => {
        if (!active) return
        setUser(currentUser)
        setTabs(currentTabs)
        if (currentTabs.length > 0) setActiveTabId(currentTabs[0].id)
      })
      .catch(() => {
        if (active) navigate('/login', { replace: true })
      })
    return () => {
      active = false
    }
  }, [navigate])

  async function refreshTabs() {
    const fresh = await listTabs()
    setTabs(fresh)
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

  const tabDrag = useDragReorder(tabs, async (reordered) => {
    const withPositions = reordered.map((t, index) => ({ ...t, position: index }))
    setTabs(withPositions)
    await Promise.all(withPositions.map((t, index) => updateTab(t.id, { position: index })))
    await refreshTabs()
  })

  if (!user) {
    return null
  }

  const widgetLabels = Object.fromEntries(
    tabs.flatMap((t) => t.widgets.map((w) => [w.id, w.label] as const)),
  )

  return (
    <div className="shell">
      {navOpen && <div className="nav-scrim" onClick={() => setNavOpen(false)} />}
      <DragGhost ghost={tabDrag.ghost} />
      <DragGhost ghost={widgetDrag.ghost} />

      <Sidebar
        tabs={tabs}
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
                onClick={() => setAddFieldOpen(true)}
                aria-label="Dodaj pole"
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
              <button type="button" className="btn-cta" style={{ width: 'auto' }} onClick={() => setAddFieldOpen(true)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} />
                  Dodaj pole
                </span>
              </button>
            </header>

            <div className="main-content">
              {activeTab.widgets.length === 0 ? (
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
                  widgets={activeWidgets}
                  renderCard={(widget) => (
                    <WidgetCard
                      widget={widget}
                      color={activeTab.color}
                      widgetLabels={widgetLabels}
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
