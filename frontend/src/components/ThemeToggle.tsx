import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyTheme, getInitialTheme, type Theme } from '../styles/theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      aria-label="Przełącz motyw jasny/ciemny"
      title="Przełącz motyw"
    >
      {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}
