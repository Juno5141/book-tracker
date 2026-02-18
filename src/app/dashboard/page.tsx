"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/states";
import { formatDate, daysUntilDue } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [returning, setReturning] = useState<string | null>(null);

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "LIBRARIAN";

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/overdue");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      setData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReturn = async (checkoutId: string) => {
    setReturning(checkoutId);
    try {
      const res = await fetch(`/api/checkouts/${checkoutId}/return`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReturning(null);
    }
  };

  if (!isStaff) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access restricted to librarians and admins.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} retry={fetchData} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary-600" />
          Dashboard
        </h1>
        <p className="text-gray-600">Library overview and overdue management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium text-gray-500">Total Books</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data?.totalBooks || 0}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500">Available</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{data?.availableBooks || 0}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Checked Out</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{data?.totalCheckedOut || 0}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className={`h-5 w-5 ${data?.overdueCount > 0 ? "text-red-600" : "text-gray-400"}`} />
            <span className="text-sm font-medium text-gray-500">Overdue</span>
          </div>
          <p className={`text-3xl font-bold ${data?.overdueCount > 0 ? "text-red-600" : "text-gray-400"}`}>
            {data?.overdueCount || 0}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/requests">
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            {data?.pendingRequests || 0} Pending Requests
          </Button>
        </Link>
        <Link href="/books/new">
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </Link>
      </div>

      {/* Overdue List */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Overdue Books
            {data?.overdueCount > 0 && (
              <Badge variant="danger">{data.overdueCount}</Badge>
            )}
          </h2>
        </div>

        {data?.overdueCheckouts?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <p className="font-medium">No overdue books!</p>
            <p className="text-sm">All borrowed books are within their due dates.</p>
          </div>
        ) : (
          <div className="divide-y">
            {data?.overdueCheckouts?.map((co: any) => {
              const days = Math.abs(daysUntilDue(co.dueDate));
              return (
                <div key={co.id} className="p-4 flex items-center gap-4 hover:bg-red-50/50">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/books/${co.book.id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {co.book.title}
                    </Link>
                    <p className="text-sm text-gray-600">{co.book.author}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>Borrower: {co.user?.name || co.user?.email}</span>
                      <span>Due: {formatDate(co.dueDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="danger">
                      {days} day{days !== 1 ? "s" : ""} overdue
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReturn(co.id)}
                      loading={returning === co.id}
                    >
                      Process Return
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
