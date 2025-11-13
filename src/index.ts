import app from "./app"
import express from "express" // ← Jika kamu pakai form-urlencoded

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})