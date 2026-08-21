import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, me, type User } from '../api/auth'

export default function AppPage() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    me()
      .then((currentUser) => {
        if (active) setUser(currentUser)
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

  if (!user) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 28px',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        <span className="text-meta">Zalogowano jako {user.email}</span>
        <button className="btn-ghost" onClick={handleLogout}>
          Wyloguj się
        </button>
      </header>
      <main style={{ padding: 28 }}>
        <p className="text-dim">Tu powstanie aplikacja.</p>
      </main>
    </div>
  )
}
