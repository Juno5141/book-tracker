import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, badRequest } from "@/lib/rbac";

// GET /api/requests — List borrow requests
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = {};

  // Members can only see their own requests
  if (session.user.role === "MEMBER") {
    where.userId = session.user.id;
  }

  if (status) {
    where.status = status;
  }

  const requests = await prisma.borrowRequest.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      book: { select: { id: true, title: true, author: true, coverUrl: true, status: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json(requests);
}

// POST /api/requests — Create a borrow request (MEMBER)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const { bookId } = await req.json();
  if (!bookId) return badRequest("bookId is required");

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return badRequest("Book not found");
  if (book.status !== "AVAILABLE") {
    return badRequest("Book is not available for borrowing");
  }

  // Check if user already has a pending request for this book
  const existingRequest = await prisma.borrowRequest.findFirst({
    where: {
      userId: session.user.id,
      bookId,
      status: "PENDING",
    },
  });
  if (existingRequest) {
    return badRequest("You already have a pending request for this book");
  }

  // Check if user already has this book checked out
  const existingCheckout = await prisma.checkout.findFirst({
    where: {
      userId: session.user.id,
      bookId,
      returnedAt: null,
    },
  });
  if (existingCheckout) {
    return badRequest("You already have this book checked out");
  }

  const request = await prisma.borrowRequest.create({
    data: {
      userId: session.user.id,
      bookId,
    },
    include: {
      book: { select: { id: true, title: true, author: true } },
    },
  });

  // Update book status to REQUESTED
  await prisma.book.update({
    where: { id: bookId },
    data: { status: "REQUESTED" },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      bookId,
      action: "BORROW_REQUESTED",
      details: `Requested to borrow: ${book.title}`,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
