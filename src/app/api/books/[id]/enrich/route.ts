import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden } from "@/lib/rbac";
import OpenAI from "openai";

// POST /api/books/[id]/enrich — AI-powered metadata enrichment
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) return forbidden();

  const book = await prisma.book.findUnique({ where: { id: params.id } });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured. Set OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a librarian AI. Given a book title and author, return a JSON object with:
- "synopsis": a 2-3 sentence summary of the book
- "tags": an array of 3-6 relevant keyword tags
- "genre": the primary genre (e.g., "Fiction", "Science Fiction", "Biography", "Self-Help")
- "difficulty": reading level ("Easy", "Moderate", "Advanced")
Return ONLY valid JSON, no markdown or extra text.`,
        },
        {
          role: "user",
          content: `Book: "${book.title}" by ${book.author}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Parse the JSON response, stripping any markdown fences
    const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
    const enriched = JSON.parse(cleaned);

    // Update book with enriched data
    const updatedBook = await prisma.book.update({
      where: { id: params.id },
      data: {
        description: enriched.synopsis || book.description,
        tags: enriched.tags || book.tags,
        genre: enriched.genre || book.genre,
        difficulty: enriched.difficulty || book.difficulty,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        bookId: book.id,
        action: "AI_ENRICHED",
        details: `AI enriched metadata for: ${book.title}`,
      },
    });

    return NextResponse.json({
      book: updatedBook,
      enrichment: enriched,
    });
  } catch (error: any) {
    console.error("AI enrichment error:", error);
    return NextResponse.json(
      { error: "AI enrichment failed: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
