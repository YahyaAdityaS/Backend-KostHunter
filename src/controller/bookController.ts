import { Request, Response } from "express";
import { PrismaClient, Status } from "@prisma/client";
import PDFDocument, { moveDown } from "pdfkit"
import fs from "fs";
import path from "path";

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

    if (new Date(startDate) > new Date(endDate)) {
      return response.status(400).json({
        status: false,
        message: "Tanggal mulai tidak boleh setelah tanggal berakhir.",
      });}

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

    // Validasi booking ada atau tidak
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

      if (new Date(startDate) > new Date(endDate)) {
      return response.status(400).json({
        status: false,
        message: "Tanggal mulai tidak boleh setelah tanggal berakhir.",
      });}

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

      // 🔥 Ambil data kos terlebih dahulu
      const kos = await prisma.kos.findUnique({
        where: { id: findBook.kosId },
      });

      // 🛑 Tambahkan validasi untuk hindari 'possibly null'
      if (!kos) {
        return response.status(404).json({
          status: false,
          message: "Kos terkait tidak ditemukan.",
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

      await prisma.kos.update({
          where: { id: kos.id },
          data: { roomAvailable: kos.roomAvailable - 1 },
        });

      const updatedBook = await prisma.book.update({
        where: { id: Number(id) },
        data: { status },
      });

      return response.status(200).json({
        status: true,
        role: user.role,
        message: `Status booking berhasil diubah menjadi '${status}'`,
        data: updatedBook,
      });
    }

    return response.status(403).json({
      status: false,
      message: "Role kamu tidak diizinkan mengedit booking.",
    });

  } catch (error: any) {
    console.error("Error updateBook:", error);
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

    if (!month || !year) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'month' dan 'year' wajib disertakan. Contoh: /book/history?month=10&year=2025",
      });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    let bookings;

    // 🔹 Cek role
    if (user.role === "owner") {
      // Owner → lihat semua booking di kos miliknya
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

      bookings = await prisma.book.findMany({
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

    } else if (user.role === "society") {
      // Society → lihat booking miliknya sendiri
      bookings = await prisma.book.findMany({
        where: {
          userId: user.id,
          startDate: { gte: startDate, lte: endDate },
        },
        include: {
          kos: { select: { id: true, name: true, address: true } },
        },
        orderBy: { startDate: "desc" },
      });
    } else {
      return res.status(403).json({
        status: false,
        message: "Role tidak dikenali.",
      });
    }

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ada histori booking untuk bulan tersebut.",
      });
    }

    return res.status(200).json({
      status: true,
      role: user.role,
      total: bookings.length,
      data: bookings,
    });

  } catch (error) {
    console.error("❌ Error getBookHistory:", error);
    return res.status(500).json({
      status: false,
      message: `Terjadi kesalahan server: ${error}`,
    });
  }
};

export const getBookReceipt = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { download } = req.query; // <== tambahan query untuk mode download

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
      tanggalBooking: `${booking.startDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })} - ${booking.endDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      hargaPerBulan: booking.kos.pricePerMonth,
      totalBayar: booking.kos.pricePerMonth,
      status: booking.status,
      tanggalCetak: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    };

    // 🧾 Jika tidak download, kirim JSON
    if (!download) {
      return res.status(200).json({
        status: true,
        message: "Nota berhasil diambil",
        data: receipt,
      });
    }

    // 📄 Kalau ada query ?download=true → buat PDF
    const doc = new PDFDocument({ margin: 50 });
    doc.font("Courier");

    const folderPath = path.join(__dirname, "../../public/kos_receipt");
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const filePath = path.join(folderPath, `nota_booking_${booking.id}.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🔹 Header
    doc.fontSize(18).text("NOTA PEMESANAN KOS", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12);

    // Fungsi bantu untuk sejajarkan teks
    const addRow = (label: string, value: string | number) => {
      const spacing = 130; // Lebar kolom label (sesuaikan)
      const y = doc.y; // posisi vertikal sekarang
      doc.text(`${label}`, 50, y);
      doc.text(": ", 50 + spacing - 5, y);
      doc.text(String(value), 50 + spacing + 5, y);
      doc.moveDown();
    };

    // 🔹 Isi Nota
    addRow("Nama Penyewa", receipt.namaPenyewa);
    addRow("Nama Kos", receipt.namaKos);
    addRow("Alamat Kos", receipt.alamatKos);
    addRow("Tanggal Booking", receipt.tanggalBooking);
    addRow("Harga per Bulan", `Rp${receipt.hargaPerBulan.toLocaleString("id-ID")}`);
    addRow("Total Bayar", `Rp${receipt.totalBayar.toLocaleString("id-ID")}`);
    addRow("Status", receipt.status);
    addRow("Tanggal Cetak", receipt.tanggalCetak);

    doc.moveDown(4);
    doc.text("=================================================", { align: "left" });
    doc.text("Terima kasih telah menggunakan layanan KosHunter!", {
      align: "left",
    });

    doc.end();

    // Setelah PDF selesai dibuat, kirim file ke user
    stream.on("finish", () => {
      res.download(filePath, `nota_booking_${booking.id}.pdf`, (err) => {
        if (err) console.error("Gagal mengunduh file:", err);
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Error saat mencetak nota: ${error}`,
    });
  }
}