import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import multer from 'multer'

/** parser untuk form-data (tanpa upload file) */
const upload = multer()

/** schema validasi untuk Book */
const addDataSchema = Joi.object({
    kosId: Joi.number().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
    status: Joi.string().valid("pending", "accept", "reject").optional() // default pending
}). unknown(true)

const editDataSchema = Joi.object({
    kosId: Joi.number().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    status: Joi.string().valid("pending", "accept", "reject").optional() // default pending
}). unknown(true)

export const verifyCreateBook = [
    upload.none(), // supaya form-data bisa diparse
    (request: Request, response: Response, next: NextFunction) => {
        const { error } = addDataSchema.validate(request.body, { abortEarly: false })

        if (error) {
            return response.status(400).json({
                status: false,
                message: error.details.map(it => it.message).join(", ")
            })
        }
        return next()
    }
]

export const verifyEditBook = [
    upload.none(),
    (request: Request, response: Response, next: NextFunction) => {
        const { error } = editDataSchema.validate(request.body, { abortEarly: false });
        if (error) {
            return response.status(400).json({
                status: false,
                message: error.details.map(it => it.message).join(", ")
            });
        }
        return next();
    }
];
