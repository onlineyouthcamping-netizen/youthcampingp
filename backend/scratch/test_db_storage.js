const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const buckets = await prisma.$queryRawUnsafe('SELECT * FROM storage.buckets;');
    console.log("Supabase Storage Buckets in DB:", buckets);
  } catch (err) {
    console.error("Error querying storage.buckets:", err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
