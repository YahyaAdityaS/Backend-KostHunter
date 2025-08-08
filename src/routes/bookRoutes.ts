import express from "express"
import { getAllBook, createBook } from "../controller/bookController"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get(`/`, getAllBook)
app.post(`/create`, createBook)

export default app