import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import multer from "multer";

const upload = multer();

const addFacilitySchema = Joi.object({
  kosId: Joi.number().required().messages({
    "any.required": "kosId wajib diisi",
    "number.base": "kosId harus berupa angka",
  }),
  name: Joi.string().min(2).required().messages({
    "any.required": "Nama fasilitas wajib diisi",
    "string.min": "Nama fasilitas minimal 3 karakter",
  }),
});

const editFacilitySchema = Joi.object({
  name: Joi.string().min(2).optional(),
}).unknown(true);

export const verifyAddFacility = [
  upload.none(),
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = addFacilitySchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details.map((e) => e.message).join(", "),
      });
    }
    next();
  },
];

export const verifyEditFacility = [
  upload.none(),
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = editFacilitySchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details.map((e) => e.message).join(", "),
      });
    }
    next();
  },
];