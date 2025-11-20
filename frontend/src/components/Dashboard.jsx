import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Activity, History, LogOut, Upload, Sun, Moon, Laptop } from "lucide-react"
import { ScanSection } from "./ScanSection"
import { HistorySection } from "./HistorySection"
import { useTheme } from "./ThemeProvider" // <--- Importante para el modo oscuro

export function Dashboard({ onLogout, token }) {
  const [history, setHistory] = useState([])
  const { theme, setTheme } = useTheme()  // <--- Agregamos 'theme' aquí
  // --- 1. CARGAR HISTORIAL AL INICIAR ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return

      try {
        // Petición al Backend
        const response = await axios.get('http://127.0.0.1:8000/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        // Transformamos los datos (Backend Python -> Frontend React)
        const mappedData = response.data.map((item) => ({
          id: item.id,
          patientName: item.patient_name || "Sin nombre", // Fallback
          nss: item.nss || "N/A",
          diagnosis: item.prediction,
          // Convertimos "98.5%" a número flotante 98.5
          confidence: parseFloat(item.confidence.replace('%', '')),
          date: item.timestamp,
          // Construimos la URL de la imagen
          imageUrl: `http://127.0.0.1:8000/static/${item.filename}`
        }))

        // Guardamos invirtiendo el orden (el más nuevo primero)
        setHistory(mappedData.reverse())
      } catch (error) {
        console.error("Error cargando historial:", error)
      }
    }

    fetchHistory()
  }, [token])

  // --- 2. ACTUALIZAR AL ESCANEAR ---
  const handleNewScan = (record) => {
    // Agregamos el nuevo registro al principio de la lista
    setHistory([record, ...history])
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="container mx-auto flex h-16 items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Activity className="h-6 w-6" />
            <span>MediScan AI</span>
          </div>

          {/* Controles Derecha */}
          <div className="flex items-center gap-4">

            {/* Botones de Tema */}
            <div className="flex items-center border rounded-md p-1 bg-muted/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Cambiar tema"
              >
                {/* Si theme es 'dark', muestra el Sol. Si no, la Luna */}
                {theme === "dark" ? (
                  <Sun className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                )}
              </Button>
            </div>

            {/* Botón Logout */}
            <Button variant="destructive" size="sm" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="container mx-auto py-8 px-4">
        <Tabs defaultValue="scan" className="space-y-6">

          {/* Navegación de Pestañas */}
          <div className="flex justify-center md:justify-start">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="scan" className="gap-2">
                <Upload className="h-4 w-4" /> Escanear
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" /> Historial
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Pestaña 1: Escáner */}
          <TabsContent value="scan" className="animate-in fade-in-50 duration-500">
            <ScanSection token={token} onScanComplete={handleNewScan} />
          </TabsContent>

          {/* Pestaña 2: Historial */}
          <TabsContent value="history" className="animate-in fade-in-50 duration-500">
            <HistorySection history={history} />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}