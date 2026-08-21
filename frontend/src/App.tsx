import { Navigate, Route, Routes } from 'react-router-dom'
import AppPage from './pages/AppPage'
import AuthPage from './pages/AuthPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/app" element={<AppPage />} />
    </Routes>
  )
}

export default App
