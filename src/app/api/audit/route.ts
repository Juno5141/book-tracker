import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized } from "@/lib/rbac";

// GET /api/audit — Audit log
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      book: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
