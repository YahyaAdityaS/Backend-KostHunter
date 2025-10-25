import multer from "multer";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const uploadKosPic = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const { id } = req.params;
        const kos = await prisma.kos.findUnique({ where: { id: Number(id) } });

        if (!kos) {
          return cb(new Error("Kos tidak ditemukan"), "");
        }

        // Ganti spasi di nama kos jadi underscore biar aman di file system
        const safeFolderName = kos.name.replace(/\s+/g, "_");

        const folderPath = path.join(__dirname, `../../public/kos_picture/${safeFolderName}`);

        // kalau folder belum ada, buat otomatis
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        cb(null, folderPath);
      } catch (err) {
        cb(err as Error, "");
      }
    },

    filename: async (req, file, cb) => {
      const { id } = req.params;
      const kos = await prisma.kos.findUnique({ where: { id: Number(id) } });
      const safeFolderName = kos?.name.replace(/\s+/g, "_") || "kos_unknown";

      const folderPath = path.join(__dirname, `../../public/kos_picture/${safeFolderName}`);

      // ambil semua file yang ada untuk menentukan urutan nama file selanjutnya
      const existingFiles = fs.existsSync(folderPath)
        ? fs.readdirSync(folderPath)
        : [];

      let nextNumber = existingFiles.length + 1;
      let prefix = file.fieldname === "thumbnail" ? "thumbnail" : "pic";
      const filename = `${prefix}_${nextNumber}${path.extname(file.originalname)}`;

      cb(null, filename);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // max 3MB per file

  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Hanya file JPG/PNG yang diperbolehkan"));
    }
    cb(null, true);
  },
});