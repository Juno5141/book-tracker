"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BookOpen, Plus, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/states";

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  tags: string[];
  description: string | null;
  isbn: string | null;
  coverUrl: string | null;
  difficulty: string | null;
  status: string;
  createdAt: string;
}

export default function BooksPage() {
  const { data: session } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "LIBRARIAN";

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (genreFilter) params.set("genre", genreFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/books?${params}`);
      if (!res.ok) throw new Error("Failed to fetch books");
      const data = await res.json();
      setBooks(data.books);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, genreFilter, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(fetchBooks, 300);
    return () => clearTimeout(timer);
  }, [fetchBooks]);

  const clearFilters = () => {
    setSearch("");
    setGenreFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const hasFilters = search || genreFilter || statusFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Books</h1>
          <p className="text-gray-600">Browse and search the library catalog</p>
        </div>
        {isStaff && (
          <Link href="/books/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </Link>
        )}
      </div>

      {/* Guest CTA */}
      {!session && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary-500" />
            <div>
              <p className="font-medium text-gray-900">Want to borrow a book?</p>
              <p className="text-sm text-gray-600">Sign in to request checkouts and track your reading</p>
            </div>
          </div>
          <Link href="/auth/signin">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={genreFilter}
              onChange={(e) => { setGenreFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">All Genres</option>
              <option value="Fiction">Fiction</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Science Fiction">Science Fiction</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Mystery">Mystery</option>
              <option value="Biography">Biography</option>
              <option value="Self-Help">Self-Help</option>
              <option value="History">History</option>
              <option value="Science">Science</option>
              <option value="Technology">Technology</option>
            </select>
            {session && (
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="REQUESTED">Requested</option>
                <option value="CHECKED_OUT">Checked Out</option>
              </select>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <LoadingSpinner message="Loading books..." />
      ) : error ? (
        <ErrorState message={error} retry={fetchBooks} />
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books found"
          description={hasFilters ? "Try adjusting your search or filters" : "The library is empty. Add some books to get started!"}
          action={
            isStaff ? (
              <Link href="/books/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                {/* Cover */}
                <div className="aspect-[3/2] bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-primary-400" />
                  )}
                </div>
                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {book.title}
                    </h3>
                    {session && book.status && <StatusBadge status={book.status} />}
                  </div>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  {book.genre && (
                    <Badge variant="info">{book.genre}</Badge>
                  )}
                  {book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="default">{tag}</Badge>
                      ))}
                      {book.tags.length > 3 && (
                        <Badge variant="default">+{book.tags.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
