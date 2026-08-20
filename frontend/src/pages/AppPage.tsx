import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, me, type User } from '../api'

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
    <div className="app-page">
      <header>
        <span>Zalogowano jako {user.email}</span>
        <button onClick={handleLogout}>Wyloguj się</button>
      </header>
      <main>
        <p>Tu powstanie aplikacja.</p>
      </main>
    </div>
  )
}
