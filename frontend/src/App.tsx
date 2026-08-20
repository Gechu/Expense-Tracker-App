import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppPage from './pages/AppPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<AppPage />} />
    </Routes>
  )
}

export default App
