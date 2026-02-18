"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ClipboardList, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/states";
import { formatDate } from "@/lib/utils";

export default function RequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("PENDING");
  const [processing, setProcessing] = useState<string | null>(null);

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "LIBRARIAN";

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/requests?${params}`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      setRequests(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleAction = async (id: string, action: "approve" | "deny") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, dueDays: 14 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isStaff ? "Borrow Requests" : "My Requests"}
        </h1>
        <p className="text-gray-600">
          {isStaff
            ? "Review and manage borrow requests"
            : "Track your borrow requests"}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {["PENDING", "APPROVED", "DENIED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === s
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading requests..." />
      ) : error ? (
        <ErrorState message={error} retry={fetchRequests} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests"
          description={`No ${filter.toLowerCase()} borrow requests found`}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4"
            >
              {/* Book info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/books/${req.book.id}`}
                    className="font-semibold text-gray-900 hover:text-primary-600 truncate"
                  >
                    {req.book.title}
                  </Link>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-sm text-gray-600">{req.book.author}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(req.requestedAt)}
                  </span>
                  {isStaff && (
                    <span>
                      By: {req.user?.name || req.user?.email}
                    </span>
                  )}
                  {req.resolvedBy && (
                    <span>
                      Resolved by: {req.resolvedBy.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions for staff */}
              {isStaff && req.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAction(req.id, "approve")}
                    loading={processing === req.id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleAction(req.id, "deny")}
                    loading={processing === req.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Deny
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
