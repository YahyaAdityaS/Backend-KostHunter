// routes/userRoutes.ts
import express from "express";
import { authentication, createUser, deleteUser, getAllUser, updateUser } from "../controller/userController";
import { verifyAuthentication, verifyAddUser, verifyEditUser, parseForm } from "../middlewares/userValidation";
import { verifyToken } from "../middlewares/authorization";
import multer from "multer";

const upload = multer();
const app = express();

app.get(`/`, getAllUser);
app.post(`/create`, [parseForm,verifyAddUser], createUser);
app.put(`/:id`, [parseForm, verifyToken, verifyEditUser], updateUser);
app.delete(`/:id`, verifyToken, deleteUser);
app.post(`/login`, [parseForm, verifyAuthentication], authentication);

export default app;