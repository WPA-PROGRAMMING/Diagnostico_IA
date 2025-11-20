import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Search, Calendar, User, FileText, Activity } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
// Importamos el nuevo componente Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog"

export function HistorySection({ history }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null) // Estado para el paciente seleccionado

  const filteredHistory = history.filter(
    (record) => 
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.nss.includes(searchTerm)
  )

  return (
    <>
      {/* --- TABLA PRINCIPAL --- */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Historial de Pacientes</CardTitle>
              <CardDescription>Haz clic en un paciente para ver detalles.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o NSS..." 
                className="pl-8" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead className="text-right">Confianza</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((record) => (
                    <TableRow 
                      key={record.id} 
                      // --- AQUÍ LA INTERACTIVIDAD ---
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        {record.patientName} 
                        <div className="text-xs text-muted-foreground">{record.nss}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          record.diagnosis.includes('Normal') 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                        }`}>
                          {record.diagnosis}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{record.confidence}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- MODAL DE DETALLES (Se abre al hacer click) --- */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        {selectedRecord && (
          <DialogContent className="sm:max-w-[600px]" onOpenChange={setSelectedRecord}>
            <DialogHeader>
              <DialogTitle>Detalles del Análisis</DialogTitle>
              <DialogDescription>
                Reporte completo generado por IA.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* 1. Datos del Paciente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="mr-2 h-4 w-4" /> Paciente
                  </div>
                  <p className="font-medium">{selectedRecord.patientName}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="mr-2 h-4 w-4" /> NSS
                  </div>
                  <p className="font-medium">{selectedRecord.nss}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" /> Fecha
                  </div>
                  <p className="font-medium">{new Date(selectedRecord.date).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Activity className="mr-2 h-4 w-4" /> Confianza IA
                  </div>
                  <p className="font-medium">{selectedRecord.confidence}%</p>
                </div>
              </div>

              {/* 2. Diagnóstico Destacado */}
              <div className={`p-4 rounded-lg border text-center ${
                  selectedRecord.diagnosis.includes('Normal') 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300' 
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900 dark:text-red-300'
                }`}>
                  <h3 className="text-lg font-bold uppercase tracking-wide">
                    {selectedRecord.diagnosis}
                  </h3>
              </div>

              {/* 3. Imagen Grande */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium leading-none text-muted-foreground">Radiografía Analizada</h4>
                <div className="rounded-lg overflow-hidden border bg-black/5">
                   <img 
                      src={selectedRecord.imageUrl} 
                      alt="Radiografía del paciente" 
                      className="w-full h-auto max-h-[300px] object-contain"
                   />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedRecord(null)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}