import express from "express"
import { getAllBook, createBook, updateBook, deleteBook } from "../controller/bookController"
import { verifyCreateBook, verifyEditBook } from "../middlewares/bookValidation"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get(`/`, getAllBook)
app.post(`/create`,verifyCreateBook, createBook)
app.put(`/:id`,verifyEditBook, updateBook)
app.delete(`/:id`, deleteBook)

export default app