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
        const { id } = request.params
        const { name, email, password, phone, role } = request.body

        const findUser = await prisma.user.findFirst({ where: { id: Number(id) } })
        if (!findUser) return response
            .status(404)
            .json({
                status: false,
                massage: 'Usernya tidak ada'
            })

        const updateUser = await prisma.user.update({
            data: {
                name: name || findUser.name, //or untuk perubahan (kalau ada yang kiri dijalankan, misal tidak ada dijalankan yang kanan)
                email: email || findUser.email, //operasi tenary (sebelah kiri ? = kondisi (price) jika kondisinya true (:) false )
                password: password || findUser.password,
                phone: phone || findUser.phone,
                role: role || findUser.role
            },
            where: { id: Number(id) }
        })

        return response.json({
            status: true,
            data: updateUser,
            massage: 'Update user bisa yaa'
        })

    } catch (error) {
        return response
            .json({
                status: false,
                massage: `Yaa update user-nya error ${error}`
            })
            .status(400)
    }
}

export const deleteUser = async (request: Request, response: Response) => {
    try {
        const { id } = request.params
        const findUser = await prisma.user.findFirst({ where: { id: Number(id) } })
        if (!findUser) return response
            .status(404)
            .json({ status: false, message: 'Usernya tidak ada' })

        const deleteUser = await prisma.user.delete({
            where: { id: Number(id) }
        })
        return response.json({
            status: true,
            data: deleteUser,
            message: 'Usernya bisa dihapus yaa'
        }).status(200)
    } catch (eror) {
        return response
            .json({
                status: false,
                message: `Yaa delete user-nya error ${eror}`
            }).status(400)
    }
}

export const authentication = async (request: Request, response: Response) => {
    try {
        const { email, password } = request.body;
        const findUser = await prisma.user.findFirst({
            where: { email, password: md5(password) },
        });
        if (!findUser) {
            return response
                .status(400)
                .json({
                    status: false,
                    logged: false,
                    massage: `Email sama password salah`
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