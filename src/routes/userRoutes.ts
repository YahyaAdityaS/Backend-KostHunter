// routes/userRoutes.ts
import express from 'express';
import { Router } from 'express';
import multer from 'multer';
import { authentication, createUser, deleteUser, getAllUser, updateUser } from "../controller/userController";
import { verifyAuthentication, verifyAddUser, verifyEditUser, parseForm } from "../middlewares/userValidation";
import { verifyToken, verifyRole } from "../middlewares/authorization";

const app = express();
const router = express.Router();
const upload = multer();


app.get(`/`, getAllUser);
app.post(`/create`, [verifyAddUser, parseForm] ,createUser);
app.put(`/:id`, [verifyEditUser, parseForm], updateUser);
app.delete(`/:id`,deleteUser);
app.post(`/login`, [verifyAuthentication, parseForm], authentication);

export default app;