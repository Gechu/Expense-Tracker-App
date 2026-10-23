import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="orb-field">
        <div className="orb orb--1" />
        <div className="orb orb--2" />
        <div className="orb orb--3" />
      </div>

      <ThemeToggle />

      <div className="auth-center">
        <div className="brand">
          <div className="brand-mark" />
          <span className="brand-word">Expense App</span>
        </div>

        <div
          className="panel panel--lg auth-card"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}
        >
          <span className="text-meta">błąd 404</span>
          <h1 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.02em' }}>Nie ma takiej strony</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dim)' }}>
            Adres jest błędny albo strona została przeniesiona.
          </p>
          {/* /app sam odsyła niezalogowanych na /login */}
          <button type="button" className="btn-cta" style={{ marginTop: 10 }} onClick={() => navigate('/app')}>
            Wróć do aplikacji
          </button>
        </div>
      </div>
    </div>
  )
}
