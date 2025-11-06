import { Request, Response, NextFunction } from "express";
import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient({ errorFormat: "pretty" });

export const getReviewsByKos = async (req: Request, res: Response) => {
  try {
    const { kosId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { kosId: Number(kosId) },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(200).json({ data: reviews });
  } catch (error) {
    res.status(500).json({ message: "Error mendapatkan review", error });
  }
};
export const createReview = async (req: Request, res: Response) => {
  try {
    const { kosId, comment } = req.body;
    const userId = (req as any).user.id;

    const kos = await prisma.kos.findUnique({ where: { id: Number(kosId) } });
    if (!kos) {
      return res.status(404).json({ message: "Kos tidak ditemukan" });
    }

    const review = await prisma.review.create({
      data: {
        kosId: Number(kosId),
        userId,
        comment,
      },
    });

    res.status(201).json({
      message: "Review kos berhasil dibuat",
      data: review,
    });
  } catch (error: any) {
    console.error(error); // penting untuk log di terminal
    res.status(500).json({
      message: "Error membuat review",
      error: error.message, // tampilkan pesan error jelas
    });
  }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = (req as any).user.id;

    const review = await prisma.review.findUnique({
      where: { id: Number(id) },
    });
    if (!review) {
      return res.status(404).json({ message: "Review tidak ditemukan" });
    }
    if (review.userId !== userId) {
      return res.status(403).json({ message: "Forbidden: Bukan riview anda" });
    }

    const updated = await prisma.review.update({
      where: { id: Number(id) },
      data: { comment },
    });

    res.status(200).json({
      message: "Update review berhasil",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const review = await prisma.review.findUnique({
      where: { id: Number(id) },
    });
    if (!review) {
      return res.status(404).json({ message: "Review tidak ditemukan" });
    }
    if (review.userId !== userId) {
      return res.status(403).json({ message: "Forbidden: Bukan riview anda" });
    }

    await prisma.review.delete({ where: { id: Number(id) } });

    res.status(200).json({ message: "Review berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Error menghapus review", error });
  }
};

export const replyReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // id review
    const { reply } = req.body;
    const ownerId = (req as any).user.id;

    // Cek apakah review-nya ada
    const review = await prisma.review.findUnique({
      where: { id: Number(id) },
      include: { kos: true },
    });

    if (!review) {
      return res.status(404).json({
        status: false,
        message: "Review tidak ditemukan",
      });
    }

    // Cek apakah yang login adalah pemilik kos terkait
    if (review.kos.userId !== ownerId) {
      return res.status(403).json({
        status: false,
        message: "Kamu tidak memiliki akses untuk membalas review ini",
      });
    }

    // Update review dengan balasan
    const updatedReview = await prisma.review.update({
      where: { id: Number(id) },
      data: { reply },
    });

    return res.status(200).json({
      status: true,
      message: "Balasan berhasil dikirim",
      data: updatedReview,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Terjadi kesalahan saat membalas review",
      error: error.message,
    });
  }
};