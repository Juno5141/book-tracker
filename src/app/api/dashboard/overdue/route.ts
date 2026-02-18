import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden } from "@/lib/rbac";

// GET /api/dashboard/overdue — Overdue books info
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) return forbidden();

  const now = new Date();

  const overdueCheckouts = await prisma.checkout.findMany({
    where: {
      returnedAt: null,
      dueDate: { lt: now },
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      book: { select: { id: true, title: true, author: true, coverUrl: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const totalCheckedOut = await prisma.checkout.count({
    where: { returnedAt: null },
  });

  const pendingRequests = await prisma.borrowRequest.count({
    where: { status: "PENDING" },
  });

  const totalBooks = await prisma.book.count();

  const availableBooks = await prisma.book.count({
    where: { status: "AVAILABLE" },
  });

  return NextResponse.json({
    overdueCheckouts,
    overdueCount: overdueCheckouts.length,
    totalCheckedOut,
    pendingRequests,
    totalBooks,
    availableBooks,
  });
}
