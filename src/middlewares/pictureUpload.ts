import multer from "multer";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const uploadKosPic = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const { kosId } = req.params;

      prisma.kos
        .findUnique({ where: { id: Number(kosId) } })
        .then((kos) => {
          if (!kos) return cb(new Error("Kos tidak ditemukan"), "");

          const safeFolderName = kos.name.replace(/\s+/g, "_");
          const folderPath = path.join(
            __dirname,
            `../../public/kos_picture/${safeFolderName}`
          );

          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
          }

          cb(null, folderPath);
        })
        .catch((err) => cb(err, ""));
    },

    filename: (req, file, cb) => {
      const { kosId } = req.params;

      prisma.kos
        .findUnique({ where: { id: Number(kosId) } })
        .then((kos) => {
          const safeFolderName = kos?.name.replace(/\s+/g, "_") || "kos_unknown";
          const folderPath = path.join(
            __dirname,
            `../../public/kos_picture/${safeFolderName}`
          );

          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
          }

          const existingFiles = fs.readdirSync(folderPath);
          const prefix = file.fieldname === "thumbnail" ? "thumbnail" : "pic";
          const nextNumber = existingFiles.filter((f) =>
            f.startsWith(prefix)
          ).length + 1;

          const filename = `${prefix}_${nextNumber}${path.extname(
            file.originalname
          )}`;

          cb(null, filename);
        })
        .catch((err) => cb(err, ""));
    },
  }),

  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB per file

  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Hanya file JPG/PNG yang diperbolehkan"));
    }
    cb(null, true);
  },
});