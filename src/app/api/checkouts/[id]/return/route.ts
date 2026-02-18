import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, badRequest } from "@/lib/rbac";

// POST /api/checkouts/[id]/return — Return a book (ADMIN, LIBRARIAN)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) return forbidden();

  const checkout = await prisma.checkout.findUnique({
    where: { id: params.id },
    include: { book: true },
  });

  if (!checkout) return badRequest("Checkout not found");
  if (checkout.returnedAt) return badRequest("Book already returned");

  // Mark returned
  const updated = await prisma.checkout.update({
    where: { id: params.id },
    data: { returnedAt: new Date() },
  });

  // Update book status to AVAILABLE
  await prisma.book.update({
    where: { id: checkout.bookId },
    data: { status: "AVAILABLE" },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      bookId: checkout.bookId,
      action: "RETURNED",
      details: `Returned: ${checkout.book.title}`,
    },
  });

  return NextResponse.json(updated);
}
