"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export default function NewBookPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: "",
    tags: "",
    description: "",
    isbn: "",
    coverUrl: "",
    difficulty: "",
  });
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState("");

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "LIBRARIAN";

  if (!isStaff) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">You don&apos;t have permission to add books.</p>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/books/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleEnrich = async () => {
    if (!form.title || !form.author) {
      setError("Enter title and author first to use AI enrichment");
      return;
    }

    setEnriching(true);
    setError("");

    try {
      // Save the book first, then enrich
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const book = await res.json();
      if (!res.ok) throw new Error(book.error);

      // Now enrich
      const enrichRes = await fetch(`/api/books/${book.id}/enrich`, {
        method: "POST",
      });
      const enrichData = await enrichRes.json();
      if (!enrichRes.ok) throw new Error(enrichData.error);

      router.push(`/books/${book.id}`);
    } catch (err: any) {
      setError(err.message);
      setEnriching(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/books"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Books
      </Link>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Book</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Title *"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Book title"
              required
            />
            <Input
              label="Author *"
              name="author"
              value={form.author}
              onChange={handleChange}
              placeholder="Author name"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
              <select
                name="genre"
                value={form.genre}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Select genre</option>
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
                <option value="Romance">Romance</option>
                <option value="Horror">Horror</option>
                <option value="Poetry">Poetry</option>
              </select>
            </div>
            <Input
              label="Tags (comma-separated)"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g. classic, dystopian, must-read"
            />
          </div>

          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description or synopsis..."
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="ISBN (optional)"
              name="isbn"
              value={form.isbn}
              onChange={handleChange}
              placeholder="978-..."
            />
            <Input
              label="Cover URL (optional)"
              name="coverUrl"
              value={form.coverUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reading Difficulty
            </label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">Select difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" loading={saving}>
              Save Book
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleEnrich}
              loading={enriching}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Save & AI Enrich
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
