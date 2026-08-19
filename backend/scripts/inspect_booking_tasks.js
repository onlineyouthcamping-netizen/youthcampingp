const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { Pool } = require("pg");

const dbUrl = process.env.DATABASE_URL || "";
const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
});

async function inspect() {
  console.log("=== INSPECTING BookingTask AND Admin RECORDS ===");
  try {
    const adminRes = await pool.query(`SELECT id, email, name, role FROM "Admin" ORDER BY "createdAt" ASC;`);
    console.log(`\nFound ${adminRes.rows.length} Admin records:`);
    adminRes.rows.forEach(a => {
      console.log(`  Admin [${a.id}] email: ${a.email}, name: ${a.name}, role: ${a.role}`);
    });

    const tasksRes = await pool.query(`
      SELECT 
        id, 
        "bookingId", 
        title, 
        status, 
        "dueDate", 
        "assignedById", 
        "assignedToId", 
        "createdAt" 
      FROM "BookingTask" 
      ORDER BY "createdAt" DESC;
    `);

    console.log(`\nFound ${tasksRes.rows.length} BookingTask records in DB:`);
    tasksRes.rows.forEach((t, i) => {
      console.log(`  Task #${i + 1}: [${t.id}]`);
      console.log(`    Title: "${t.title}"`);
      console.log(`    BookingId: ${t.bookingId}`);
      console.log(`    Status: ${t.status}`);
      console.log(`    DueDate: ${t.dueDate}`);
      console.log(`    AssignedById: ${t.assignedById}`);
      console.log(`    AssignedToId: ${t.assignedToId}`);
      console.log(`    CreatedAt: ${t.createdAt}`);
    });

    // Check for broken FK references
    const adminIds = new Set(adminRes.rows.map(a => a.id));
    const brokenAssignedBy = tasksRes.rows.filter(t => !t.assignedById || !adminIds.has(t.assignedById));
    const brokenAssignedTo = tasksRes.rows.filter(t => !t.assignedToId || !adminIds.has(t.assignedToId));

    console.log(`\nIntegrity Summary:`);
    console.log(`  Total Tasks: ${tasksRes.rows.length}`);
    console.log(`  Tasks with NULL or non-existent assignedById: ${brokenAssignedBy.length}`);
    console.log(`  Tasks with NULL or non-existent assignedToId: ${brokenAssignedTo.length}`);

    if (brokenAssignedBy.length > 0) {
      console.log(`  Broken assignedById details:`, brokenAssignedBy.map(t => ({ id: t.id, title: t.title, assignedById: t.assignedById })));
    }
    if (brokenAssignedTo.length > 0) {
      console.log(`  Broken assignedToId details:`, brokenAssignedTo.map(t => ({ id: t.id, title: t.title, assignedToId: t.assignedToId })));
    }

  } catch (err) {
    console.error("Inspection error:", err.message);
  } finally {
    await pool.end();
  }
}

inspect();
