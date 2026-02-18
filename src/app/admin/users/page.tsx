"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/badge";
import { LoadingSpinner, ErrorState } from "@/components/ui/states";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      setUsers(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId: string, role: string) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access restricted to administrators.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading users..." />;
  if (error) return <ErrorState message={error} retry={fetchUsers} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary-600" />
          User Management
        </h1>
        <p className="text-gray-600">Manage user roles and permissions</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Activity
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Joined
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {(user.name || user.email)?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user._count.checkouts} checkouts, {user._count.borrowRequests} requests
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  {user.id === session.user.id ? (
                    <span className="text-xs text-gray-400">You</span>
                  ) : (
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      disabled={updating === user.id}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="LIBRARIAN">Librarian</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
