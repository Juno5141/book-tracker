"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Library, BookOpen, Clock, Calendar, CheckCircle } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/states";
import { formatDate, isOverdue, daysUntilDue } from "@/lib/utils";

export default function MyBooksPage() {
  const { data: session } = useSession();
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coRes, reqRes] = await Promise.all([
          fetch("/api/checkouts?active=true"),
          fetch("/api/requests"),
        ]);
        if (!coRes.ok || !reqRes.ok) throw new Error("Failed to fetch data");
        setCheckouts(await coRes.json());
        setRequests(await reqRes.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view your books.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading your books..." />;
  if (error) return <ErrorState message={error} />;

  const activeCheckouts = checkouts.filter((c) => !c.returnedAt);
  const overdueBooks = activeCheckouts.filter((c) => isOverdue(c.dueDate));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
        <p className="text-gray-600">Your active checkouts and borrow requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCheckouts.length}</p>
              <p className="text-sm text-gray-500">Currently Borrowed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter((r) => r.status === "PENDING").length}
              </p>
              <p className="text-sm text-gray-500">Pending Requests</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${overdueBooks.length > 0 ? "bg-red-100" : "bg-green-100"}`}>
              <Calendar className={`h-5 w-5 ${overdueBooks.length > 0 ? "text-red-600" : "text-green-600"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overdueBooks.length}</p>
              <p className="text-sm text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Checkouts */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Currently Borrowed</h2>
        {activeCheckouts.length === 0 ? (
          <EmptyState
            icon={Library}
            title="No active checkouts"
            description="Browse the library and request a book to borrow"
          />
        ) : (
          <div className="space-y-3">
            {activeCheckouts.map((co) => {
              const overdue = isOverdue(co.dueDate);
              const days = daysUntilDue(co.dueDate);
              return (
                <Link
                  key={co.id}
                  href={`/books/${co.book.id}`}
                  className={`block bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow ${
                    overdue ? "border-red-200" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{co.book.title}</h3>
                      <p className="text-sm text-gray-600">{co.book.author}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>Checked out: {formatDate(co.checkedOutAt)}</span>
                        <span>Due: {formatDate(co.dueDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {overdue ? (
                        <Badge variant="danger">
                          {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} overdue
                        </Badge>
                      ) : (
                        <Badge variant={days <= 3 ? "warning" : "success"}>
                          {days} day{days !== 1 ? "s" : ""} left
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending Requests */}
      {requests.filter((r) => r.status === "PENDING").length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h2>
          <div className="space-y-3">
            {requests
              .filter((r) => r.status === "PENDING")
              .map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between"
                >
                  <div>
                    <Link
                      href={`/books/${req.book.id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {req.book.title}
                    </Link>
                    <p className="text-sm text-gray-600">{req.book.author}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested: {formatDate(req.requestedAt)}
                    </p>
                  </div>
                  <StatusBadge status="PENDING" />
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
