import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'

const orderListSchema = Joi.object({
    idMenu: Joi.number().required(),
    quantity: Joi.number().required(),
    note: Joi.string().optional(),
})

const addDataSchema = Joi.object({
    customer: Joi.string().required(),
    table_number: Joi.number().min(0).required(),
    payment_method: Joi.string().valid("CASH", "QRIS").uppercase().required(),
    status: Joi.string().valid("NEW", "PAID", "DONE").uppercase().required(),
    idUser: Joi.number().optional(),
    order_list: Joi.array().items(orderListSchema).min(1).required(),
    user: Joi.optional()
})

export const verifyAddOrder = (request: Request, response: Response, next: NextFunction) => {
    /** validate a request body and grab error if exist */
    const { error } = addDataSchema.validate(request.body, { abortEarly: false })


    if (error) {
        /** if there is an error, then give a response like this */
        return response.status(400).json({
            status: false,
            message: error.details.map(it => it.message).join()
        })
    }
    return next()
}

/** create schema when edit status order's data */
const editDataSchema = Joi.object({
    status: Joi.string().valid("NEW", "PAID", "DONE").uppercase().required(),
    user: Joi.optional()
})

export const verifyEditStatus = (request: Request, response: Response, next: NextFunction) => {
    /** validate a request body and grab error if exist */
    const { error } = editDataSchema.validate(request.body, { abortEarly: false })


    if (error) {
        /** if there is an error, then give a response like this */
        return response.status(400).json({
            status: false,
            message: error.details.map(it => it.message).join()
        })
    }
    return next()
}