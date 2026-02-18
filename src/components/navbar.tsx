"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  ClipboardList,
  Users,
  LogIn,
  LogOut,
  Menu,
  X,
  Library,
  ScrollText,
} from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role;
  const isStaff = role === "ADMIN" || role === "LIBRARIAN";

  const navLinks = [
    { href: "/books", label: "Books", icon: BookOpen, show: true },
    { href: "/my-books", label: "My Books", icon: Library, show: !!session },
    { href: "/requests", label: "Requests", icon: ClipboardList, show: isStaff },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: isStaff },
    { href: "/audit", label: "Audit Log", icon: ScrollText, show: isStaff },
    { href: "/admin/users", label: "Users", icon: Users, show: role === "ADMIN" },
  ].filter((l) => l.show);

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
            <BookOpen className="h-6 w-6" />
            <span className="hidden sm:inline">BookTracker</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-700 transition-colors"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* User / Auth */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-700">{session.user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {session.user.role?.toLowerCase()}
                  </p>
                </div>
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-8 w-8 rounded-full ring-2 ring-primary-200"
                  />
                )}
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
