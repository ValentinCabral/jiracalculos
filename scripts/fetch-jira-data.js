// Fetch and analyze the actual Jira CSV data
const response = await fetch(
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Jira%20Exportar%20Excel%20CSV%20%28campos%20filtrados%29%2020250619160152-pL3uQLvqJ1yEeEe4JV7xk4TuqJmR6r.csv",
)
const csvText = await response.text()

console.log("=== JIRA CSV DATA ANALYSIS ===")
console.log("First 500 characters:")
console.log(csvText.substring(0, 500))

// Parse CSV
const lines = csvText.split("\n")
const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

console.log("\n=== HEADERS ===")
headers.forEach((header, index) => {
  console.log(`${index}: "${header}"`)
})

console.log("\n=== SAMPLE DATA (First 3 rows) ===")
for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
  if (lines[i].trim()) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    console.log(`\nRow ${i}:`)
    headers.forEach((header, index) => {
      console.log(`  ${header}: "${values[index] || ""}"`)
    })
  }
}

console.log(`\n=== SUMMARY ===`)
console.log(`Total rows: ${lines.length - 1}`)
console.log(`Headers count: ${headers.length}`)
