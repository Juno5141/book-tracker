"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/states";

export default function EditBookPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "LIBRARIAN";

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${bookId}`);
        if (!res.ok) throw new Error("Book not found");
        const book = await res.json();
        setForm({
          title: book.title || "",
          author: book.author || "",
          genre: book.genre || "",
          tags: (book.tags || []).join(", "),
          description: book.description || "",
          isbn: book.isbn || "",
          coverUrl: book.coverUrl || "",
          difficulty: book.difficulty || "",
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId]);

  if (!isStaff) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">You don&apos;t have permission to edit books.</p>
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
      const res = await fetch(`/api/books/${bookId}`, {
        method: "PUT",
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
      router.push(`/books/${bookId}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    setMessage("");

    try {
      // Save first
      const saveRes = await fetch(`/api/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (!saveRes.ok) {
        const data = await saveRes.json();
        throw new Error(data.error);
      }

      // Enrich
      const res = await fetch(`/api/books/${bookId}/enrich`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh form with enriched data
      const book = data.book;
      setForm({
        title: book.title || "",
        author: book.author || "",
        genre: book.genre || "",
        tags: (book.tags || []).join(", "),
        description: book.description || "",
        isbn: book.isbn || "",
        coverUrl: book.coverUrl || "",
        difficulty: book.difficulty || "",
      });
      setMessage("✨ AI enrichment applied! Review and save.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnriching(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading book..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/books/${bookId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Book
      </Link>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Book</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Title *"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <Input
              label="Author *"
              name="author"
              value={form.author}
              onChange={handleChange}
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
            />
          </div>

          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="ISBN" name="isbn" value={form.isbn} onChange={handleChange} />
            <Input
              label="Cover URL"
              name="coverUrl"
              value={form.coverUrl}
              onChange={handleChange}
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
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleEnrich}
              loading={enriching}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Enrich
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
