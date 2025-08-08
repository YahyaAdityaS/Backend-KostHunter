import { Role } from "@prisma/client";
import { Request } from "express";

export interface CustomRequest extends Request {
    user?: {
        id?: number,
        role?: Role
    }
}