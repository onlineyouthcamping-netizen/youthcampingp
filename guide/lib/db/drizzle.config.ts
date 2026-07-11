import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables from workspace root if not already defined
if (!process.env.DATABASE_URL) {
  let dir = process.cwd();
  while (dir) {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
    const apiEnvPath = path.join(dir, "artifacts/api-server/.env");
    if (fs.existsSync(apiEnvPath)) {
      dotenv.config({ path: apiEnvPath });
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  tablesFilter: [
    "users",
    "trips",
    "attendance",
    "payouts",
    "assignments",
    "guide_work_days",
    "guide_day_reports",
    "guide_expenses",
    "traveler_attendance",
    "trip_status_updates",
    "guide_trip_updates",
    "guide_checkin_points",
    "guide_hotel_updates",
    "guide_food_updates",
    "guide_group_photos",
    "guide_movement_updates",
    "guide_food_preference_audits"
  ]
});
