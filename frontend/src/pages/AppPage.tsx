import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, me, type User } from '../api/auth'
import { listTabs, type Tab } from '../api/tabs'
import Sidebar from '../components/Sidebar'
import TabModal from '../components/TabModal'

export default function AppPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<Tab | null>(null)
  const [navOpen, setNavOpen] = useState(false)
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

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  function openCreateModal() {
    setModalTab(null)
    setModalOpen(true)
  }

  function openEditModal(tab: Tab) {
    setModalTab(tab)
    setModalOpen(true)
  }

  function handleSaved(saved: Tab) {
    setTabs((current) => {
      const exists = current.some((t) => t.id === saved.id)
      return exists ? current.map((t) => (t.id === saved.id ? saved : t)) : [...current, saved]
    })
    setActiveTabId(saved.id)
    setModalOpen(false)
  }

  function handleDeleted(id: number) {
    setTabs((current) => {
      const next = current.filter((t) => t.id !== id)
      setActiveTabId((currentActive) => (currentActive === id ? (next[0]?.id ?? null) : currentActive))
      return next
    })
    setModalOpen(false)
  }

  if (!user) {
    return null
  }

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  return (
    <div className="shell">
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}

      <Sidebar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={setActiveTabId}
        onAddTab={openCreateModal}
        onEditTab={openEditModal}
        user={user}
        onLogout={handleLogout}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <main>
        <div className="mobile-topbar">
          <button type="button" className="menu-toggle" onClick={() => setNavOpen(true)} aria-label="Otwórz menu">
            <Menu size={18} />
          </button>
          {activeTab && <span className="tab-dot" style={{ background: activeTab.color, width: 8, height: 8 }} />}
          <span className="mobile-topbar-title">{activeTab ? activeTab.name : 'Ledger'}</span>
        </div>

        {activeTab ? (
          <>
            <header className="main-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span className="tab-dot" style={{ background: activeTab.color, width: 8, height: 8 }} />
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {activeTab.name}
                </h1>
              </div>
            </header>
            <div className="main-content">
              <p className="text-dim">Tutaj pojawią się pola tej zakładki.</p>
            </div>
          </>
        ) : (
          <div className="main-content">
            <div className="panel panel--lg empty-state">
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>Nie masz jeszcze żadnej zakładki</h2>
              <p className="text-dim" style={{ margin: 0 }}>
                Dodaj pierwszą, żeby zacząć układać swoje finanse.
              </p>
              <button type="button" className="btn-cta" style={{ width: 'auto', marginTop: 8 }} onClick={openCreateModal}>
                + Nowa zakładka
              </button>
            </div>
          </div>
        )}
      </main>

      {modalOpen && (
        <TabModal
          tab={modalTab}
          nextPosition={tabs.length}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
