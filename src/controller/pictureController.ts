import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { CustomRequest } from '../types';

const prisma = new PrismaClient();

// Upload foto kos
export const uploadKosPhotos = async (req: CustomRequest, res: Response) => {
  const kosId = parseInt(req.params.kosId ?? "0");
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  try {
    const photosToCreate: { imagePath: string; isThumbnail: boolean }[] = [];

    // Handle thumbnail
    if (files.thumbnail && files.thumbnail[0]) {
      const file = files.thumbnail[0];
      const imagePath = path.join('public/kos_image', kosId.toString(), file.filename);
      photosToCreate.push({ imagePath, isThumbnail: true });
    }

    // Handle foto biasa
    if (files.photos) {
      files.photos.forEach((file) => {
        const imagePath = path.join('public/kos_image', kosId.toString(), file.filename);
        photosToCreate.push({ imagePath, isThumbnail: false });
      });
    }

    // Simpan ke DB
    const createdPhotos = await prisma.kosPic.createMany({
      data: photosToCreate.map((p) => ({ ...p, kosId })),
    });

    res.status(201).json({
      message: 'Photos uploaded successfully',
      data: createdPhotos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload photos' });
  }
};

// Get semua foto kos
export const getKosPhotos = async (req: CustomRequest, res: Response) => {
  const kosId = parseInt(req.params.kosId ?? "0");

  try {
    const photos = await prisma.kosPic.findMany({
      where: { kosId },
    });

    res.json({ data: photos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch photos' });
  }
};

// Delete foto kos
export const deleteKosPhoto = async (req: CustomRequest, res: Response) => {
  const kosId = parseInt(req.params.kosId ?? "0");
  const photoId = parseInt(req.params.photoId ?? "0");
  const userId = req.user?.id;

  try {
    // Cek kepemilikan kos
    const kos = await prisma.kos.findUnique({ where: { id: kosId } });
    if (!kos || kos.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Ambil path file
    const photo = await prisma.kosPic.findUnique({ where: { id: photoId } });
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Hapus file dari server
    const filePath = path.join(__dirname, '../../', photo.imagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Hapus dari DB
    await prisma.kosPic.delete({ where: { id: photoId } });

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete photo' });
  }
};