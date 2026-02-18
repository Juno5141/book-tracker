import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role as Role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Wraps an API handler with auth and role checks.
 */
export function withAuth(
  handler: (req: Request, session: any) => Promise<Response>,
  ...roles: Role[]
) {
  return async (req: Request) => {
    const session = await getSession();
    if (!session?.user) return unauthorized();
    if (roles.length > 0 && !roles.includes(session.user.role as Role)) {
      return forbidden();
    }
    return handler(req, session);
  };
}
