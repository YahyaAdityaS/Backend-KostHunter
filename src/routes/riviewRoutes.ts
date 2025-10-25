import express  from "express";
import { createReview, deleteReview, getReviewsByKos, updateReview, replyReview } from "../controller/riviewController";
import { verifyCreateReview, verifyEditReview, verifyReplyReview } from "../middlewares/riviewValidation";
import { verifyRole, verifyToken } from "../middlewares/authorization";

const app = express();

app.get("/:kosId", getReviewsByKos);
app.post("/", verifyToken, verifyRole(["society"]), ...verifyCreateReview, createReview);
app.post("/reply/:id", verifyToken, verifyRole(["owner"]), ...verifyReplyReview,replyReview);
app.put(`/edit/:id`, verifyToken, verifyRole(["society"]), ...verifyEditReview, updateReview);
app.delete("/:id", verifyToken, deleteReview);

export default app;