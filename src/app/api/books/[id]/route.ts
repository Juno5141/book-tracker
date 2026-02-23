import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, badRequest } from "@/lib/rbac";

// GET /api/books/[id] (public — limited data for guests)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const isAuthenticated = !!session?.user;

  const book = await prisma.book.findUnique({
    where: { id: params.id },
    include: isAuthenticated
      ? {
          checkouts: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { checkedOutAt: "desc" },
            take: 10,
          },
          borrowRequests: {
            where: { status: "PENDING" },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { requestedAt: "desc" },
          },
        }
      : undefined,
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json(book);
}

// PUT /api/books/[id] — Update (ADMIN, LIBRARIAN)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) return forbidden();

  const body = await req.json();
  const { title, author, genre, tags, description, isbn, coverUrl, difficulty } = body;

  if (!title || !author) {
    return badRequest("Title and author are required");
  }

  const book = await prisma.book.update({
    where: { id: params.id },
    data: {
      title,
      author,
      genre: genre || null,
      tags: tags || [],
      description: description || null,
      isbn: isbn || null,
      coverUrl: coverUrl || null,
      difficulty: difficulty || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      bookId: book.id,
      action: "BOOK_UPDATED",
      details: `Updated book: ${title} by ${author}`,
    },
  });

  return NextResponse.json(book);
}

// DELETE /api/books/[id] — Delete (ADMIN only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const book = await prisma.book.findUnique({ where: { id: params.id } });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      bookId: book.id,
      action: "BOOK_DELETED",
      details: `Deleted book: ${book.title} by ${book.author}`,
    },
  });

  await prisma.book.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
