import { Request, Response } from "express";
import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient({ errorFormat: "pretty" });

export const getAllBook = async (request: Request, response: Response) => {
  try {
    const { search, userId } = request.query;

    const parsedUserId = userId ? Number(userId) : null;
    const filters = parsedUserId
      ? { userId: parsedUserId }
      : search
      ? {
          OR: [
            { kos: { name: { contains: search.toString(), mode: "insensitive" } } },
            { user: { name: { contains: search.toString(), mode: "insensitive" } } },
          ],
        }
      : {};

    const allBooks = await prisma.book.findMany({
      where: filters,
      include: {
        kos: { select: { id: true, name: true, address: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return response.status(200).json({
      status: true,
      data: allBooks,
      message: "Daftar booking berhasil diambil",
    });
  } catch (error) {
    return response.status(400).json({
      status: false,
      message: `Terjadi kesalahan: ${error}`,
    });
  }
};



export const createBook = async (request: Request, response: Response) => {
  try {
    const user = (request as any).user;

    if (!user) {
      return response.status(401).json({
        status: false,
        message: "User tidak ditemukan dalam token",
      });
    }

    if (user.role !== "society") {
      return response.status(403).json({
        status: false,
        message: "Hanya society yang dapat melakukan booking kos.",
      });
    }

    const { startDate, endDate, kosId } = request.body;

    const kos = await prisma.kos.findUnique({ where: { id: Number(kosId) } });
    if (!kos) {
      return response.status(404).json({
        status: false,
        message: `Kos dengan id ${kosId} tidak ditemukan.`,
      });
    }

    // Cegah double booking pending
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

    const newBook = await prisma.book.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        kosId: Number(kosId),
        userId: user.id,
        status: Status.pending,
      },
    });

    return response.status(201).json({
      status: true,
      message: `Booking berhasil dibuat oleh ${user.name} untuk kos ${kos.name}`,
      data: newBook,
    });
  } catch (error: any) {
    return response.status(400).json({
      status: false,
      message: `Error membuat booking: ${error.message}`,
    });
  }
};

export const updateBook = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const { startDate, endDate, status } = request.body;
    const user = (request as any).user;

    const findBook = await prisma.book.findUnique({
      where: { id: Number(id) },
      include: { kos: true },
    });

    // 📌 Validasi booking ada atau tidak
    if (!findBook) {
      return response.status(404).json({
        status: false,
        message: "Booking tidak ditemukan.",
      });
    }

    if (user.role === "society") {
      // Pastikan booking milik user itu sendiri
      if (findBook.userId !== user.id) {
        return response.status(403).json({
          status: false,
          message: "Kamu tidak boleh mengedit booking milik orang lain.",
        });
      }

      // Society hanya bisa edit ketika masih pending
      if (findBook.status !== "pending") {
        return response.status(400).json({
          status: false,
          message: "Booking tidak dapat diubah karena sudah diproses oleh owner.",
        });
      }

      // Tidak boleh ubah status
      if (status && status !== findBook.status) {
        return response.status(403).json({
          status: false,
          message: "Kamu tidak diizinkan mengubah status booking.",
        });
      }

      // Update tanggal saja
      const updatedBook = await prisma.book.update({
        where: { id: Number(id) },
        data: {
          startDate: startDate ? new Date(startDate) : findBook.startDate,
          endDate: endDate ? new Date(endDate) : findBook.endDate,
        },
      });

      return response.status(200).json({
        status: true,
        role: user.role,
        message: "Tanggal booking berhasil diperbarui.",
        data: updatedBook,
      });
    }

    if (user.role === "owner") {
      // Pastikan owner adalah pemilik kos yang dipesan
      if (findBook.kos.userId !== user.id) {
        return response.status(403).json({
          status: false,
          message: "Kamu bukan pemilik kos dari booking ini.",
        });
      }

      // Owner hanya boleh ubah status (accept/reject)
      if (!status) {
        return response.status(400).json({
          status: false,
          message: "Parameter 'status' wajib diisi (accept/reject).",
        });
      }

      // Pastikan status valid
      const validStatus = ["pending", "accept", "reject"];
      if (!validStatus.includes(status)) {
        return response.status(400).json({
          status: false,
          message: "Status tidak valid. Gunakan: 'pending', 'accept', atau 'reject'.",
        });
      }

      const updatedBook = await prisma.book.update({
        where: { id: Number(id) },
        data: { status },
      });

      return response.status(200).json({
        status: true,
        role: user.role,
        message: `Status booking berhasil diubah menjadi '${status}'.`,
        data: updatedBook,
      });
    }

    return response.status(403).json({
      status: false,
      message: "Role kamu tidak diizinkan mengedit booking.",
    });

  } catch (error: any) {
    console.error("❌ Error updateBook:", error);
    return response.status(500).json({
      status: false,
      message: `Terjadi kesalahan saat mengubah booking: ${error.message}`,
    });
  }
};

export const deleteBook = async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const user = (request as any).user;

    const findBook = await prisma.book.findUnique({ where: { id: Number(id) } });
    if (!findBook) {
      return response.status(404).json({
        status: false,
        message: "Booking tidak ditemukan",
      });
    }

    if (findBook.userId !== user.id || user.role !== "society") {
      return response.status(403).json({
        status: false,
        message: "Kamu tidak memiliki izin menghapus booking ini",
      });
    }

    if (findBook.status !== "pending") {
      return response.status(400).json({
        status: false,
        message: "Booking tidak bisa dihapus karena sudah diproses oleh owner",
      });
    }

    await prisma.book.delete({ where: { id: Number(id) } });

    return response.status(200).json({
      status: true,
      message: "Booking berhasil dihapus",
    });
  } catch (error) {
    return response.status(400).json({
      status: false,
      message: `Error menghapus booking: ${error}`,
    });
  }
};

export const getBookHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { month, year } = req.query;

    if (!user || user.role !== "owner") {
      return res.status(403).json({
        status: false,
        message: "Hanya owner yang dapat melihat histori booking",
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        status: false,
        message:
          "Parameter 'month' dan 'year' wajib disertakan. Contoh: /book/history?month=10&year=2025",
      });
    }

    const ownerKos = await prisma.kos.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    if (ownerKos.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Anda belum memiliki kos.",
      });
    }

    const kosIds = ownerKos.map((k) => k.id);
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const bookings = await prisma.book.findMany({
      where: {
        kosId: { in: kosIds },
        startDate: { gte: startDate, lte: endDate },
      },
      include: {
        kos: { select: { id: true, name: true, address: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { startDate: "desc" },
    });

    if (bookings.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ada transaksi untuk bulan tersebut",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Histori booking berhasil diambil",
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Terjadi kesalahan server: ${error}`,
    });
  }
};

// GET /book/:id/receipt
export const getBookReceipt = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const booking = await prisma.book.findUnique({
      where: { id: Number(id) },
      include: {
        kos: true,
        user: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking tidak ditemukan",
      });
    }

    // ✅ Pastikan booking milik user society yang login
    if (user.role !== "society" || booking.userId !== user.id) {
      return res.status(403).json({
        status: false,
        message: "Kamu tidak memiliki akses ke nota ini",
      });
    }

    if (booking.status !== "accept") {
      return res.status(400).json({
        status: false,
        message: "Nota hanya bisa dicetak jika booking sudah diterima oleh owner",
      });
    }

    const receipt = {
      namaPenyewa: booking.user.name,
      namaKos: booking.kos.name,
      alamatKos: booking.kos.address,
      tanggalBooking: `${booking.startDate.toLocaleDateString()} - ${booking.endDate.toLocaleDateString()}`,
      hargaPerBulan: booking.kos.pricePerMonth,
      totalBayar: booking.kos.pricePerMonth,
      status: booking.status,
      tanggalCetak: new Date().toLocaleDateString(),
    };

    return res.status(200).json({
      status: true,
      message: "Nota berhasil diambil",
      data: receipt,
    });

    // 🔜 nanti bisa ditambah generate PDF pakai `pdfkit` / `reportlab`
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Error saat mencetak nota: ${error}`,
    });
  }
};