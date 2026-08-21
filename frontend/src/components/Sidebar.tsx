import { Plus, Settings } from 'lucide-react'
import type { User } from '../api/auth'
import type { Tab } from '../api/tabs'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
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
}

export default function Sidebar({
  tabs,
  activeTabId,
  onSelect,
  onAddTab,
  onEditTab,
  user,
  onLogout,
  isOpen,
  onClose,
}: SidebarProps) {
  const initial = user.email.charAt(0).toUpperCase()

  function handleSelect(id: number) {
    onSelect(id)
    onClose()
  }

  return (
    <aside className={`rail ${isOpen ? 'is-open' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div className="brand-mark brand-mark--sm" />
        <span className="brand-word" style={{ fontSize: 14.5 }}>
          Ledger
        </span>
        <ThemeToggle variant="inline" />
      </div>

      <span className="text-label" style={{ marginTop: 24, padding: '0 8px 6px' }}>
        Zakładki
      </span>
      <div className="rail-tabs">
        {tabs.map((tab) => (
          <div key={tab.id} className="tab-row">
            <button
              type="button"
              className={`tab-item ${tab.id === activeTabId ? 'is-active' : ''}`}
              onClick={() => handleSelect(tab.id)}
            >
              <span className="tab-dot" style={{ background: tab.color }} />
              <span className="tab-name">{tab.name}</span>
            </button>
            <button
              type="button"
              className="tab-gear"
              onClick={() => onEditTab(tab)}
              aria-label={`Ustawienia zakładki ${tab.name}`}
            >
              <Settings size={13} />
            </button>
          </div>
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
