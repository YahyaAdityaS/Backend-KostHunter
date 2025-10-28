import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const getKosPictures = async (req: Request, res: Response) => {
  try {
    const { kosId } = req.params;

    const pictures = await prisma.kosPic.findMany({
      where: { kosId: Number(kosId) },
    });

    if (pictures.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ada foto untuk kos ini",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Data foto kos berhasil diambil",
      data: pictures,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Terjadi kesalahan: ${error}`,
    });
  }
};

export const uploadKosPictures = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user || user.role !== "owner") {
      return res.status(403).json({ status: false, message: "Hanya owner yang bisa upload foto kos" });
    }

    const kos = await prisma.kos.findUnique({ where: { id: Number(id) } });
    if (!kos) return res.status(404).json({ status: false, message: "Kos tidak ditemukan" });
    if (kos.userId !== user.id) return res.status(403).json({ status: false, message: "Kamu bukan pemilik kos ini" });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const thumbnail = files["thumbnail"]?.[0];
    const photos = files["photos"] || [];

    if (!thumbnail && photos.length === 0) {
      return res.status(400).json({ status: false, message: "Minimal unggah satu foto (thumbnail atau foto kos)" });
    }

    // Simpan thumbnail
    if (thumbnail) {
      await prisma.kosPic.create({
        data: {
          kosId: kos.id,
          imagePath: thumbnail.path.replace(/\\/g, "/"),
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

    return res.status(201).json({ status: true, message: "Foto kos berhasil diunggah" });
  } catch (error) {
    console.error("Error uploadKosPictures:", error);
    return res.status(500).json({ status: false, message: `Terjadi kesalahan: ${error}` });
  }
};


export const updateKosPicture = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { picId } = req.params;
    const file = req.file;

    const picture = await prisma.kosPic.findUnique({
      where: { id: Number(picId) },
      include: { kos: true },
    });

    if (!picture) {
      return res.status(404).json({ status: false, message: "Foto tidak ditemukan" });
    }

    if (picture.kos.userId !== user.id) {
      return res.status(403).json({ status: false, message: "Kamu bukan pemilik kos ini" });
    }

    // Hapus file lama
    const oldPath = path.join(__dirname, "../", picture.imagePath);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

    // Simpan foto baru
    const newPath = file?.path.replace(/\\/g, "/") || picture.imagePath;
    const updated = await prisma.kosPic.update({
      where: { id: Number(picId) },
      data: { imagePath: newPath },
    });

    return res.status(200).json({
      status: true,
      message: "Foto kos berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: `Gagal update foto: ${error}` });
  }
};

export const deleteKosPicture = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { picId } = req.params;

    const picture = await prisma.kosPic.findUnique({
      where: { id: Number(picId) },
      include: { kos: true },
    });

    if (!picture) {
      return res.status(404).json({
        status: false,
        message: "Foto tidak ditemukan",
      });
    }

    if (picture.kos.userId !== user.id) {
      return res.status(403).json({
        status: false,
        message: "Kamu tidak memiliki izin menghapus foto ini",
      });
    }

    // Hapus file fisik
    const fullPath = path.join(__dirname, "../", picture.imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Hapus record dari database
    await prisma.kosPic.delete({ where: { id: Number(picId) } });

    return res.status(200).json({
      status: true,
      message: "Foto berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Gagal menghapus foto: ${error}`,
    });
  }
};