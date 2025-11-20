import { useState, useRef } from "react"
import axios from "axios"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Upload, X, CheckCircle, AlertTriangle, FileText, Activity } from "lucide-react"

export function ScanSection({ token, onScanComplete }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [patientName, setPatientName] = useState("")
  const [nss, setNss] = useState("")
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setResult(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file || !patientName || !nss) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('patientName', patientName)
      formData.append('nss', nss)

      const response = await axios.post('http://127.0.0.1:8000/predict', formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      })
      const data = response.data
      const newRecord = {
        id: data.id,
        patientName: data.patient_name,
        nss: data.nss,
        diagnosis: data.prediction,
        confidence: parseFloat(data.confidence.replace('%', '')),
        date: data.timestamp,
        imageUrl: `http://127.0.0.1:8000/static/${data.filename}`,
      }
      setResult(newRecord)
      onScanComplete(newRecord)
    } catch (error) {
      alert("Error en el análisis.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setPatientName("")
    setNss("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos del Paciente</CardTitle>
            <CardDescription>Ingrese la información antes de escanear.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Ej. Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nss">NSS</Label>
              <Input id="nss" value={nss} onChange={e => setNss(e.target.value)} placeholder="Ej. 1234-56-7890" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Radiografía</CardTitle></CardHeader>
          <CardContent>
            {!preview ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm">Click para seleccionar imagen</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={preview} alt="Preview" className="w-full h-64 object-contain bg-black/5" />
                {!loading && !result && <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => { setFile(null); setPreview(null) }}><X className="h-4 w-4" /></Button>}
              </div>
            )}
            <div className="mt-6">
              <Button className="w-full" disabled={!file || !patientName || !nss || loading || !!result} onClick={handleAnalyze}>
                {loading ? "Analizando..." : result ? "Completado" : "Analizar Imagen"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {result ? (
          <Card className="h-full border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5"><CardTitle>Resultados</CardTitle></CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className={`p-6 rounded-xl border-2 text-center ${result.diagnosis.includes("Normal") ? "border-green-500/20 bg-green-500/10 text-green-700" : "border-red-500/20 bg-red-500/10 text-red-700"}`}>
                <h2 className="text-3xl font-bold mb-2">{result.diagnosis}</h2>
                <div className="flex justify-center gap-2 text-sm">
                    {result.diagnosis.includes("Normal") ? <CheckCircle className="h-4 w-4"/> : <AlertTriangle className="h-4 w-4"/>}
                    <span>Confianza: {result.confidence}%</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={resetForm}>Nuevo Análisis</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/10">
            <p>Los resultados aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  )
}