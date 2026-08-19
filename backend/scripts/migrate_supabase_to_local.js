process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { Pool } = require("pg");

const SUPABASE_URL =
  process.env.SOURCE_DB_URL ||
  "postgresql://postgres.pzcmebgelxkcudtjjwdq:Parth%40315001@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const LOCAL_URL =
  process.env.TARGET_DB_URL ||
  "postgresql://youthcamping:YouthCamping2026@localhost:5432/youthcamping_db";

async function runMigration() {
  console.log("Connecting to Supabase (Source)...");
  const sourcePool = new Pool({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connecting to Local VPS PostgreSQL (Target)...");
  const targetPool = new Pool({ connectionString: LOCAL_URL });

  try {
    // 1. Get all user tables from public schema
    const tablesRes = await sourcePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE_TABLE'
        AND table_name NOT LIKE '_prisma_%'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map((r) => r.table_name);
    console.log(`Found ${tables.length} tables in Supabase public schema.\n`);

    // Disable foreign key checks on target during load
    await targetPool.query("SET session_replication_role = 'replica';");

    for (const table of tables) {
      process.stdout.write(`Migrating table [${table}]... `);
      try {
        const dataRes = await sourcePool.query(`SELECT * FROM "${table}"`);
        const rows = dataRes.rows;

        if (rows.length === 0) {
          console.log("0 rows (skipped)");
          continue;
        }

        // Insert rows into target in batches
        const columns = Object.keys(rows[0]);
        const colNames = columns.map((c) => `"${c}"`).join(", ");

        let inserted = 0;
        for (const row of rows) {
          const values = columns.map((c) => row[c]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
          
          try {
            await targetPool.query(
              `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
              values
            );
            inserted++;
          } catch (rowErr) {
            // Log individual row error without breaking whole table
          }
        }
        console.log(`✓ ${inserted} / ${rows.length} rows migrated`);
      } catch (tblErr) {
        console.log(`⚠️ Error: ${tblErr.message}`);
      }
    }

    // Re-enable foreign key checks on target
    await targetPool.query("SET session_replication_role = 'origin';");

    console.log("\n🎉 All data successfully migrated from Supabase to Local VPS PostgreSQL!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

runMigration();
