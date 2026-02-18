import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, badRequest } from "@/lib/rbac";
import { addDays } from "date-fns";

// PUT /api/requests/[id] — Approve or deny a request (ADMIN, LIBRARIAN)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) return forbidden();

  const { action, dueDays } = await req.json();
  if (!["approve", "deny"].includes(action)) {
    return badRequest("Invalid action. Must be 'approve' or 'deny'");
  }

  const request = await prisma.borrowRequest.findUnique({
    where: { id: params.id },
    include: { book: true },
  });

  if (!request) return badRequest("Request not found");
  if (request.status !== "PENDING") {
    return badRequest("Request is already resolved");
  }

  if (action === "approve") {
    const dueDate = addDays(new Date(), dueDays || 14);

    // Update request
    const updated = await prisma.borrowRequest.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        resolvedAt: new Date(),
        resolvedById: session.user.id,
        dueDate,
      },
    });

    // Create checkout
    await prisma.checkout.create({
      data: {
        userId: request.userId,
        bookId: request.bookId,
        borrowRequestId: request.id,
        dueDate,
      },
    });

    // Update book status
    await prisma.book.update({
      where: { id: request.bookId },
      data: { status: "CHECKED_OUT" },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        bookId: request.bookId,
        action: "BORROW_APPROVED",
        details: `Approved borrow for: ${request.book.title}. Due: ${dueDate.toISOString()}`,
      },
    });

    return NextResponse.json(updated);
  } else {
    // Deny
    const updated = await prisma.borrowRequest.update({
      where: { id: params.id },
      data: {
        status: "DENIED",
        resolvedAt: new Date(),
        resolvedById: session.user.id,
      },
    });

    // Check if there are other pending requests for this book
    const otherPending = await prisma.borrowRequest.count({
      where: { bookId: request.bookId, status: "PENDING" },
    });

    if (otherPending === 0) {
      await prisma.book.update({
        where: { id: request.bookId },
        data: { status: "AVAILABLE" },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        bookId: request.bookId,
        action: "BORROW_DENIED",
        details: `Denied borrow for: ${request.book.title}`,
      },
    });

    return NextResponse.json(updated);
  }
}
