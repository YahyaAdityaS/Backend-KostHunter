import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { SECRET } from "../global";
import { Interface } from "readline";
import { decode } from "punycode";
import jwt from 'jsonwebtoken';
import multer from "multer"; // ⬅️ Tambahkan ini
import { CustomRequest } from "../types";
import { Role } from "@prisma/client";

const upload = multer(); // ⬅️ Konfigurasi multer

export const parseForm = upload.none();

interface JwtPayload{
    id: number,
    role: Role
}

export const verifyToken = (req:CustomRequest, res:Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(400).json({message: 'Access Denied. No token provided '});
    }
    try {
        const secretKey = SECRET || ""
        const decoded = verify(token, secretKey);
        req.user = decoded as JwtPayload;
        next();
    }
    catch (error) {
        console.log(error);
        return res.status(401).json({message: 'Invalid token. '})
    }
};

export const verifyRole = (allowedRoles : Role[]) => {
    return (req: CustomRequest, res:Response, next: NextFunction) => {
        const user = req.user;
        if (!user) {
            return res.status(403).json({message: 'No user information avilable. '});
        }
        if (!allowedRoles.includes(user.role!)){
            return res.status(403)
            .json({
                message: `Acces denied. Requires one of the following rules: ${allowedRoles.join(',')}`
            });
        }
        next();
    }
}