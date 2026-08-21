import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import ThemeToggle from '../components/ThemeToggle'

type AuthMode = 'login' | 'register'

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const isRegister = mode === 'register'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      if (isRegister) {
        await register(email, password)
        navigate('/login')
      } else {
        await login(email, password)
        navigate('/app')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coś poszło nie tak')
    }
  }

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
          <span className="brand-word">Ledger</span>
        </div>

        <div className="panel panel--lg auth-card">
          <div className="seg">
            <div className={`seg-thumb ${isRegister ? 'is-register' : ''}`} />
            <button
              type="button"
              className={`seg-btn ${!isRegister ? 'is-active' : ''}`}
              onClick={() => navigate('/login')}
            >
              Zaloguj się
            </button>
            <button
              type="button"
              className={`seg-btn ${isRegister ? 'is-active' : ''}`}
              onClick={() => navigate('/register')}
            >
              Załóż konto
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 24 }}>
            {isRegister && (
              <label className="field field-animate">
                <span className="text-label">Imię</span>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kamil"
                />
              </label>
            )}
            <label className="field">
              <span className="text-label">Email</span>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamil@mail.com"
                required
              />
            </label>
            <label className="field">
              <span className="text-label">Hasło</span>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                minLength={isRegister ? 8 : undefined}
                required
              />
            </label>

            {error && <span style={{ color: '#e5484d', fontSize: 13 }}>{error}</span>}

            <button type="submit" className="btn-cta">
              {isRegister ? 'Załóż konto' : 'Wejdź'}
            </button>

            <span className="text-meta" style={{ textAlign: 'center' }}>
              {isRegister ? 'zaczniesz z czystym kontem' : 'zaloguj się do swojego konta'}
            </span>
          </form>
        </div>
      </div>
    </div>
  )
}
