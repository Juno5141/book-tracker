"use client";

import { signIn } from "next-auth/react";
import { BookOpen, Shield, BookMarked, User } from "lucide-react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDevLogin = async (email: string) => {
    setLoading(email);
    await signIn("dev-login", { email, callbackUrl: "/books" });
  };

  const isDev = process.env.NODE_ENV === "development" || 
    typeof window !== "undefined" && window.location.hostname === "localhost";

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-6">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to BookTracker</h1>
        <p className="text-gray-600 mb-8">Sign in to manage your library and track borrows</p>

        <button
          onClick={() => { setLoading("google"); signIn("google", { callbackUrl: "/books" }); }}
          disabled={loading === "google"}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Dev Login - only shown in development */}
        {isDev && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Dev Login (local only)</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleDevLogin("admin@dev.local")}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-red-200 rounded-lg text-gray-700 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Shield className="h-5 w-5 text-red-500" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Admin</div>
                  <div className="text-xs text-gray-500">Full access — manage users, books, everything</div>
                </div>
              </button>

              <button
                onClick={() => handleDevLogin("librarian@dev.local")}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-blue-200 rounded-lg text-gray-700 font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <BookMarked className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Librarian</div>
                  <div className="text-xs text-gray-500">Manage books, approve requests, check-in/out</div>
                </div>
              </button>

              <button
                onClick={() => handleDevLogin("member@dev.local")}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <User className="h-5 w-5 text-gray-500" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Member</div>
                  <div className="text-xs text-gray-500">Browse, search, request borrows</div>
                </div>
              </button>
            </div>
          </>
        )}

        <p className="mt-6 text-xs text-gray-500">
          By signing in, you agree to our terms of service.
          <br />
          New users are assigned the Member role by default.
        </p>
      </div>
    </div>
  );
}
