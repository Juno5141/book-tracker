import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden } from "@/lib/rbac";

// Known book data for common titles (offline enrichment)
const KNOWN_BOOKS: Record<string, { synopsis: string; tags: string[]; genre: string; difficulty: string }> = {
  "to kill a mockingbird": {
    synopsis: "Set in the Depression-era South, this Pulitzer Prize-winning novel follows young Scout Finch as her father, lawyer Atticus Finch, defends a Black man falsely accused of assaulting a white woman. Through Scout's innocent eyes, the story explores themes of racial injustice, moral courage, and the loss of innocence.",
    tags: ["classic", "social-justice", "coming-of-age", "american-south", "legal-drama"],
    genre: "Fiction",
    difficulty: "Moderate",
  },
  "1984": {
    synopsis: "In a totalitarian society ruled by the omnipresent Big Brother, Winston Smith secretly rebels against the Party's control over truth, history, and individual thought. George Orwell's chilling dystopia explores surveillance, propaganda, and the destruction of personal freedom in a world where War is Peace and Freedom is Slavery.",
    tags: ["dystopian", "political", "classic", "surveillance", "totalitarianism"],
    genre: "Science Fiction",
    difficulty: "Moderate",
  },
  "the great gatsby": {
    synopsis: "Narrator Nick Carraway recounts the mysterious millionaire Jay Gatsby's obsessive pursuit of the beautiful Daisy Buchanan across the Long Island Sound. Set during the Roaring Twenties, Fitzgerald's masterpiece is a tragic meditation on the American Dream, wealth, and the impossibility of recapturing the past.",
    tags: ["classic", "american-dream", "jazz-age", "tragedy", "wealth"],
    genre: "Fiction",
    difficulty: "Moderate",
  },
  "dune": {
    synopsis: "On the desert planet Arrakis, young Paul Atreides is thrust into a political and ecological struggle over the universe's most valuable substance: the spice melange. As Paul embraces his destiny among the Fremen people, he must navigate treachery, prophecy, and the vast power dynamics of an interstellar empire.",
    tags: ["sci-fi", "epic", "ecology", "politics", "space-opera", "prophecy"],
    genre: "Science Fiction",
    difficulty: "Advanced",
  },
  "the hobbit": {
    synopsis: "Reluctant adventurer Bilbo Baggins is swept from his comfortable hobbit-hole by the wizard Gandalf and a company of dwarves on a quest to reclaim their homeland from the dragon Smaug. Along the way, Bilbo discovers courage he never knew he had and finds a mysterious ring that will change the fate of Middle-earth.",
    tags: ["fantasy", "adventure", "classic", "quest", "dragons"],
    genre: "Fantasy",
    difficulty: "Easy",
  },
  "pride and prejudice": {
    synopsis: "In Regency-era England, the witty and independent Elizabeth Bennet navigates the complex social landscape of marriage, class, and reputation. When she encounters the proud Mr. Darcy, their initial mutual disdain gradually transforms into one of literature's most beloved romances.",
    tags: ["classic", "romance", "social-commentary", "british-literature", "regency"],
    genre: "Fiction",
    difficulty: "Moderate",
  },
  "atomic habits": {
    synopsis: "James Clear presents a comprehensive framework for building good habits and breaking bad ones through small, incremental changes. Drawing on neuroscience and behavioral psychology, the book argues that tiny 1% improvements compound into remarkable results over time.",
    tags: ["productivity", "habits", "psychology", "self-improvement", "behavioral-science"],
    genre: "Self-Help",
    difficulty: "Easy",
  },
  "sapiens": {
    synopsis: "Yuval Noah Harari traces the entire arc of human history from the emergence of Homo sapiens in Africa to the present, examining how our species came to dominate the planet. The book explores the Cognitive, Agricultural, and Scientific Revolutions that shaped human societies, economies, and beliefs.",
    tags: ["history", "anthropology", "evolution", "civilization", "science"],
    genre: "Non-Fiction",
    difficulty: "Moderate",
  },
  "clean code": {
    synopsis: "Robert C. Martin presents principles, patterns, and practices for writing clean, readable, and maintainable software. Through real-world examples of both good and bad code, the book teaches developers how to transform messy code into elegant, professional craftsmanship.",
    tags: ["programming", "software-engineering", "best-practices", "refactoring", "craftsmanship"],
    genre: "Technology",
    difficulty: "Advanced",
  },
  "the pragmatic programmer": {
    synopsis: "A classic guide to software development that covers everything from personal responsibility to architectural patterns. Thomas and Hunt present practical advice for modern developers on writing flexible, adaptable code while navigating the realities of software projects and career growth.",
    tags: ["programming", "software-engineering", "career", "best-practices", "pragmatic"],
    genre: "Technology",
    difficulty: "Advanced",
  },
};

// Use Hugging Face Inference API (free, no key required for public models)
async function enrichWithHuggingFace(title: string, author: string): Promise<{
  synopsis: string;
  tags: string[];
  genre: string;
  difficulty: string;
} | null> {
  const hfToken = process.env.HF_API_TOKEN || "";

  const prompt = `<s>[INST] You are a librarian. For the book "${title}" by ${author}, provide a JSON object with these exact keys:
- "synopsis": 2-3 sentence book summary
- "tags": array of 3-5 keyword tags
- "genre": primary genre (Fiction, Non-Fiction, Science Fiction, Fantasy, Mystery, Biography, Self-Help, History, Science, Technology)
- "difficulty": reading level (Easy, Moderate, Advanced)
Return ONLY valid JSON, nothing else. [/INST]`;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

    const res = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 400,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("HF API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.[0]?.generated_text || "";

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate the structure
    return {
      synopsis: typeof parsed.synopsis === "string" ? parsed.synopsis : "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
      genre: typeof parsed.genre === "string" ? parsed.genre : "",
      difficulty: typeof parsed.difficulty === "string" ? parsed.difficulty : "",
    };
  } catch (err) {
    console.error("HF parsing error:", err);
    return null;
  }
}

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

  try {
    // 1. Try local known-book lookup first (instant, free, offline)
    const titleKey = book.title.toLowerCase().trim();
    let enriched = KNOWN_BOOKS[titleKey] || null;
    let source = "local-db";

    // Also try partial match
    if (!enriched) {
      const match = Object.keys(KNOWN_BOOKS).find(
        (k) => titleKey.includes(k) || k.includes(titleKey)
      );
      if (match) {
        enriched = KNOWN_BOOKS[match];
      }
    }

    // 2. Try Hugging Face Inference API (free tier)
    if (!enriched) {
      source = "huggingface";
      enriched = await enrichWithHuggingFace(book.title, book.author);
    }

    // 3. Fallback: generate basic metadata from title/author heuristics
    if (!enriched) {
      source = "heuristic";
      enriched = {
        synopsis: `"${book.title}" is a work by ${book.author}. This book explores its subject matter with depth and insight, offering readers a compelling reading experience.`,
        tags: book.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 4),
        genre: book.genre || "Fiction",
        difficulty: "Moderate",
      };
    }

    // Update book with enriched data
    const updatedBook = await prisma.book.update({
      where: { id: params.id },
      data: {
        description: enriched.synopsis || book.description,
        tags: enriched.tags.length > 0 ? enriched.tags : book.tags,
        genre: enriched.genre || book.genre,
        difficulty: enriched.difficulty || book.difficulty,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        bookId: book.id,
        action: "AI_ENRICHED",
        details: `AI enriched metadata for: ${book.title} (source: ${source})`,
      },
    });

    return NextResponse.json({
      book: updatedBook,
      enrichment: enriched,
      source,
    });
  } catch (error: any) {
    console.error("AI enrichment error:", error);
    return NextResponse.json(
      { error: "AI enrichment failed: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
