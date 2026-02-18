import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden } from "@/lib/rbac";

// GET /api/checkouts — List checkouts
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active") === "true";
  const userId = searchParams.get("userId");

  const where: any = {};

  if (active) {
    where.returnedAt = null;
  }

  // Members can only see their own checkouts
  if (session.user.role === "MEMBER") {
    where.userId = session.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  const checkouts = await prisma.checkout.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      book: { select: { id: true, title: true, author: true, coverUrl: true } },
    },
    orderBy: { checkedOutAt: "desc" },
  });

  return NextResponse.json(checkouts);
}
