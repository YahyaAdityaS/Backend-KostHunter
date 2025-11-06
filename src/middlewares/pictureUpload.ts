import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { CustomRequest } from '../types.d'; // Sesuaikan path jika types.d.ts di folder berbeda

const prisma = new PrismaClient();
const photoCounter = 2;

// Konfigurasi storage Multer
const storage = multer.diskStorage({
  destination: (req: CustomRequest, file, cb) => {
    const kosId = req.params.kosId;
    if (!kosId) {
      return cb(new Error('Kos ID is required'), '');
    }
    const uploadPath = path.join(__dirname, '../../public/kos_image', kosId); // Folder: uploads/kos/{kosId}

    // Buat folder jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req: CustomRequest, file, cb) => {
    const kosId = req.params.kosId;
    if (!kosId) {
      return cb(new Error('Kos ID is required'), '');
    }
    const existingPhotos = req.existingPhotos || [];

    let fileNumber: number;
    if (file.fieldname === 'thumbnail') {
      fileNumber = 1; // Selalu 1 untuk thumbnail
    } else {
      // Cari nomor terbesar untuk foto biasa (2,3,4)
      const biasaNumbers: number[] = existingPhotos
        .filter((p: any) => !p.isThumbnail)
        .map((p: any) => {
          const imagePath = p.imagePath || '';
          return parseInt(path.basename(imagePath, path.extname(imagePath))) || 0;
        })
        .sort((a: number, b: number) => a - b);
      
      // Perbaikan: Gunakan optional chaining dan fallback untuk menghindari undefined
      const lastNumber = biasaNumbers.length > 0 ? biasaNumbers[biasaNumbers.length - 1] ?? 1 : 1; // ?? 1 sebagai fallback jika undefined
      fileNumber = lastNumber + 1;
      if (fileNumber > 4) fileNumber = 4; // Maksimal 4
    }

    const ext = path.extname(file.originalname);
    cb(null, `${fileNumber}${ext}`);
  },
});

// Filter file: hanya gambar
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Middleware upload
export const uploadKosPhotos = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'photos', maxCount: 3 }, // Foto biasa
]);

// Middleware tambahan: Validasi kos dan ambil foto existing
export const validateKosAndPhotos = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const kosIdStr = req.params.kosId;
  if (!kosIdStr) {
    return res.status(400).json({ message: 'Kos ID is required' });
  }
  const kosId = parseInt(kosIdStr);
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Cek apakah kos ada dan user adalah owner
    const kos = await prisma.kos.findUnique({
      where: { id: kosId },
      include: { kosPics: true },
    });

    if (!kos) {
      return res.status(404).json({ message: 'Kos not found' });
    }

    if (kos.userId !== userId) {
      return res.status(403).json({ message: 'You are not the owner of this kos' });
    }

    // Simpan existing photos untuk penamaan
    req.existingPhotos = kos.kosPics;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};