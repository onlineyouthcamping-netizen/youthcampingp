/**
 * Instant SQL Table Initializer and Data Seeder for 7 API Endpoints
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initAndSeed() {
  console.log('🚀 Ensuring 13 SQL tables exist and seeding data...');

  // Create tables using raw SQL if they do not exist
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS "trips" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "subtitle" TEXT,
      "location" TEXT NOT NULL,
      "image" TEXT NOT NULL,
      "gallery_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "description" TEXT NOT NULL,
      "price" DOUBLE PRECISION NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'INR',
      "difficulty" TEXT NOT NULL,
      "age_group" TEXT,
      "max_altitude" TEXT,
      "duration_nights" INTEGER NOT NULL DEFAULT 0,
      "duration_days" INTEGER NOT NULL DEFAULT 0,
      "slug" TEXT NOT NULL UNIQUE,
      "month" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "trips_created_at_idx" ON "trips"("created_at");`,
    `CREATE INDEX IF NOT EXISTS "trips_month_idx" ON "trips"("month");`,

    `CREATE TABLE IF NOT EXISTS "trip_details" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trip_id" TEXT NOT NULL UNIQUE REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "nights" INTEGER NOT NULL,
      "days" INTEGER NOT NULL,
      "month" TEXT,
      "departure_dates" JSONB NOT NULL,
      "departure_month" TEXT[] DEFAULT ARRAY[]::TEXT[]
    );`,
    `CREATE INDEX IF NOT EXISTS "trip_details_trip_id_idx" ON "trip_details"("trip_id");`,

    `CREATE TABLE IF NOT EXISTS "travel_modes" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trip_id" TEXT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "name" TEXT NOT NULL,
      "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "included" BOOLEAN NOT NULL DEFAULT false,
      "description" TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS "travel_modes_trip_id_idx" ON "travel_modes"("trip_id");`,

    `CREATE TABLE IF NOT EXISTS "room_sharing" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trip_id" TEXT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "type" TEXT NOT NULL,
      "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "base" BOOLEAN NOT NULL DEFAULT false,
      "description" TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS "room_sharing_trip_id_idx" ON "room_sharing"("trip_id");`,

    `CREATE TABLE IF NOT EXISTS "itinerary" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trip_id" TEXT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "day" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "location" TEXT,
      "activities" TEXT[] DEFAULT ARRAY[]::TEXT[]
    );`,
    `CREATE INDEX IF NOT EXISTS "itinerary_trip_id_idx" ON "itinerary"("trip_id");`,
    `CREATE INDEX IF NOT EXISTS "itinerary_day_idx" ON "itinerary"("day");`,

    `CREATE TABLE IF NOT EXISTS "inclusions" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trip_id" TEXT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "text" TEXT NOT NULL,
      "icon" TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS "inclusions_trip_id_idx" ON "inclusions"("trip_id");`,

    `CREATE TABLE IF NOT EXISTS "exclusions" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trip_id" TEXT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "text" TEXT NOT NULL,
      "icon" TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS "exclusions_trip_id_idx" ON "exclusions"("trip_id");`,

    `CREATE TABLE IF NOT EXISTS "stays" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trip_id" TEXT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "name" TEXT NOT NULL,
      "location" TEXT NOT NULL,
      "image" TEXT,
      "nights" INTEGER NOT NULL DEFAULT 1,
      "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "tags" TEXT[] DEFAULT ARRAY[]::TEXT[]
    );`,
    `CREATE INDEX IF NOT EXISTS "stays_trip_id_idx" ON "stays"("trip_id");`,

    `CREATE TABLE IF NOT EXISTS "highlights" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trip_id" TEXT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "image" TEXT NOT NULL,
      "title" TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "highlights_trip_id_idx" ON "highlights"("trip_id");`,

    `CREATE TABLE IF NOT EXISTS "reviews" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "author" TEXT NOT NULL,
      "avatar" TEXT,
      "date" TEXT NOT NULL,
      "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
      "text" TEXT NOT NULL,
      "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "trip_id" TEXT REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "featured" BOOLEAN NOT NULL DEFAULT false,
      "trip_name" TEXT,
      "trip_slug" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "reviews_trip_id_idx" ON "reviews"("trip_id");`,
    `CREATE INDEX IF NOT EXISTS "reviews_featured_idx" ON "reviews"("featured");`,
    `CREATE INDEX IF NOT EXISTS "reviews_date_idx" ON "reviews"("date");`,

    `CREATE TABLE IF NOT EXISTS "stories" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "author" TEXT NOT NULL,
      "avatar" TEXT,
      "read_time" INTEGER NOT NULL,
      "image" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "excerpt" TEXT NOT NULL,
      "published_at" TEXT NOT NULL,
      "featured" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "stories_featured_idx" ON "stories"("featured");`,
    `CREATE INDEX IF NOT EXISTS "stories_published_at_idx" ON "stories"("published_at");`,

    `CREATE TABLE IF NOT EXISTS "destinations" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "image" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0
    );`,
    `CREATE INDEX IF NOT EXISTS "destinations_order_idx" ON "destinations"("order");`,

    `CREATE TABLE IF NOT EXISTS "faqs" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "trip_id" TEXT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "question" TEXT NOT NULL,
      "answer" TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS "faqs_trip_id_idx" ON "faqs"("trip_id");`,
  ];

  for (const statement of ddlStatements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (e) {
      console.warn('DDL warning:', e.message);
    }
  }

  console.log('✅ Tables created/verified. Now running seed...');
  const seedData = require('./seed_api_data');
  await seedData(prisma);
  console.log('🎉 Database initialization and seeding complete!');
}

initAndSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal init/seed error:', err);
    process.exit(1);
  });
