import { Router } from "express";
import { createReview, deleteReview, getReviewsByKos, updateReview, replyReview } from "../controller/riviewController";
import { verifyCreateReview, verifyEditReview, verifyReplyReview } from "../middlewares/riviewValidation";
import { verifyRole, verifyToken } from "../middlewares/authorization";

const router = Router();

router.get("/:kosId", getReviewsByKos);
router.post("/", verifyToken, verifyRole(["society"]), ...verifyCreateReview, createReview);
router.post("/reply/:id", verifyToken, verifyRole(["owner"]), ...verifyReplyReview,replyReview);
router.put(`/edit/:id`, verifyToken, verifyRole(["society"]), ...verifyEditReview, updateReview);
router.delete("/:id", verifyToken, deleteReview);

export default router;