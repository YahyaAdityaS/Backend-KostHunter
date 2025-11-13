import express  from "express";
import { createReview, deleteReview, getReviewsByKos, updateReview, replyReview, editReplyReview, deleteReplyReview } from "../controller/riviewController";
import { verifyCreateReview, verifyEditReplyReview, verifyEditReview, verifyReplyReview } from "../middlewares/riviewValidation";
import { verifyRole, verifyToken } from "../middlewares/authorization";

const app = express();

app.get("/:kosId", getReviewsByKos);
app.post("/", verifyToken, verifyRole(["society"]), ...verifyCreateReview, createReview);
app.post("/reply/:id", verifyToken, verifyRole(["owner"]), ...verifyReplyReview,replyReview);
app.put(`/edit/:id`, verifyToken, verifyRole(["society"]), ...verifyEditReview, updateReview);
app.put(`/reply/:id`, verifyToken, verifyRole(["owner"]), ...verifyEditReplyReview, editReplyReview);
app.delete("/:id", verifyToken, deleteReview);
app.delete("/reply/:id", verifyToken, deleteReplyReview);

export default app;