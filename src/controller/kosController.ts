import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { BASE_URL } from "../global";

const prisma = new PrismaClient({ errorFormat: "pretty" });

/** 🏘️ GET Semua Kos */
export const getAllKos = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const allKos = await prisma.kos.findMany({
      where: {
        name: { contains: search?.toString() || "" },
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        facilities: true,
        reviews: true,
        books: true,
      },
      orderBy: { id: "desc" },
    });

    return res.status(200).json({
      status: true,
      message: "Data kos berhasil diambil",
      data: allKos,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Yaa get all kos-nya error: ${error}`,
    });
  }
};

/** 🏠 CREATE Kos */
export const createKos = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User tidak ditemukan dalam token",
      });
    }

    // Hanya owner yang boleh buat kos
    if (user.role !== "owner") {
      return res.status(403).json({
        status: false,
        message: "Hanya owner yang dapat membuat kos",
      });
    }

    const { name, address, pricePerMonth, description, gender, roomTotal, roomAvailable } = req.body;

    let filename = "";
    if (req.file) filename = req.file.filename;

    const newKos = await prisma.kos.create({
      data: {
        name,
        address,
        pricePerMonth: Number(pricePerMonth),
        description,
        picture: filename,
        gender,
        userId: user.id,
        roomTotal: Number(roomTotal),
        roomAvailable: Number(roomAvailable),
      },
    });

    return res.status(201).json({
      status: true,
      message: `Kos berhasil dibuat oleh ${user.name}`,
      data: newKos,
    });
  } catch (error: any) {
    console.error("❌ Error createKos:", error);
    return res.status(400).json({
      status: false,
      message: `Yaa buat kos-nya error: ${error.message || error}`,
    });
  }
};

/** ✏️ UPDATE Kos */
export const updateKos = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, address, pricePerMonth, description, gender, roomTotal, roomAvailable } = req.body;

    const findKos = await prisma.kos.findUnique({ where: { id: Number(id) } });
    if (!findKos) {
      return res.status(404).json({ status: false, message: "Kos tidak ditemukan" });
    }

    // Pastikan hanya owner pemilik kos yang bisa ubah
    if (user.role !== "owner" || user.id !== findKos.userId) {
      return res.status(403).json({
        status: false,
        message: "Kamu tidak punya izin untuk mengedit kos ini",
      });
    }

    let filename = findKos.picture;
    if (req.file) {
      const oldPath = path.join(__dirname, `../public/kos_picture/${findKos.picture}`);
      if (fs.existsSync(oldPath) && findKos.picture !== "") {
        fs.unlinkSync(oldPath);
      }
      filename = req.file.filename;
    }

    const updatedKos = await prisma.kos.update({
      where: { id: Number(id) },
      data: {
        name: name ?? findKos.name,
        address: address ?? findKos.address,
        pricePerMonth: pricePerMonth ? Number(pricePerMonth) : findKos.pricePerMonth,
        description: description ?? findKos.description,
        gender: gender ?? findKos.gender,
        roomTotal: roomTotal ? Number(roomTotal) : findKos.roomTotal,
        roomAvailable: roomAvailable ? Number(roomAvailable) : findKos.roomAvailable,
        picture: filename,
      },
    });

    return res.status(200).json({
      status: true,
      message: "Kos berhasil diperbarui",
      data: updatedKos,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: `Yaa update kos-nya error ${error}`,
    });
  }
};

/** 🗑️ DELETE Kos */
export const deleteKos = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const kos = await prisma.kos.findUnique({ where: { id: Number(id) } });
    if (!kos) {
      return res.status(404).json({
        status: false,
        message: `Kos dengan id ${id} tidak ditemukan`,
      });
    }

    // Validasi owner
    if (user.role !== "owner" || user.id !== kos.userId) {
      return res.status(403).json({
        status: false,
        message: "Kamu tidak memiliki izin untuk menghapus kos ini",
      });
    }

    // Hapus gambar jika ada
    const filePath = path.join(__dirname, `../public/kos_picture/${kos.picture}`);
    if (fs.existsSync(filePath) && kos.picture !== "") fs.unlinkSync(filePath);

    await prisma.kos.delete({ where: { id: Number(id) } });

    return res.status(200).json({
      status: true,
      message: "Kos berhasil dihapus",
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: `Yah delete kos-nya error ${error}`,
    });
  }
};

/** ✅ GET Kos yang masih tersedia */
export const getAvailableKos = async (req: Request, res: Response) => {
  try {
    const availableKos = await prisma.kos.findMany({
      where: { roomAvailable: { gt: 0 } },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        facilities: true,
      },
      orderBy: { pricePerMonth: "asc" },
    });

    if (availableKos.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ada kos yang siap dihuni saat ini.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Daftar kos yang siap dihuni berhasil ditampilkan.",
      data: availableKos,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Terjadi kesalahan saat mengambil data kos: ${error}`,
    });
  }
};

/** 🚻 Filter Kos berdasarkan Gender */
export const getGenderKos = async (req: Request, res: Response) => {
  try {
    const { gender } = req.query;

    if (!gender) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'gender' wajib disertakan. Contoh: /kos/filter?gender=male",
      });
    }

    const allowedGenders = ["male", "female", "all"];
    if (!allowedGenders.includes(gender.toString().toLowerCase())) {
      return res.status(400).json({
        status: false,
        message: `Gender '${gender}' tidak valid. Gunakan: ${allowedGenders.join(", ")}.`,
      });
    }

    const kosList = await prisma.kos.findMany({
      where: {
        gender: gender.toString().toLowerCase() as any,
        roomAvailable: { gt: 0 },
      },
      include: { facilities: true, user: true },
    });

    if (kosList.length === 0) {
      return res.status(404).json({
        status: false,
        message: `Tidak ada kos dengan gender '${gender}' yang tersedia.`,
      });
    }

    return res.status(200).json({
      status: true,
      message: `Daftar kos dengan gender '${gender}' berhasil diambil.`,
      total: kosList.length,
      data: kosList,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Terjadi kesalahan server: ${error}`,
    });
  }
};