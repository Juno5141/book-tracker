"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ScrollText, BookOpen, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/states";
import { formatDate } from "@/lib/utils";

const actionLabels: Record<string, { label: string; color: string }> = {
  BOOK_CREATED: { label: "Book Created", color: "bg-green-100 text-green-700" },
  BOOK_UPDATED: { label: "Book Updated", color: "bg-blue-100 text-blue-700" },
  BOOK_DELETED: { label: "Book Deleted", color: "bg-red-100 text-red-700" },
  BORROW_REQUESTED: { label: "Borrow Requested", color: "bg-yellow-100 text-yellow-700" },
  BORROW_APPROVED: { label: "Borrow Approved", color: "bg-green-100 text-green-700" },
  BORROW_DENIED: { label: "Borrow Denied", color: "bg-red-100 text-red-700" },
  CHECKED_OUT: { label: "Checked Out", color: "bg-blue-100 text-blue-700" },
  RETURNED: { label: "Returned", color: "bg-green-100 text-green-700" },
  ROLE_CHANGED: { label: "Role Changed", color: "bg-purple-100 text-purple-700" },
  AI_ENRICHED: { label: "AI Enriched", color: "bg-indigo-100 text-indigo-700" },
};

export default function AuditPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "LIBRARIAN";

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/audit?limit=100");
        if (!res.ok) throw new Error("Failed to fetch audit logs");
        setLogs(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (!isStaff) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access restricted to staff.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading audit logs..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary-600" />
          Audit Log
        </h1>
        <p className="text-gray-600">Complete history of actions in the library</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit logs yet" />
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="divide-y">
            {logs.map((log) => {
              const action = actionLabels[log.action] || {
                label: log.action,
                color: "bg-gray-100 text-gray-700",
              };
              return (
                <div key={log.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${action.color}`}
                      >
                        {action.label}
                      </span>
                      {log.book && (
                        <Link
                          href={`/books/${log.book.id}`}
                          className="text-sm text-primary-600 hover:underline truncate"
                        >
                          {log.book.title}
                        </Link>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-sm text-gray-600 truncate">{log.details}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.user?.name || log.user?.email}
                    </div>
                    <div>{formatDate(log.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
