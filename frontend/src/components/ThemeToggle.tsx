import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyTheme, getInitialTheme, type Theme } from '../styles/theme'

interface ThemeToggleProps {
  /** "fixed" - pływający przycisk w rogu ekranu (ekran logowania).
      "inline" - osadzony w normalnym przepływie (np. obok logo w sidebarze). */
  variant?: 'fixed' | 'inline'
}

export default function ThemeToggle({ variant = 'fixed' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <button
      type="button"
      className={variant === 'inline' ? 'theme-toggle theme-toggle--inline' : 'theme-toggle'}
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      aria-label="Przełącz motyw jasny/ciemny"
      title="Przełącz motyw"
    >
      {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}
