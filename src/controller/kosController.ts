import { Request, Response } from "express"; //impor ekspress
import { $Enums, Gender, PrismaClient, Status } from "@prisma/client"; //
import { request } from "http";
import { BASE_URL } from "../global";
import fs from "fs"
import { exist } from "joi";
import path from "path";
import { error } from "console";

const prisma = new PrismaClient({ errorFormat: "pretty" })
export const getAllKos = async (request: Request, response: Response) => { //endpoint perlu diganti ganti pakai const kalau tetap let
    //menyiapkan data input dulu(request) --> request
    try {
        //input
        const { search } = request.query //query boleh ada atau tidak params harus ada
        //main
        const allMenus = await prisma.kos.findMany({
            where: { name: { contains: search?.toString() || "" } } //name buat mencari apa di seacrh, contains == like(mysql) [mengandung kata apa], OR/|| (Salah satu true semaunya all), ""untuk menampilkan kosong
        })
        //output
        return response.json({ //tampilkan juga statusnya(untuk inidkator)
            status: true,
            data: allMenus,
            message: 'Ini data kos-nya yaa'
        }).status(200) //100 200 Berhasil
    }
    catch (eror) {
        return response
            .json({
                status: false,
                message: `Yaa get all kos-nya error ${eror}`
            })
            .status(400)
    }
}

export const createKos = async (request: Request, response: Response) => {
    try {
        // Ambil data user dari token JWT
        const user = (request as any).user;

        if (!user) {
            return response.status(401).json({
                status: false,
                message: "User tidak ditemukan dalam token"
            });
        }

        //  Kalau role bukan owner, tolak
        if (user.role !== "owner") {
            return response.status(403).json({
                status: false,
                message: "Hanya owner yang dapat membuat kos"
            });
        }

        const { name, address, pricePerMonth, facility, description, gender, roomTotal, roomAvailable } = request.body;

        let filename = "";
        if (request.file) filename = request.file.filename; // ambil nama file dari multer

        // 🏠 Buat data kos baru
        const newKos = await prisma.kos.create({
            data: {
                name,
                address,
                pricePerMonth: Number(pricePerMonth),
                facility,
                description,
                picture: filename,
                gender,
                userId: Number(user.id), // ambil userId dari token
                roomTotal: Number(roomTotal),
                roomAvailable: Number(roomAvailable)
            }
        });

        return response.status(200).json({
            status: true,
            data: newKos,
            message: `Kos berhasil dibuat oleh ${user.name}`
        });

    } catch (error: any) {
        console.error("❌ Error createKos:", error);

        return response.status(400).json({
            status: false,
            message: `Yaa buat kos-nya error: ${error.message || error}`
        });
    }
};

export const updateKos = async (request: Request, response: Response) => {
    try {

        const {name, address,pricePerMonth, facility, description, gender, userId, roomTotal, roomAvailable} = request.body;
        const { id } = request.params;

        const findKos = await prisma.kos.findFirst({ where: { id: Number(id) } });
        if (!findKos) {
            return response.status(404).json({
                status: false,
                message: 'Kos tidak ditemukan'
            });
        }
        
        if (userId) {
            const findUser = await prisma.user.findUnique({ where: { id: Number(userId) } 
        });
        
        if (!findUser) {
            return response.status(404).json({
                status: false,
                message: `User dengan id ${userId} tidak ditemukan`});
            }}

        // Default filename dari database
        let filename = findKos.picture;

        // Kalau ada file baru diupload
        if (request.file) {
            filename = request.file.filename;
            const oldPath = path.join(__dirname, `../public/kos_picture/${findKos.picture}`);
            const exists = fs.existsSync(oldPath);
            if (exists && findKos.picture !== '') {
                fs.unlinkSync(oldPath);
            }
        }
        const updateKos = await prisma.kos.update({
            where: { id: Number(id) },
            data: {
                name: name || findKos.name,
                address: address || findKos.address,
                pricePerMonth: pricePerMonth ? Number(pricePerMonth) : findKos.pricePerMonth,
                roomTotal: roomTotal ? Number(roomTotal) : findKos.roomTotal,
                roomAvailable: roomAvailable ? Number(roomAvailable) : findKos.roomAvailable,
                description: description || findKos.description,
                gender: gender || findKos.gender,
                picture: filename,
                facility: facility || findKos.facility,
                userId: userId ? Number(userId) : findKos.userId,
                // Tambahkan `facility` dan `userId` jika memang ingin diubah
            }
        });

        return response.json({
            status: true,
            message: 'Kos berhasil diupdate',
            data: updateKos
        });

    } catch (error) {
        console.error(error);
        return response.status(400).json({
            status: false,
            message: `Yaa update kos-nya error ${error}`
        });
    }
};

export const deleteKos = async (request: Request, response: Response) => {
    try {
        const { id } = request.params
        const findMenu = await prisma.kos.findFirst({ where: { id: Number(id) } })
        if (!findMenu) return response
            .status(200)
            .json({ status: false, message: 'Kos dengan id ' + id + ' tidak ditemukan' })

            let path = `${BASE_URL}/../public/kos_picture/$(findKos.picture)`
            let exists = fs.existsSync(path)
            if (exists && findMenu.picture !== ``) fs.unlinkSync(path)

        const deletedMenu = await prisma.kos.delete({
            where: { id: Number(id) }
        })
        return response.json({
            status: true,
            data: deleteKos,
            message: 'Kos-nya bisa dihapus yaa'
        }).status(200)
    } catch (eror) {
        return response
            .json({
                status: false,
                message: `Yah delete kos-nya error ${eror}`
            }).status(400)
    }
}

export const getAvailableKos = async (request: Request, response: Response) => {
  try {
    // Ambil kos yang memiliki roomAvailable > 0
    const availableKos = await prisma.kos.findMany({
      where: {
        roomAvailable: {
          gt: 0 // greater than 0
        }
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true }
        },
        reviews: true,
        books: true
      },
      orderBy: {
        pricePerMonth: "asc" // opsional: sort berdasarkan harga
      }
    });

    // Jika tidak ada kos yang tersedia
    if (availableKos.length === 0) {
      return response.status(404).json({
        status: false,
        message: "Tidak ada kos yang siap dihuni saat ini."
      });
    }

    // Jika ada kos yang tersedia
    return response.status(200).json({
      status: true,
      message: "Daftar kos yang siap dihuni berhasil ditampilkan.",
      data: availableKos
    });

  } catch (error) {
    return response.status(400).json({
      status: false,
      message: `Terjadi kesalahan saat mengambil data kos: ${error}`
    });
  }
};

export const getGenderKos = async (request: Request, response: Response) => {
  try {
    const { gender } = request.query;

    // Validasi query gender harus ada
    if (!gender) {
      return response.status(400).json({
        status: false,
        message: "Parameter 'gender' wajib disertakan. Contoh: /kos/filter?gender=male",
      });
    }

    // Validasi hanya boleh nilai tertentu
    const allowedGenders = ["male", "female", "all"];
    if (!allowedGenders.includes(gender.toString().toLowerCase())) {
      return response.status(400).json({
        status: false,
        message: `Gender '${gender}' tidak valid. Gunakan salah satu dari: ${allowedGenders.join(", ")}.`,
      });
    }

    // Ambil data kos berdasarkan gender
    const kosList = await prisma.kos.findMany({
      where: {
        gender: gender.toString().toLowerCase() as any,
        roomAvailable: { gt: 0 }, // hanya kos yang masih ada kamar
      },
    });

    // Jika hasil kosong
    if (kosList.length === 0) {
      return response.status(404).json({
        status: false,
        message: `Tidak ada kos dengan gender '${gender}' yang tersedia untuk saat ini.`,
      });
    }

    // Jika ditemukan
    return response.status(200).json({
      status: true,
      message: `Daftar kos dengan gender '${gender}' berhasil diambil.`,
      total: kosList.length,
      data: kosList,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      status: false,
      message: `Terjadi kesalahan server: ${error}`,
    });
  }
};
