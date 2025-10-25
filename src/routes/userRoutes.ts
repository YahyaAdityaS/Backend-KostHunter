// routes/userRoutes.ts
import express from "express";
import { authentication, createUser, deleteUser, getAllUser, updateUser } from "../controller/userController";
import { verifyAuthentication, verifyAddUser, verifyEditUser, parseForm } from "../middlewares/userValidation";
import { verifyToken } from "../middlewares/authorization";

const app = express();

app.get(`/`, getAllUser);
app.post(`/create`, [verifyAddUser, parseForm], createUser);
app.put(`/:id`, [verifyToken, verifyEditUser, parseForm], updateUser);
app.delete(`/:id`, verifyToken, deleteUser);
app.post(`/login`, [verifyAuthentication, parseForm], authentication);

export default app;