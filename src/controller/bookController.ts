import { Request, Response } from "express";
import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient({ errorFormat: "pretty" });

export const getAllBook = async (request: Request, response: Response) => {
    try {
        const { search, userId } = request.query;

        // Parse dan validasi userId
        const parsedUserId = userId ? Number(userId) : null;
        const isValidUserId = parsedUserId !== null && !isNaN(parsedUserId);

        // Siapkan kondisi filter
        const filters = isValidUserId
            ? {
                OR: [
                    { userId: parsedUserId },
                    { kosId: parsedUserId }
                ]
            }
            : {}; // tidak ada filter jika userId tidak valid

        const allOrders = await prisma.book.findMany({
            where: filters,
            orderBy: { startDate: "desc" },
            include: { kos: true, user: true }
        });

        return response.status(200).json({
            status: true,
            data: allOrders,
            message: `Order list has retrieved`
        });

    } catch (error) {
        return response.status(400).json({
            status: false,
            message: `There is an error. ${error}`
        });
    }
};

export const createBook = async (request: Request, response: Response) => {
    try {
        const { startDate, endDate, kosId, userId } = request.body;

        if (!startDate || !endDate || !kosId || !userId) {
            return response.status(400).json({
                status: false,
                message: "Semua field (startDate, endDate, kosId, userId) harus diisi."
            });
        }

        const newBook = await prisma.book.create({
            data: {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                kosId: Number(kosId),
                userId: Number(userId),
                status: "pending" // enum harus pakai string yang cocok
            }
        });

        return response.status(200).json({
            status: true,
            data: newBook,
            message: `Booking berhasil dibuat`
        });
    } catch (error) {
        return response.status(400).json({
            status: false,
            message: `Terjadi kesalahan: ${error}`
        });
    }
};