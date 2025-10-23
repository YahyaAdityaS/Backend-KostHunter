import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ errorFormat: "pretty" });


export const getAllFacility = async (req: Request, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: { kos: { select: { name: true }}},
      omit: { kosId: true }
    });

    if (facilities.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Belum ada data fasilitas"
      });
    }

    return res.status(200).json({
      status: true,
      data: facilities,
      message: "Berhasil menampilkan semua fasilitas"
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: `Terjadi kesalahan: ${error}`
    });
  }
};


export const getFacilityByKosId = async (req: Request, res: Response) => {
  try {
    const { kosId } = req.params;

    if (!kosId) {
      return res.status(400).json({
        status: false,
        message: "Parameter kosId wajib diisi"
      });
    }

    const facilities = await prisma.facility.findMany({
      where: { kosId: Number(kosId) }
    });

    if (facilities.length === 0) {
      return res.status(404).json({
        status: false,
        message: `Belum ada fasilitas untuk kos dengan id ${kosId}`
      });
    }

    return res.status(200).json({
      status: true,
      data: facilities,
      message: `Berhasil menampilkan fasilitas untuk kos id ${kosId}`
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: `Terjadi kesalahan: ${error}`
    });
  }
};


export const createFacility = async (req: Request, res: Response) => {
  try {
    const { kosId, name} = req.body;
    const user = (req as any).user; // dari JWT

    const kos = await prisma.kos.findUnique({ where: { id: Number(kosId) } });
    if (!kos) {
      return res.status(404).json({
        status: false,
        message: `Kos dengan id ${kosId} tidak ditemukan`,
      });
    }

    // 🔒 Cek apakah user adalah pemilik kos ini
    if (kos.userId !== user.id) {
      return res.status(403).json({
        status: false,
        message: "Anda tidak memiliki izin untuk menambahkan fasilitas pada kos ini.",
      });
    }

    const newFacility = await prisma.facility.create({
      data: { kosId: Number(kosId), name},
    });

    return res.status(201).json({
      status: true,
      message: "Facility berhasil dibuat",
      data: newFacility,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: `Terjadi kesalahan: ${error}`,
    });
  }
};

/** ✅ Update Facility — hanya owner kos yang memiliki fasilitas ini */
export const updateFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const user = (req as any).user;

    const facility = await prisma.facility.findUnique({
      where: { id: Number(id) },
      include: { kos: true }, // supaya bisa tahu pemilik kos-nya
    });

    if (!facility) {
      return res.status(404).json({
        status: false,
        message: "Fasilitas tidak ditemukan",
      });
    }

    // 🔒 Cek kepemilikan kos
    if (facility.kos.userId !== user.id) {
      return res.status(403).json({
        status: false,
        message: "Anda tidak memiliki izin untuk mengedit fasilitas ini.",
      });
    }

    const updated = await prisma.facility.update({
      where: { id: Number(id) },
      data: { name},
    });

    return res.status(200).json({
      status: true,
      message: "Facility berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: `Terjadi kesalahan: ${error}`,
    });
  }
};


export const deleteFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const facility = await prisma.facility.findUnique({
      where: { id: Number(id) },
      include: { kos: true },
    });

    if (!facility) {
      return res.status(404).json({
        status: false,
        message: "Fasilitas tidak ditemukan",
      });
    }

    // 🔒 Cek apakah user pemilik kos
    if (facility.kos.userId !== user.id) {
      return res.status(403).json({
        status: false,
        message: "Anda tidak memiliki izin untuk menghapus fasilitas ini.",
      });
    }

    await prisma.facility.delete({ where: { id: Number(id) } });

    return res.status(200).json({
      status: true,
      message: "Facility berhasil dihapus",
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: `Terjadi kesalahan: ${error}`,
    });
  }
};