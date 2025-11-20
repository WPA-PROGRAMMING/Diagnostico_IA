import { useState, useEffect } from "react"
import { LoginForm } from "./components/LoginForm"
import { Dashboard } from "./components/Dashboard"

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) setToken(storedToken)
    setIsLoading(false)
  }, [])

  const handleLogin = (newToken) => {
    setToken(newToken)
    localStorage.setItem("token", newToken)
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem("token")
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando...</div>

  if (!token) return <LoginForm onLogin={handleLogin} />

  return <Dashboard onLogout={handleLogout} token={token} />
}

export default App