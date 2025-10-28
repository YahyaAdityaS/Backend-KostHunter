import express from "express";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import { uploadKosPic } from "../middlewares/pictureUpload";
import { uploadKosPictures, updateKosPicture, deleteKosPicture, getKosPictures } from "../controller/pictureController";

const app = express();

app.post("/:id/pictures", [verifyToken, verifyRole(["owner"]), uploadKosPic.fields([{ name: "thumbnail", maxCount: 1 }, { name: "photos", maxCount: 3 }])], uploadKosPictures);
app.put("/pictures/:picId", [verifyToken, verifyRole(["owner"]), uploadKosPic.single("image")], updateKosPicture);
app.get("/:kosId/pictures", verifyToken, getKosPictures);
app.delete("/pictures/:picId", [verifyToken, verifyRole(["owner"])], deleteKosPicture);

export default app;