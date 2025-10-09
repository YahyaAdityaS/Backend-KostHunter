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
    // Ambil data user dari JWT (sudah dipasang di verifyToken)
    const user = (request as any).user;

    if (!user) {
      return response.status(401).json({
        status: false,
        message: "User tidak ditemukan dalam token",
      });
    }

    // 🔒 Cegah role owner membuat booking
    if (user.role === "owner") {
      return response.status(403).json({
        status: false,
        message: "Owner tidak dapat melakukan booking kos.",
      });
    }

    // Ambil data dari body (userId tidak diambil dari body lagi)
    const { startDate, endDate, kosId, status } = request.body;

    // ✅ Validasi kos ada atau tidak
    const kos = await prisma.kos.findUnique({
      where: { id: Number(kosId) },
    });
    if (!kos) {
      return response.status(404).json({
        status: false,
        message: `Kos dengan id ${kosId} tidak ditemukan.`,
      });
    }

    // ✅ Cek apakah user sudah punya booking pending untuk kos yang sama
    const existingBook = await prisma.book.findFirst({
      where: {
        userId: user.id,
        kosId: Number(kosId),
        status: "pending",
      },
    });

    if (existingBook) {
      return response.status(400).json({
        status: false,
        message: "Kamu sudah memiliki booking pending untuk kos ini.",
      });
    }

    // ✅ Buat booking baru
    const newBook = await prisma.book.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        kosId: Number(kosId),
        userId: user.id, // <-- diambil dari JWT
        status: status || Status.pending, // default pending
      },
    });

    return response.status(200).json({
      status: true,
      data: newBook,
      message: `Booking berhasil dibuat oleh ${user.name} untuk kos ${kos.name}`,
    });
  } catch (error: any) {
    console.error("❌ Error createBook:", error);
    return response.status(400).json({
      status: false,
      message: `Yaa create booking error: ${error.message}`,
    });
  }
};

export const updateBook = async (request: Request, response: Response) => {
    try {
        const { id } = request.params;
        const { startDate, endDate, status } = request.body;

        const findBook = await prisma.book.findUnique({ where: { id: Number(id) } });
        if (!findBook) {
            return response.status(404).json({
                status: false,
                message: "Booking tidak ditemukan"
            });
        }

        const updatedBook = await prisma.book.update({
            where: { id: Number(id) },
            data: {
                startDate: startDate ? new Date(startDate) : findBook.startDate,
                endDate: endDate ? new Date(endDate) : findBook.endDate,
                status: status || findBook.status
            }
        });

        return response.json({
            status: true,
            message: "Booking berhasil diupdate",
            data: updatedBook
        });

    } catch (error) {
        return response.status(400).json({
            status: false,
            message: `Update booking error: ${error}`
        });
    }
};

export const deleteBook = async (request: Request, response: Response) => {
    try {
        const { id } = request.params
        const findBook = await prisma.book.findFirst({ where: { id: Number(id) } })
        if (!findBook) return response
            .status(200)
            .json({ status: false, message: 'Booking tidak ada' })

        const deleteBook = await prisma.book.delete({
            where: { id: Number(id) }
        })
        return response.json({
            status: true,
            data: deleteBook,
            message: 'Booking-nya bisa dihapus yaa'
        }).status(200)
    } catch (eror) {
        return response
            .json({
                status: false,
                message: `Yaa delete booking-nya error ${eror}`
            }).status(400)
    }
}