import express from "express";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import { uploadKosPic } from "../middlewares/pictureUpload";
import { uploadKosPictures } from "../controller/pictureController";

const router = express.Router();

router.post(
  "/:id/pictures",
  [verifyToken, verifyRole(["owner"]), uploadKosPic.fields([{ name: "thumbnail", maxCount: 1 },{ name: "photos", maxCount: 3 },]),], uploadKosPictures
);

export default router;