import express from "express";
import { verifyToken, verifyRole } from "../middlewares/authorization";
import { uploadKosPic } from "../middlewares/pictureUpload";
import { uploadKosPictures, updateKosPicture, deleteKosPicture, getKosPicturesByKos } from "../controller/pictureController";

const app = express();

app.get("/:kosId", getKosPicturesByKos);
app.post("/:kosId", [verifyToken, verifyRole(["owner"]), uploadKosPic.fields([{ name: "thumbnail", maxCount: 1 }, { name: "photos", maxCount: 3 }])], uploadKosPictures);
app.put("/:picId", [verifyToken, verifyRole(["owner"]), uploadKosPic.single("image")], updateKosPicture);
app.delete("/:picId", [verifyToken, verifyRole(["owner"])], deleteKosPicture);

export default app; 