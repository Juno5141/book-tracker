"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Edit,
  Trash2,
  Sparkles,
  Clock,
  User,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/states";
import { formatDate, isOverdue } from "@/lib/utils";

export default function BookDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const role = session?.user?.role;
  const isStaff = role === "ADMIN" || role === "LIBRARIAN";
  const isAdmin = role === "ADMIN";

  const fetchBook = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}`);
      if (!res.ok) throw new Error("Book not found");
      setBook(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [bookId]);

  const handleEnrich = async () => {
    setEnriching(true);
    setMessage("");
    try {
      const res = await fetch(`/api/books/${bookId}/enrich`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBook(data.book);
      setMessage("✨ AI enrichment complete!");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setEnriching(false);
    }
  };

  const handleRequest = async () => {
    setRequesting(true);
    setMessage("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("📚 Borrow request submitted! A librarian will review it.");
      fetchBook();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setRequesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      router.push("/books");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading book details..." />;
  if (error) return <ErrorState message={error} retry={fetchBook} />;
  if (!book) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/books"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Books
      </Link>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm ${
            message.startsWith("Error")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Book Detail Card */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Cover */}
          <div className="md:w-1/3 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center min-h-[250px]">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="h-20 w-20 text-primary-400" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
                <p className="text-lg text-gray-600">{book.author}</p>
              </div>
              <StatusBadge status={book.status} />
            </div>

            {book.description && (
              <p className="text-gray-700 text-sm leading-relaxed">{book.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {book.genre && <Badge variant="info">{book.genre}</Badge>}
              {book.difficulty && <Badge variant="warning">{book.difficulty}</Badge>}
              {book.tags?.map((tag: string) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>

            {book.isbn && (
              <p className="text-sm text-gray-500">
                <span className="font-medium">ISBN:</span> {book.isbn}
              </p>
            )}

            <p className="text-sm text-gray-500">
              <span className="font-medium">Added:</span> {formatDate(book.createdAt)}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {session && book.status === "AVAILABLE" && (
                <Button onClick={handleRequest} loading={requesting} variant="primary">
                  📚 Request to Borrow
                </Button>
              )}
              {isStaff && (
                <>
                  <Link href={`/books/${bookId}/edit`}>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </Link>
                  <Button onClick={handleEnrich} loading={enriching} variant="outline">
                    <Sparkles className="h-4 w-4 mr-1" /> AI Enrich
                  </Button>
                </>
              )}
              {isAdmin && (
                <Button onClick={handleDelete} loading={deleting} variant="danger">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Checkouts */}
      {book.checkouts && book.checkouts.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            Checkout History
          </h2>
          <div className="space-y-3">
            {book.checkouts.map((co: any) => (
              <div
                key={co.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  !co.returnedAt && isOverdue(co.dueDate)
                    ? "border-red-200 bg-red-50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {co.user?.name || co.user?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Checked out: {formatDate(co.checkedOutAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {co.returnedAt ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Returned {formatDate(co.returnedAt)}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {formatDate(co.dueDate)}
                      </p>
                      {isOverdue(co.dueDate) && (
                        <Badge variant="danger">Overdue</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {isStaff && book.borrowRequests && book.borrowRequests.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Borrow Requests
          </h2>
          <div className="space-y-2">
            {book.borrowRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-medium">{req.user?.name || req.user?.email}</p>
                  <p className="text-xs text-gray-500">Requested: {formatDate(req.requestedAt)}</p>
                </div>
                <Link href="/requests">
                  <Button size="sm" variant="outline">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
