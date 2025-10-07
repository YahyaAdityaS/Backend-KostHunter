import { Router } from "express";
import { createReview, deleteReview, getReviewsByKos, updateReview } from "../controller/riviewController";
import { verifyCreateReview, verifyEditReview } from "../middlewares/riviewValidation";
import { verifyToken } from "../middlewares/authorization";

const router = Router();

router.post("/", verifyCreateReview, verifyToken, createReview);
router.get("/:kosId", getReviewsByKos);
router.put("/:id", verifyToken ,verifyEditReview, updateReview);
router.delete("/:id", verifyToken, deleteReview);

export default router;