'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText,
  Bug,
  Zap
} from 'lucide-react'

interface JiraTask {
  tipo: string
  clave: string
  resumen: string
  estimacion: number
  tiempoTrabajado: number
  isBug: boolean
}

interface CalculatedMetrics {
  totalTasks: number
  bugTasks: number
  totalTimeMinutes: number
  bugTimeMinutes: number
  noBugTimeMinutes: number
  retrabajoPercentage: number
  productividadHoras: number
  eficienciaPercentage: number
  velocidadTareasHora: number
}

const JIRA_CSV_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Jira%20Exportar%20Excel%20CSV%20%28mi%20configuraci%C3%B3n%20predeterminada%29%2020250619164532-4KJt8AHkgsmaoTDp8dml1z0tlPCRFA.csv"

export default function JiraAnalytics() {
  const [jiraData, setJiraData] = useState<JiraTask[]>([])
  const [metrics, setMetrics] = useState<CalculatedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para parsear CSV correctamente
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/"/g, ''))
        current = ""
      } else {
        current += char
      }
    }
    result.push(current.trim().replace(/"/g, ''))
    return result
  }

  // Función para cargar y procesar datos de Jira
  const loadJiraData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(JIRA_CSV_URL)
      if (!response.ok) {
        throw new Error(`Error al cargar CSV: ${response.status}`)
      }

      const csvText = await response.text()
      const lines = csvText.split('\n')
      
      if (lines.length < 2) {
        throw new Error('El archivo CSV está vacío o no tiene datos')
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      console.log('Headers encontrados:', headers)

      const tasks: JiraTask[] = []

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = parseCSVLine(lines[i])
        if (values.length < 16) continue

        const taskType = values[0] || ''
        const taskKey = values[1] || ''
        const summary = values[3] || ''
        const estimacionStr = values[14] || '0'
        const timeWorkedStr = values[15] || '0'

        if (!taskKey) continue

        const timeWorkedSeconds = parseInt(timeWorkedStr) || 0
        const timeWorkedMinutes = Math.round(timeWorkedSeconds / 60)
        const estimacionSeconds = parseInt(estimacionStr) || 0
        const estimacionMinutes = Math.round(estimacionSeconds / 60)

        const isBug = taskType.toLowerCase().includes('bug') ||
                     taskType.toLowerCase().includes('error') ||
                     taskType.toLowerCase().includes('defecto')

        tasks.push({
          tipo: taskType,
          clave: taskKey,
          resumen: summary,
          estimacion: estimacionMinutes,
          tiempoTrabajado: timeWorkedMinutes,
          isBug: isBug
        })
      }

      console.log(`Procesadas ${tasks.length} tareas`)
      setJiraData(tasks)
      calculateMetrics(tasks)

    } catch (err) {
      console.error('Error cargando datos de Jira:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Función para calcular métricas
  const calculateMetrics = (tasks: JiraTask[]) => {
    const totalTasks = tasks.length
    const bugTasks = tasks.filter(task => task.isBug).length
    const totalTimeMinutes = tasks.reduce((sum, task) => sum + task.tiempoTrabajado, 0)
    const bugTimeMinutes = tasks.filter(task => task.isBug).reduce((sum, task) => sum + task.tiempoTrabajado, 0)
    const noBugTimeMinutes = totalTimeMinutes - bugTimeMinutes

    // Cálculo de retrabajo: tiempo de bugs vs tiempo de desarrollo normal
    const retrabajoPercentage = noBugTimeMinutes > 0 ? (bugTimeMinutes / noBugTimeMinutes) * 100 : 0

    // Productividad: horas totales trabajadas
    const productividadHoras = totalTimeMinutes / 60

    // Eficiencia: tiempo trabajado vs tiempo estimado
    const totalEstimacionMinutes = tasks.reduce((sum, task) => sum + task.estimacion, 0)
    const eficienciaPercentage = totalEstimacionMinutes > 0 ? (totalTimeMinutes / totalEstimacionMinutes) * 100 : 0

    // Velocidad: tareas por hora
    const velocidadTareasHora = productividadHoras > 0 ? totalTasks / productividadHoras : 0

    const calculatedMetrics: CalculatedMetrics = {
      totalTasks,
      bugTasks,
      totalTimeMinutes,
      bugTimeMinutes,
      noBugTimeMinutes,
      retrabajoPercentage,
      productividadHoras,
      eficienciaPercentage,
      velocidadTareasHora
    }

    console.log('Métricas calculadas:', calculatedMetrics)
    setMetrics(calculatedMetrics)
  }

  useEffect(() => {
    loadJiraData()
  }, [])

  // Datos para gráficos
  const chartData = metrics ? [
    {
      name: 'Desarrollo',
      tiempo: Math.round(metrics.noBugTimeMinutes / 60 * 10) / 10,
      tareas: metrics.totalTasks - metrics.bugTasks,
      color: '#8884d8'
    },
    {
      name: 'Bugs/Retrabajo',
      tiempo: Math.round(metrics.bugTimeMinutes / 60 * 10) / 10,
      tareas: metrics.bugTasks,
      color: '#ff6b6b'
    }
  ] : []

  const pieData = metrics ? [
    { name: 'Desarrollo Normal', value: metrics.noBugTimeMinutes, color: '#8884d8' },
    { name: 'Retrabajo (Bugs)', value: metrics.bugTimeMinutes, color: '#ff6b6b' }
  ] : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg text-gray-600">Cargando datos de Jira...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar los datos: {error}
            </AlertDescription>
          </Alert>
          <Button onClick={loadJiraData} className="mb-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">No se pudieron calcular las métricas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dashboard de Productividad Jira
          </h1>
          <p className="text-lg text-gray-600">
            Análisis en tiempo real de {metrics.totalTasks} tareas procesadas
          </p>
          <Button 
            onClick={loadJiraData} 
            variant="outline" 
            size="sm" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Datos
          </Button>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retrabajo</CardTitle>
              <Bug className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.retrabajoPercentage.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.bugTimeMinutes} min de {metrics.totalTimeMinutes} min totales
              </p>
              <Progress 
                value={metrics.retrabajoPercentage} 
                className="mt-2" 
                max={100}
              />
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productividad</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.productividadHoras.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">
                Tiempo total trabajado
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Activo</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.eficienciaPercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Tiempo real vs estimado
              </p>
              <Progress 
                value={Math.min(metrics.eficienciaPercentage, 100)} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Velocidad</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.velocidadTareasHora.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tareas por hora
              </p>
              <div className="flex items-center mt-2">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Óptimo</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información detallada */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumen de Tareas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de tareas</span>
                <Badge variant="secondary">{metrics.totalTasks}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tareas de desarrollo</span>
                <Badge variant="default">{metrics.totalTasks - metrics.bugTasks}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bugs/Retrabajo</span>
                <Badge variant="destructive">{metrics.bugTasks}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tiempo total</span>
                <Badge variant="outline">{Math.round(metrics.totalTimeMinutes / 60 * 10) / 10}h</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Distribución de Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${Math.round(value / 60 * 10) / 10}h`, 'Tiempo']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Comparación Desarrollo vs Retrabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'tiempo' ? `${value}h` : `${value} tareas`,
                      name === 'tiempo' ? 'Tiempo' : 'Tareas'
                    ]}
                  />
                  <Bar dataKey="tiempo" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detalles de cálculo */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Detalles de Cálculo</CardTitle>
            <CardDescription>
              Fórmulas y datos utilizados para el cálculo de métricas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Retrabajo</h4>
                <p className="text-sm text-gray-600">
                  Fórmula: (Tiempo Bugs / Tiempo Desarrollo) × 100
                </p>
                <p className="text-sm text-gray-600">
                  Cálculo: ({metrics.bugTimeMinutes} / {metrics.noBugTimeMinutes}) × 100 = {metrics.retrabajoPercentage.toFixed(2)}%
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Eficiencia</h4>
                <p className="text-sm text-gray-600">
                  Fórmula: (Tiempo Real / Tiempo Estimado) × 100
                </p>
                <p className="text-sm text-gray-600">
                  {metrics.eficienciaPercentage.toFixed(1)}% de eficiencia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}