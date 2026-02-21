import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";
import type { Role } from "@prisma/client";

const isDev = process.env.NODE_ENV === "development";

// Dev users for local testing (no Google OAuth needed)
const DEV_USERS = [
  { id: "dev-admin", name: "Dev Admin", email: "admin@dev.local", role: "ADMIN" as Role },
  { id: "dev-librarian", name: "Dev Librarian", email: "librarian@dev.local", role: "LIBRARIAN" as Role },
  { id: "dev-member", name: "Dev Member", email: "member@dev.local", role: "MEMBER" as Role },
];

function buildProviders() {
  const providers: any[] = [];

  // Always add Google if configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  }

  // Add dev credentials provider in development
  if (isDev) {
    providers.push(
      CredentialsProvider({
        id: "dev-login",
        name: "Dev Login",
        credentials: {
          email: { label: "Email", type: "text" },
        },
        async authorize(credentials) {
          const devUser = DEV_USERS.find((u) => u.email === credentials?.email);
          if (!devUser) return null;

          // Upsert the dev user in DB
          const user = await prisma.user.upsert({
            where: { email: devUser.email },
            update: { role: devUser.role },
            create: {
              id: devUser.id,
              email: devUser.email,
              name: devUser.name,
              role: devUser.role,
            },
          });

          return { id: user.id, name: user.name, email: user.email, role: user.role };
        },
      })
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  // Only use PrismaAdapter when NOT using credentials (JWT)
  // The adapter is incompatible with the "jwt" session strategy for credentials
  ...(isDev ? {} : { adapter: PrismaAdapter(prisma) }),
  providers: buildProviders(),
  callbacks: {
    async signIn({ user }) {
      // Auto-assign ADMIN role to the email in ADMIN_EMAIL env var
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && user.email === adminEmail) {
        const existingUser = await prisma.user.findUnique({
          where: { email: adminEmail },
        });
        if (existingUser && existingUser.role === "MEMBER") {
          await prisma.user.update({
            where: { email: adminEmail },
            data: { role: "ADMIN" },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      // Refresh role from DB on each request in dev mode
      if (isDev && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token, user }) {
      if (isDev) {
        // JWT mode (dev with credentials)
        if (session.user && token) {
          session.user.id = token.id as string;
          session.user.role = token.role as Role;
        }
      } else {
        // Database mode (production with Google)
        if (session.user && user) {
          session.user.id = user.id;
          session.user.role = (user as unknown as { role: Role }).role;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: isDev ? "jwt" : "database",
  },
};
