import express from "express"
import { getAllBook, createBook, updateBook, deleteBook } from "../controller/bookController"
import { verifyCreateBook, verifyEditBook } from "../middlewares/bookValidation"
import { verifyToken } from "../middlewares/authorization"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get(`/`, getAllBook)
app.post(`/create`, verifyToken, verifyCreateBook, createBook)
app.put(`/:id`, verifyToken,verifyEditBook, updateBook)
app.delete(`/:id`, verifyToken,deleteBook)

export default app