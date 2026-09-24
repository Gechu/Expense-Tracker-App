import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'
const listeners = new Set<() => void>()

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

let currentTheme = getInitialTheme()

export function applyTheme(theme: Theme) {
  currentTheme = theme
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
  listeners.forEach((listener) => listener())
}

/** Motyw czytany przez wiele niezależnych komponentów naraz (ThemeToggle w
   sidebarze, wiersz w Ustawieniach) - useSyncExternalStore, żeby wszystkie
   od razu zgadzały się po zmianie w dowolnym z nich, bez osobnego stanu
   per-komponent (który by się rozjeżdżał). */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => currentTheme,
  )
  return [theme, applyTheme]
}
