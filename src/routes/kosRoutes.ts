import express from "express"
import { getAllKos, createKos, updateKos, deleteKos, getAvailableKos, getGenderKos } from "../controller/kosController"
import { verifyAddKos, verifyEditKos, parseForm } from "../middlewares/verifyKos"
import { verifyRole, verifyToken } from "../middlewares/authorization"

const app = express()
app.use(express.json())

app.get(`/`, getAllKos)
app.get(`/Available`, getAvailableKos)
app.get(`/filter`, getGenderKos)
app.post(`/create`, [verifyToken, parseForm, verifyRole(["owner"]), verifyAddKos, parseForm], createKos)
app.put(`/:id`, [verifyToken, parseForm, verifyRole(["owner"]), verifyEditKos], updateKos)
app.delete(`/:id`, [verifyToken, verifyRole(["owner"])], deleteKos)

export default app