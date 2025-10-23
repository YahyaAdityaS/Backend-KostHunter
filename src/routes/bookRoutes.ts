import express from "express"
import { getAllBook, getBookHistory, createBook, updateBook, deleteBook, getBookReceipt } from "../controller/bookController"
import { verifyCreateBook, verifyEditBook } from "../middlewares/bookValidation"
import { verifyToken, verifyRole } from "../middlewares/authorization"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get(`/`, getAllBook)
app.get(`/history`, [verifyToken, verifyRole(["society"])], getBookHistory)
app.get("/receipt/pdf/:id", [verifyToken, verifyRole(["society"])], getBookReceipt);
app.post(`/create`, [verifyToken, verifyRole(["society"]), ...verifyCreateBook], createBook)
app.put(`/:id`, [verifyToken, verifyRole(["society", "owner"]), ...verifyEditBook], updateBook)
app.delete(`/:id`, verifyToken,deleteBook)

export default app