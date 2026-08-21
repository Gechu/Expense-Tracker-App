import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/theme.css'
import App from './App.tsx'
import { applyTheme, getInitialTheme } from './styles/theme'

// Ustawiane przed pierwszym renderem, żeby uniknąć błysku złego motywu
applyTheme(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
