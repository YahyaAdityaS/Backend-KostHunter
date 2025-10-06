import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import multer from "multer";

/** parser untuk form-data (tanpa upload file) */
const upload = multer();

/** schema validasi untuk create Review */
const addReviewSchema = Joi.object({
  kosId: Joi.number().required().messages({
    "any.required": "kosId harus diisi",
    "number.base": "kosId harus berupa angka"
  }),
  comment: Joi.string().min(3).required().messages({
    "any.required": "comment harus diisi",
    "string.base": "comment harus berupa string",
    "string.min": "comment harus diisi minimal 3 karakter"
  })
}).unknown(true);

/** schema validasi untuk update Review */
const editReviewSchema = Joi.object({
  kosId: Joi.number().optional(),
  comment: Joi.string().min(3).optional().messages({
    "string.base": "comment harus berupa string",
    "string.min": "comment harus diisi minimal 3 karakter"
  })
}).unknown(true);

export const verifyCreateReview = [
  upload.none(),
  (request: Request, response: Response, next: NextFunction) => {
    const { error } = addReviewSchema.validate(request.body, { abortEarly: false });

    if (error) {
      return response.status(400).json({
        status: false,
        message: error.details.map((it) => it.message).join(", ")
      });
    }
    return next();
  }
];

export const verifyEditReview = [
  upload.none(),
  (request: Request, response: Response, next: NextFunction) => {
    const { error } = editReviewSchema.validate(request.body, { abortEarly: false });

    if (error) {
      return response.status(400).json({
        status: false,
        message: error.details.map((it) => it.message).join(", ")
      });
    }
    return next();
  }
];
