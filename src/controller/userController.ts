import { Request, response, Response } from "express";
import { PrismaClient, Role, Status } from "@prisma/client";
import md5 from "md5"
import { BASE_URL, SECRET } from "../global";
import { sign } from "jsonwebtoken";

const prisma = new PrismaClient({ errorFormat: "pretty" })
export const getAllUser = async (request: Request, response: Response) => {
    try {
        const { search } = request.query
        const allUser = await prisma.user.findMany({
            where: { name: { contains: search?.toString() || "" } }
        })
        return response.json({
            status: true,
            data: allUser,
            message: 'Ini data user-nya yaa'
        }).status(200)
    }
    catch (error) {
        return response
            .json({
                status: false,
                message: `Yaa get all user-nya error ${error}`
            }).status(400)
    }
}

export const createUser = async (request: Request, response: Response) => {
    try {
        const { name, email, password, phone, role} = request.body
        const existingUser = await prisma.user.findUnique({ where: { email: email } });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return response.status(400).json({
                status: false,
                message: "Format email tidak valid, gunakan format seperti 'abunaca@gmail.com'"
            });
        }
        if (existingUser) {
            return response.status(400).json({
                status: false,
                message: 'Email sudah terdaftar yaa'
            })
        }
        const newUser = await prisma.user.create({
            data: { name, email, password: md5(password),phone, role}
        })

        return response.json({
            status: true,
            date: newUser,
            message: `Buat user bisa yaa ${newUser.name}`
        })
    } catch (error) {
        return response
            .json({
                status: false,
                message: `Yaa create user-nya error ${error}`
            }).status(400);
    }
}

export const updateUser = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const { name, email, password, phone, role } = request.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const existingUser = await prisma.user.findUnique({ where: { email: email } });

    const findUser = await prisma.user.findFirst({
      where: { id: Number(id) },
    });

    if (!findUser) {
      return response.status(404).json({
        status: false,
        message: "User tidak ditemukan",
      });
    }
    if (!emailRegex.test(email)) {
          return response.status(400).json({
            status: false,
            message: "Format email tidak valid, gunakan format seperti 'abun@gmail.com'"
          });
    }
    if (existingUser) {
            return response.status(400).json({
                status: false,
                message: 'Email sudah terdaftar yaa'
      })
    }

    // 🔹 Validasi role (hanya boleh 'owner' atau 'society')
    if (role && !["owner", "society"].includes(role)) {
      return response.status(400).json({
        status: false,
        message: "Role tidak valid. Hanya boleh 'owner' atau 'society'.",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name: name || findUser.name,
        email: email || findUser.email,
        password: password || findUser.password,
        phone: phone || findUser.phone,
        role: role || findUser.role,
      },
    });

    return response.status(200).json({
      status: true,
      data: updatedUser,
      message: "User berhasil diperbarui",
    });
  } catch (error) {
    return response.status(400).json({
      status: false,
      message: `Yaa update user-nya error: ${error}`,
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user; // data dari middleware verifyToken

    // Pastikan user dari token valid
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Token tidak valid atau belum login",
      });
    }

    // Cek apakah user ada di database
    const findUser = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!findUser) {
      return res.status(404).json({
        status: false,
        message: "User tidak ditemukan",
      });
    }

    // Cek apakah user mau hapus dirinya sendiri
    if (user.id !== Number(id)) {
      return res.status(403).json({
        status: false,
        message: "Kamu tidak bisa menghapus akun milik orang lain!",
      });
    }

    // 🔹 Hapus user
    const deletedUser = await prisma.user.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      status: true,
      message: "Akunmu berhasil dihapus",
      data: deletedUser,
    });
  } catch (error) {
    console.error("❌ Error deleteUser:", error);
    return res.status(500).json({
      status: false,
      message: `Terjadi kesalahan saat menghapus user: ${error}`,
    });
  }
};

export const authentication = async (request: Request, response: Response) => {
    try {
        const { email, password } = request.body;
        const findUser = await prisma.user.findFirst({where: { email, password: md5(password) }});
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return response.status(400).json({
                status: false,
                message: "Format email tidak valid, gunakan format seperti 'abunaca@gmail.com'"
            });
        }
        if (!findUser) {
            return response
                .status(400)
                .json({
                    status: false,
                    logged: false,
                    massage: `Email atau password salah`
                })
        }
        let data = {
            id: findUser.id,
            name: findUser.name,
            email: findUser.email,
            role: findUser.role
        }
        let payload = JSON.stringify(data); //mennyiapakan data untuk menjadikan token
        let token = sign(payload, SECRET || "token");

        return response
            .status(200)
            .json({
                status: true,
                logged: true,
                message: `Login Succes`, token, data:data
            })
    } catch (error) {
        return response
            .json({
                status: false,
                message: `Yaa autehtication-nya error ${error}`
            }).status(400)
    }
}