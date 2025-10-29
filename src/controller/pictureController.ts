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
    const { kosId } = req.params;

    if (!user || user.role !== "owner") {
      return res.status(403).json({
        status: false,
        message: "Hanya owner yang bisa upload foto kos.",
      });
    }

    // 🧩 Validasi parameter
    if (!kosId || isNaN(Number(kosId))) {
      return res.status(400).json({
        status: false,
        message: "Parameter kosId wajib diisi dan harus berupa angka.",
      });
    }

    // 🧩 Cek apakah kos ada dan milik owner
    const kos = await prisma.kos.findUnique({
      where: { id: Number(kosId) },
    });

    if (!kos) {
      return res.status(404).json({
        status: false,
        message: "Kos tidak ditemukan.",
      });
    }

    if (kos.userId !== user.id) {
      return res.status(403).json({
        status: false,
        message: "Kamu bukan pemilik kos ini.",
      });
    }

    // 🖼️ Ambil file dari request
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const thumbnail = files?.["thumbnail"]?.[0];
    const photos = files?.["photos"] || [];

    if (!thumbnail && photos.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Minimal unggah satu foto (thumbnail atau foto kos).",
      });
    }

    // 🪶 Simpan thumbnail (jika ada)
    if (thumbnail) {
      await prisma.kosPic.create({
        data: {
          kosId: kos.id,
          imagePath: thumbnail.path.replace(/\\/g, "/"),
          isThumbnail: true,
        },
      });
    }

    // 🖼️ Simpan foto tambahan (bisa 1–3)
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
      message: "Foto kos berhasil diunggah.",
      data: {
        kosId: kos.id,
        totalFoto: (thumbnail ? 1 : 0) + photos.length,
      },
    });
  } catch (error) {
    console.error("❌ Error uploadKosPictures:", error);
    return res.status(500).json({
      status: false,
      message: `Terjadi kesalahan saat upload foto: ${error}`,
    });
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

    // Cek kepemilikan
    if (picture.kos.userId !== user.id) {
      return res.status(403).json({
        status: false,
        message: "Kamu tidak memiliki izin menghapus foto ini",
      });
    }

    // Dapatkan path absolut ke file
    const rootDir = path.resolve(__dirname, "../../"); // naik 2 folder dari src/controller → ke root project
    const fullPath = path.join(rootDir, picture.imagePath.replace(/\\/g, "/"));

    // Hapus file fisik jika ada
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log("✅ File dihapus:", fullPath);
    } else {
      console.warn("⚠️ File tidak ditemukan di:", fullPath);
    }

    // Hapus record dari database
    await prisma.kosPic.delete({ where: { id: Number(picId) } });

    return res.status(200).json({
      status: true,
      message: "Foto berhasil dihapus",
    });
  } catch (error) {
    console.error("❌ Error saat menghapus foto:", error);
    return res.status(500).json({
      status: false,
      message: `Gagal menghapus foto: ${error}`,
    });
  }
};