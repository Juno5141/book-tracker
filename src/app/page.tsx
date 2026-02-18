import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { BookOpen, Search, Users, Sparkles } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          AI-Powered Library Management
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Your Books, <span className="text-primary-600">Organized</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Track your library, manage borrows, and discover books with AI-powered
          metadata enrichment. Simple, fast, and collaborative.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            Browse Books
          </Link>
          {!session && (
            <Link
              href="/api/auth/signin"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Sign in to get started
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: BookOpen,
            title: "Manage Your Library",
            description:
              "Add books with rich metadata — title, author, genre, tags, ISBN, and cover images. Edit and organize effortlessly.",
          },
          {
            icon: Search,
            title: "Smart Search & Filters",
            description:
              "Find any book instantly. Filter by title, author, genre, tags, or availability status.",
          },
          {
            icon: Sparkles,
            title: "AI Metadata Enrichment",
            description:
              "Automatically generate synopses, tags, genres, and reading difficulty with one click using AI.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 text-primary-600 mb-4">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Roles info */}
      <section className="bg-white rounded-xl p-8 shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary-600" />
          Role-Based Access
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              role: "Member",
              color: "bg-gray-100 text-gray-700",
              perks: ["Browse & search books", "Request to borrow", "View personal reading history"],
            },
            {
              role: "Librarian",
              color: "bg-blue-100 text-blue-700",
              perks: ["All member features", "Add & edit books", "Approve/deny borrow requests", "Process check-ins/outs", "View overdue dashboard"],
            },
            {
              role: "Admin",
              color: "bg-red-100 text-red-700",
              perks: ["All librarian features", "Manage user roles", "Delete books", "Full audit log access"],
            },
          ].map((r) => (
            <div key={r.role} className="space-y-3">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${r.color}`}>
                {r.role}
              </span>
              <ul className="space-y-1.5">
                {r.perks.map((p) => (
                  <li key={p} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
