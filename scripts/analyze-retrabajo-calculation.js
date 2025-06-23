// Fetch and analyze the new Jira CSV data to understand the retrabajo calculation
const response = await fetch(
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Jira%20Exportar%20Excel%20CSV%20%28mi%20configuraci%C3%B3n%20predeterminada%29%2020250619164532-4KJt8AHkgsmaoTDp8dml1z0tlPCRFA.csv",
)
const csvText = await response.text()

console.log("=== ANÁLISIS DETALLADO PARA CÁLCULO DE RETRABAJO ===")

// Parse CSV
const lines = csvText.split("\n")
const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

console.log("Headers encontrados:")
headers.forEach((header, index) => {
  console.log(`${index}: "${header}"`)
})

// Función para parsear CSV correctamente
function parseCSVLine(line) {
  const result = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/"/g, ""))
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim().replace(/"/g, ""))
  return result
}

// Analizar todas las tareas
console.log("\n=== ANÁLISIS DE TODAS LAS TAREAS ===")
let totalTasks = 0
let bugTasks = 0
let totalBugTimeMinutes = 0
let totalAllTimeMinutes = 0
let totalNonBugTimeMinutes = 0

const taskDetails = []

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue

  const values = parseCSVLine(lines[i])
  if (values.length < 16) continue

  const taskType = values[0] || ""
  const taskKey = values[1] || ""
  const summary = values[3] || ""
  const timeWorkedStr = values[15] || "0"
  const timeWorkedSeconds = Number.parseInt(timeWorkedStr) || 0
  const timeWorkedMinutes = Math.round(timeWorkedSeconds / 60)

  totalTasks++
  totalAllTimeMinutes += timeWorkedMinutes

  const isBug =
    taskType.toLowerCase().includes("bug") ||
    taskType.toLowerCase().includes("error") ||
    taskType.toLowerCase().includes("defecto")

  if (isBug) {
    bugTasks++
    totalBugTimeMinutes += timeWorkedMinutes
    console.log(`BUG ENCONTRADO: ${taskKey} - ${taskType} - ${timeWorkedMinutes} min (${timeWorkedSeconds} seg)`)
  } else {
    totalNonBugTimeMinutes += timeWorkedMinutes
  }

  taskDetails.push({
    key: taskKey,
    type: taskType,
    summary: summary.substring(0, 50),
    timeMinutes: timeWorkedMinutes,
    isBug: isBug,
  })
}

console.log("\n=== RESUMEN DE CÁLCULOS ===")
console.log(`Total de tareas: ${totalTasks}`)
console.log(`Tareas Bug: ${bugTasks}`)
console.log(`Tareas No-Bug: ${totalTasks - bugTasks}`)
console.log(`Tiempo total Bug: ${totalBugTimeMinutes} minutos`)
console.log(`Tiempo total No-Bug: ${totalNonBugTimeMinutes} minutos`)
console.log(`Tiempo total general: ${totalAllTimeMinutes} minutos`)

console.log("\n=== CÁLCULOS DE RETRABAJO ===")
console.log(`Según tu ejemplo esperado: (85 / 12625) * 100 = 6.73%`)
console.log(`Mis cálculos actuales:`)
console.log(`- Tiempo Bug: ${totalBugTimeMinutes} min`)
console.log(`- Tiempo Total: ${totalAllTimeMinutes} min`)
console.log(
  `- Porcentaje: (${totalBugTimeMinutes} / ${totalAllTimeMinutes}) * 100 = ${((totalBugTimeMinutes / totalAllTimeMinutes) * 100).toFixed(2)}%`,
)

console.log(`\nPosibles interpretaciones:`)
console.log(
  `1. Bug vs Total: (${totalBugTimeMinutes} / ${totalAllTimeMinutes}) * 100 = ${((totalBugTimeMinutes / totalAllTimeMinutes) * 100).toFixed(2)}%`,
)
console.log(
  `2. Bug vs No-Bug: (${totalBugTimeMinutes} / ${totalNonBugTimeMinutes}) * 100 = ${((totalBugTimeMinutes / totalNonBugTimeMinutes) * 100).toFixed(2)}%`,
)

// Verificar si hay exactamente 85 minutos de bugs
console.log(`\n=== VERIFICACIÓN DE 85 MINUTOS ===`)
if (totalBugTimeMinutes === 85) {
  console.log("✅ Coincide exactamente con los 85 minutos esperados")
} else {
  console.log(`❌ No coincide. Esperado: 85, Actual: ${totalBugTimeMinutes}`)
  console.log("Revisando tareas Bug individualmente:")
  taskDetails
    .filter((t) => t.isBug)
    .forEach((task) => {
      console.log(`  - ${task.key}: ${task.timeMinutes} min`)
    })
}

// Verificar si hay exactamente 12625 minutos totales
console.log(`\n=== VERIFICACIÓN DE 12625 MINUTOS TOTALES ===`)
if (totalAllTimeMinutes === 12625) {
  console.log("✅ Coincide exactamente con los 12625 minutos esperados")
} else if (totalNonBugTimeMinutes === 12625) {
  console.log("✅ Los 12625 minutos corresponden al tiempo NO-Bug")
  console.log(
    `Cálculo correcto sería: (${totalBugTimeMinutes} / ${totalNonBugTimeMinutes}) * 100 = ${((totalBugTimeMinutes / totalNonBugTimeMinutes) * 100).toFixed(2)}%`,
  )
} else {
  console.log(`❌ No coincide. Total: ${totalAllTimeMinutes}, No-Bug: ${totalNonBugTimeMinutes}`)
}

console.log("\n=== TODAS LAS TAREAS (primeras 10) ===")
taskDetails.slice(0, 10).forEach((task, index) => {
  console.log(`${index + 1}. ${task.key} (${task.type}) - ${task.timeMinutes} min - ${task.isBug ? "BUG" : "NORMAL"}`)
})
