import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, badRequest } from "@/lib/rbac";

// GET /api/books — List books with search/filter
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const genre = searchParams.get("genre") || "";
  const status = searchParams.get("status") || "";
  const tag = searchParams.get("tag") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { isbn: { contains: search, mode: "insensitive" } },
    ];
  }

  if (genre) {
    where.genre = { equals: genre, mode: "insensitive" };
  }

  if (status) {
    where.status = status;
  }

  if (tag) {
    where.tags = { has: tag };
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.book.count({ where }),
  ]);

  return NextResponse.json({ books, total, page, totalPages: Math.ceil(total / limit) });
}

// POST /api/books — Create a book (ADMIN, LIBRARIAN)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) return forbidden();

  const body = await req.json();
  const { title, author, genre, tags, description, isbn, coverUrl, difficulty } = body;

  if (!title || !author) {
    return badRequest("Title and author are required");
  }

  const book = await prisma.book.create({
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

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      bookId: book.id,
      action: "BOOK_CREATED",
      details: `Created book: ${title} by ${author}`,
    },
  });

  return NextResponse.json(book, { status: 201 });
}
