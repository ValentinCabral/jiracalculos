// Fetch and analyze the new Jira CSV data
const response = await fetch(
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Jira%20Exportar%20Excel%20CSV%20%28mi%20configuraci%C3%B3n%20predeterminada%29%2020250619164532-bc3G7ZFZTE63LzfQP4Kd8gjmgKhXwp.csv",
)
const csvText = await response.text()

console.log("=== NUEVO JIRA CSV DATA ANALYSIS ===")
console.log("First 500 characters:")
console.log(csvText.substring(0, 500))

// Parse CSV
const lines = csvText.split("\n")
const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

console.log("\n=== HEADERS ===")
headers.forEach((header, index) => {
  console.log(`${index}: "${header}"`)
})

console.log("\n=== SAMPLE DATA (First 5 rows) ===")
for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
  if (lines[i].trim()) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    console.log(`\nRow ${i}:`)
    console.log(`  Tipo: "${values[0] || ""}"`)
    console.log(`  Clave: "${values[1] || ""}"`)
    console.log(`  Resumen: "${values[3] || ""}"`)
    console.log(`  Estimación: "${values[14] || ""}"`)
    console.log(`  Tiempo Trabajado: "${values[15] || ""}"`)
  }
}

// Analyze task types
console.log("\n=== TASK TYPES ANALYSIS ===")
const taskTypes = new Set()
for (let i = 1; i < lines.length; i++) {
  if (lines[i].trim()) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    if (values[0]) {
      taskTypes.add(values[0])
    }
  }
}

console.log("Unique task types found:")
Array.from(taskTypes).forEach((type) => {
  console.log(`- "${type}"`)
})

// Look for Bug tasks specifically
console.log("\n=== BUG TASKS ANALYSIS ===")
let bugTasks = 0
let bugTimeTotal = 0

for (let i = 1; i < lines.length; i++) {
  if (lines[i].trim()) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    const taskType = values[0] || ""
    const timeWorked = Number.parseInt(values[15] || "0")

    if (
      taskType.toLowerCase().includes("bug") ||
      taskType.toLowerCase().includes("error") ||
      taskType.toLowerCase().includes("defecto")
    ) {
      bugTasks++
      bugTimeTotal += timeWorked
      console.log(`Bug task found: ${values[1]} - ${taskType} - ${timeWorked} seconds`)
    }
  }
}

console.log(`\nTotal Bug tasks: ${bugTasks}`)
console.log(`Total Bug time: ${bugTimeTotal} seconds (${(bugTimeTotal / 3600).toFixed(2)} hours)`)
console.log(`Bug time in minutes: ${(bugTimeTotal / 60).toFixed(0)} minutes`)

console.log(`\n=== SUMMARY ===`)
console.log(`Total rows: ${lines.length - 1}`)
console.log(`Headers count: ${headers.length}`)
console.log(`Task types: ${taskTypes.size}`)
