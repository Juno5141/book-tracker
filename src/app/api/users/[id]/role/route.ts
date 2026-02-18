import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, badRequest } from "@/lib/rbac";

// PUT /api/users/[id]/role — Change user role (ADMIN only)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const { role } = await req.json();
  if (!["ADMIN", "LIBRARIAN", "MEMBER"].includes(role)) {
    return badRequest("Invalid role");
  }

  // Prevent self-demotion
  if (params.id === session.user.id) {
    return badRequest("Cannot change your own role");
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ROLE_CHANGED",
      details: `Changed role of ${user.email} to ${role}`,
    },
  });

  return NextResponse.json(user);
}
