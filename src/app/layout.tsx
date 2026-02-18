import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Book Tracker — Mini Library Management",
  description: "Track, borrow, and manage your library with AI-powered features",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
              {children}
            </main>
            <footer className="border-t bg-white py-4 text-center text-sm text-gray-500">
              Book Tracker © {new Date().getFullYear()} — Mini Library Management
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
