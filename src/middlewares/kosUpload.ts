import { Request } from "express";
import multer from "multer";
import {BASE_URL} from "../global";
import { request } from "http";

const storage = multer.diskStorage({
    destination: (request:Request, file: Express.Multer.File, cb : (eror : Error | null, destination: string) => void) => {
        cb(null, `${BASE_URL}/public/kos_picture`)
    },
    filename: (request: Request, file: Express.Multer.File, cb: (eror:Error | null, destination: string) => void) => {
        cb(null, `${new Date().getTime().toString()}-${file.originalname}`)
    }
})

const uploadFile = multer({
    storage,
    limits: {fileSize: 2 * 1024 * 1024}
})

export default uploadFile