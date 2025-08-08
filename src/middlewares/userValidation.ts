import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { request } from "http";
import Joi from "joi";
import multer from "multer"; // ⬅️ Tambahkan ini

const upload = multer(); // ⬅️ Konfigurasi multer

export const parseForm = upload.none(); // ⬅️ Middleware untuk form-data tanpa file

const authSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).alphanum().required(),
});

const addDataSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required(),
    phone: Joi.string().required(),
    role: Joi.allow().required() //optional (Bisa diisi bisa tidak)
}).unknown(true)

const editDataSchema = Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(3).optional(),
    phone: Joi.string().optional(),
    role: Joi.allow().optional() //optional (Bisa diisi bisa tidak)
}).unknown(true)

export const verifyAuthentication = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const {error} = authSchema.validate(request.body, {abortEarly: false});
    if(error) {
        return response.status(400).json({
            status: false,
            message: error.details.map((it) => it.message).join(),
        })
    }
    return next();  
}

export const verifyAddUser = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    //beh
    const {error} = addDataSchema.validate(request.body, {abortEarly: false});
    if(error) {
        return response.status(400).json({
            status: false,
            message: error.details.map((it) => it.message).join(),
        })
    }
    return next();
}
export const verifyEditUser = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    //beh
    const {error} = editDataSchema.validate(request.body, {abortEarly: false});
    if(error) {
        return response.status(400).json({
            status: false,
            message: error.details.map((it) => it.message).join(),
        })
    }
    return next();
}