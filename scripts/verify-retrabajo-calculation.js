// Verificar el cálculo de retrabajo paso a paso
const response = await fetch(
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Jira%20Exportar%20Excel%20CSV%20%28mi%20configuraci%C3%B3n%20predeterminada%29%2020250619164532-4KJt8AHkgsmaoTDp8dml1z0tlPCRFA.csv",
)
const csvText = await response.text()

console.log("=== VERIFICACIÓN DETALLADA DEL CÁLCULO DE RETRABAJO ===")

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

// Parse CSV
const lines = csvText.split("\n")
const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

console.log("Headers encontrados:")
headers.forEach((header, index) => {
  console.log(`${index}: "${header}"`)
})

// Analizar todas las tareas
let totalTasks = 0
let bugTasks = 0
let noBugTasks = 0
let totalBugTimeMinutes = 0
let totalNoBugTimeMinutes = 0
let totalAllTimeMinutes = 0

const bugTaskDetails = []
const noBugTaskDetails = []

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

  if (!taskKey) continue

  totalTasks++
  totalAllTimeMinutes += timeWorkedMinutes

  const isBug =
    taskType.toLowerCase().includes("bug") ||
    taskType.toLowerCase().includes("error") ||
    taskType.toLowerCase().includes("defecto")

  if (isBug) {
    bugTasks++
    totalBugTimeMinutes += timeWorkedMinutes
    bugTaskDetails.push({
      key: taskKey,
      type: taskType,
      summary: summary.substring(0, 50),
      timeMinutes: timeWorkedMinutes,
    })
  } else {
    noBugTasks++
    totalNoBugTimeMinutes += timeWorkedMinutes
    noBugTaskDetails.push({
      key: taskKey,
      type: taskType,
      summary: summary.substring(0, 50),
      timeMinutes: timeWorkedMinutes,
    })
  }
}

console.log("\n=== RESUMEN DE CÁLCULOS ===")
console.log(`Total de tareas: ${totalTasks}`)
console.log(`Tareas Bug: ${bugTasks}`)
console.log(`Tareas No-Bug: ${noBugTasks}`)
console.log(`Tiempo total Bug: ${totalBugTimeMinutes} minutos`)
console.log(`Tiempo total No-Bug: ${totalNoBugTimeMinutes} minutos`)
console.log(`Tiempo total general: ${totalAllTimeMinutes} minutos`)

console.log("\n=== VERIFICACIÓN MATEMÁTICA ===")
console.log(
  `Bug + No-Bug = ${totalBugTimeMinutes} + ${totalNoBugTimeMinutes} = ${totalBugTimeMinutes + totalNoBugTimeMinutes}`,
)
console.log(`Total general = ${totalAllTimeMinutes}`)
console.log(`¿Coinciden? ${totalBugTimeMinutes + totalNoBugTimeMinutes === totalAllTimeMinutes ? "✅ SÍ" : "❌ NO"}`)

console.log("\n=== CÁLCULO DE RETRABAJO ===")
const porcentajeRetrabajo = totalNoBugTimeMinutes > 0 ? (totalBugTimeMinutes / totalNoBugTimeMinutes) * 100 : 0
console.log(`Fórmula: (${totalBugTimeMinutes} / ${totalNoBugTimeMinutes}) * 100 = ${porcentajeRetrabajo.toFixed(2)}%`)

console.log("\n=== COMPARACIÓN CON EJEMPLO ESPERADO ===")
console.log(`Esperado: (85 / 12625) * 100 = 6.73%`)
console.log(`Actual: (${totalBugTimeMinutes} / ${totalNoBugTimeMinutes}) * 100 = ${porcentajeRetrabajo.toFixed(2)}%`)

if (totalBugTimeMinutes === 85) {
  console.log("✅ Tiempo Bug coincide con el esperado")
} else {
  console.log(`❌ Tiempo Bug no coincide. Esperado: 85, Actual: ${totalBugTimeMinutes}`)
}

if (totalNoBugTimeMinutes === 12625) {
  console.log("✅ Tiempo No-Bug coincide con el esperado")
} else {
  console.log(`❌ Tiempo No-Bug no coincide. Esperado: 12625, Actual: ${totalNoBugTimeMinutes}`)
}

console.log("\n=== DETALLES DE TAREAS BUG ===")
bugTaskDetails.forEach((task, index) => {
  console.log(`${index + 1}. ${task.key} (${task.type}) - ${task.timeMinutes} min - "${task.summary}"`)
})

console.log(`\nTotal minutos Bug: ${bugTaskDetails.reduce((sum, task) => sum + task.timeMinutes, 0)}`)

console.log("\n=== PRIMERAS 10 TAREAS NO-BUG ===")
noBugTaskDetails.slice(0, 10).forEach((task, index) => {
  console.log(`${index + 1}. ${task.key} (${task.type}) - ${task.timeMinutes} min - "${task.summary}"`)
})

console.log(`\nTotal minutos No-Bug: ${noBugTaskDetails.reduce((sum, task) => sum + task.timeMinutes, 0)}`)

// Verificar si hay tareas con tiempo 0
const tareasConTiempoCero = noBugTaskDetails.filter((task) => task.timeMinutes === 0)
console.log(`\n=== TAREAS NO-BUG CON TIEMPO 0 ===`)
console.log(`Cantidad: ${tareasConTiempoCero.length}`)
if (tareasConTiempoCero.length > 0) {
  tareasConTiempoCero.slice(0, 5).forEach((task, index) => {
    console.log(`${index + 1}. ${task.key} (${task.type}) - "${task.summary}"`)
  })
}
