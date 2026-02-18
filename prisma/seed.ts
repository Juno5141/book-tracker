import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const books = [
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Fiction",
    tags: ["classic", "american-literature", "social-justice"],
    description: "A novel about racial injustice in the Deep South, seen through the eyes of young Scout Finch as her father defends a Black man falsely accused of a crime.",
    isbn: "978-0-06-112008-4",
    difficulty: "Moderate",
  },
  {
    title: "1984",
    author: "George Orwell",
    genre: "Science Fiction",
    tags: ["dystopian", "classic", "political"],
    description: "A dystopian novel set in a totalitarian society ruled by Big Brother, exploring themes of surveillance, propaganda, and the erosion of individual freedom.",
    isbn: "978-0-452-28423-4",
    difficulty: "Moderate",
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Fiction",
    tags: ["classic", "american-literature", "jazz-age"],
    description: "A portrait of the Jazz Age and the American Dream through the mysterious millionaire Jay Gatsby and his obsession with the beautiful Daisy Buchanan.",
    isbn: "978-0-7432-7356-5",
    difficulty: "Moderate",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    genre: "Non-Fiction",
    tags: ["history", "anthropology", "science"],
    description: "A sweeping narrative of human history from the Stone Age to the present, exploring how Homo sapiens came to dominate the world.",
    isbn: "978-0-06-231609-7",
    difficulty: "Moderate",
  },
  {
    title: "The Pragmatic Programmer",
    author: "David Thomas & Andrew Hunt",
    genre: "Technology",
    tags: ["programming", "software-engineering", "career"],
    description: "A guide to software craftsmanship covering topics from personal responsibility and career development to architectural techniques for keeping code flexible.",
    isbn: "978-0-13-595705-9",
    difficulty: "Advanced",
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    genre: "Science Fiction",
    tags: ["sci-fi", "epic", "ecology", "politics"],
    description: "An epic science fiction novel set on the desert planet Arrakis, following young Paul Atreides as he navigates political intrigue and a vast interstellar empire.",
    isbn: "978-0-441-17271-9",
    difficulty: "Advanced",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    tags: ["productivity", "habits", "psychology"],
    description: "A practical guide to building good habits and breaking bad ones, based on the science of behavioral change and small, incremental improvements.",
    isbn: "978-0-7352-1129-2",
    difficulty: "Easy",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    tags: ["adventure", "classic", "fantasy"],
    description: "Bilbo Baggins, a comfort-loving hobbit, is swept into an epic quest to reclaim the lost Dwarf Kingdom of Erebor from the fearsome dragon Smaug.",
    isbn: "978-0-547-92822-7",
    difficulty: "Easy",
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Technology",
    tags: ["programming", "best-practices", "software-engineering"],
    description: "A handbook of agile software craftsmanship that teaches programmers how to write clean, readable, and maintainable code.",
    isbn: "978-0-13-235088-4",
    difficulty: "Advanced",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Fiction",
    tags: ["classic", "romance", "british-literature"],
    description: "A witty and romantic novel following Elizabeth Bennet as she navigates issues of manners, upbringing, and marriage in Regency-era England.",
    isbn: "978-0-14-143951-8",
    difficulty: "Moderate",
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create books
  for (const bookData of books) {
    const existing = await prisma.book.findFirst({
      where: { title: bookData.title, author: bookData.author },
    });

    if (!existing) {
      const book = await prisma.book.create({ data: bookData });
      console.log(`  📚 Created: ${book.title}`);
    } else {
      console.log(`  ⏭️  Skipped (exists): ${bookData.title}`);
    }
  }

  console.log("\n✅ Seeding complete!");
  console.log("\n📝 Notes:");
  console.log("  - Set ADMIN_EMAIL in .env to auto-assign ADMIN role on first sign-in");
  console.log("  - Default role for new users is MEMBER");
  console.log("  - Admins can promote users to LIBRARIAN or ADMIN via the Users page");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
