import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { it } from "node:test";

const addDataSchema = Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    pricePerMonth: Joi.number().min(0).required(),
    roomTotal: Joi.number().min(0).required(),
    roomAvailable: Joi.number().min(0).required(),
    facility: Joi.string().required(),
    description: Joi.string().required(),
    picture: Joi.allow().optional(), //optional (Bisa diisi bisa tidak)
    gender: Joi.string().valid('male', 'female', 'all').required(), //.valid = validasi jenis kelamin (harus sesuai dengan enum)', 'FOOD', 'SNACK').required(), //.valid = validasi kategori menu (harus sesuai dengan enum)
    userId: Joi.optional()
})

const editDataSchema = Joi.object({
    name: Joi.string().optional(),
    address: Joi.string().optional(),
    pricePerMonth: Joi.number().min(0).optional(),
    roomTotal: Joi.number().min(0).optional(),
    roomAvailable: Joi.number().min(0).optional(),
    facility: Joi.string().optional(),
    description: Joi.string().optional(),
    picture: Joi.allow().optional(), //optional (Bisa diisi bisa tidak)
    gender: Joi.string().valid('male', 'female', 'all').optional(), //.valid = validasi jenis kelamin (harus sesuai dengan enum)', 'FOOD', 'SNACK').required(), //.valid = validasi kategori menu (harus sesuai dengan enum)
    userId: Joi.optional()
})

export const verifyAddKos = (request: Request, response: Response, next: NextFunction) => {
    const { error } = addDataSchema.validate(request.body, {abortEarly: false})

    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join()
        })
    }
    return next()
}

export const verifyEditKos = (request: Request, response: Response, next: NextFunction) => {
    const { error } = editDataSchema.validate(request.body, {abortEarly: false})

    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join()
        })
    }
    return next()
}