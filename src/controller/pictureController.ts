import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const uploadKosPictures = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // ✅ Pastikan yang upload adalah owner
    if (!user || user.role !== "owner") {
      return res.status(403).json({
        status: false,
        message: "Hanya owner yang bisa upload foto kos",
      });
    }

    // ✅ Cek apakah kos ada dan milik owner
    const kos = await prisma.kos.findUnique({ where: { id: Number(id) } });
    if (!kos) {
      return res.status(404).json({ status: false, message: "Kos tidak ditemukan" });
    }
    if (kos.userId !== user.id) {
      return res.status(403).json({
        status: false,
        message: "Kamu bukan pemilik kos ini",
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const thumbnail = files["thumbnail"]?.[0];
    const photos = files["photos"] || [];

    if (!thumbnail && photos.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Minimal unggah satu foto (thumbnail atau foto kos)",
      });
    }

    // Simpan thumbnail
    if (thumbnail) {
      await prisma.kosPic.create({
        data: {
          kosId: kos.id,
          imagePath: thumbnail.path.replace(/\\/g, "/"), // simpan path relatif
          isThumbnail: true,
        },
      });
    }

    // Simpan foto biasa
    for (const photo of photos) {
      await prisma.kosPic.create({
        data: {
          kosId: kos.id,
          imagePath: photo.path.replace(/\\/g, "/"),
          isThumbnail: false,
        },
      });
    }

    return res.status(201).json({
      status: true,
      message: "Foto kos berhasil diunggah",
    });
  } catch (error) {
    console.error("Error uploadKosPictures:", error);
    return res.status(500).json({
      status: false,
      message: `Terjadi kesalahan saat upload foto: ${error}`,
    });
  }
};