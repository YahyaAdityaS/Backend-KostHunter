import express from "express"
import { getAllKos, createKos, updateKos, deleteKos } from "../controller/kosController"
import { verifyAddKos, verifyEditKos } from "../middlewares/verifyKos"
import uploadFile from "../middlewares/kosUpload"
import { verifyRole, verifyToken } from "../middlewares/authorization"

const app = express()
app.use(express.json())

app.get(`/`, getAllKos)
app.post(`/create`, [verifyToken, verifyRole(["owner"]), uploadFile.single("picture"), verifyAddKos], createKos)
app.put(`/:id`, [verifyToken, verifyRole(["owner"]), uploadFile.single("picture"), verifyEditKos], updateKos)
app.delete(`/:id`, [verifyToken, verifyRole(["owner"])], deleteKos)

export default app