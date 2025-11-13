import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import multer from "multer";

/** parser untuk form-data (tanpa upload file) */
const upload = multer();

/** ✅ Schema untuk create review oleh society */
const addReviewSchema = Joi.object({
  kosId: Joi.number().required().messages({
    "any.required": "kosId harus diisi",
    "number.base": "kosId harus berupa angka",
  }),
  comment: Joi.string().min(3).required().messages({
    "any.required": "comment harus diisi",
    "string.base": "comment harus berupa teks",
    "string.min": "comment minimal 3 karakter",
  }),
}).unknown(false);

/** Schema untuk edit review oleh society */
const editReviewSchema = Joi.object({
  kosId: Joi.number().optional(),
  comment: Joi.string().min(3).optional().messages({
    "string.base": "comment harus berupa teks",
    "string.min": "comment minimal 3 karakter",
  }),
}).unknown(false);

/** Schema untuk reply review oleh owner */
const replyReviewSchema = Joi.object({
  reply: Joi.string().min(3).required().messages({
    "any.required": "reply harus diisi",
    "string.base": "reply harus berupa teks",
    "string.min": "reply minimal 3 karakter",
  }),
}).unknown(false);

/** Middleware untuk create review */
export const verifyCreateReview = [
  upload.none(),
  (request: Request, response: Response, next: NextFunction) => {
    const { error } = addReviewSchema.validate(request.body, { abortEarly: false });
    if (error) {
      return response.status(400).json({
        status: false,
        message: error.details.map((it) => it.message).join(", "),
      });
    }
    return next();
  },
];

/** Middleware untuk edit review */
export const verifyEditReview = [
  upload.none(),
  (request: Request, response: Response, next: NextFunction) => {
    const { error } = editReviewSchema.validate(request.body, { abortEarly: false });
    if (error) {
      return response.status(400).json({
        status: false,
        message: error.details.map((it) => it.message).join(", "),
      });
    }
    return next();
  },
];

/** ✅ Middleware untuk reply review oleh owner */
export const verifyReplyReview = [
  upload.none(),
  (request: Request, response: Response, next: NextFunction) => {
    const { error } = replyReviewSchema.validate(request.body, { abortEarly: false });
    if (error) {
      return response.status(400).json({
        status: false,
        message: error.details.map((it) => it.message).join(", "),
      });
    }
    return next();
  },
];

export const verifyEditReplyReview = [
  upload.none(),
  (request: Request, response: Response, next: NextFunction) => {
    const { error } = replyReviewSchema.validate(request.body, { abortEarly: false });
    if (error) {
      return response.status(400).json({
        status: false,
        message: error.details.map((it) => it.message).join(", "),
      });
    }
    return next();
  },
];