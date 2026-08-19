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
    // 1. Get all source tables
    const sourceTablesRes = await sourcePool.query(`
      SELECT tablename AS table_name 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename NOT LIKE '_prisma_%'
      ORDER BY tablename;
    `);

    const sourceTables = sourceTablesRes.rows.map((r) => r.table_name);
    console.log(`Found ${sourceTables.length} tables in Supabase.\n`);

    // 2. Get all target tables created by Prisma db push
    const targetTablesRes = await targetPool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    const targetTableMap = new Map();
    targetTablesRes.rows.forEach((r) => {
      targetTableMap.set(r.tablename.toLowerCase(), r.tablename);
      targetTableMap.set(r.tablename, r.tablename);
    });

    // Check out a single client from targetPool so session_replication_role = replica is preserved
    const targetClient = await targetPool.connect();

    try {
      await targetClient.query("SET session_replication_role = 'replica';");
      console.log("✓ Disabled foreign key constraints on target for fast bulk transfer.\n");
    } catch (fkErr) {
      console.log("⚠️ Could not set replica role:", fkErr.message);
    }

    let totalMigrated = 0;

    for (const srcTable of sourceTables) {
      // Find matching table in target
      const targetTable = targetTableMap.get(srcTable.toLowerCase()) || targetTableMap.get(srcTable);
      if (!targetTable) {
        // Skip tables not in prisma schema (e.g. legacy archive tables)
        continue;
      }

      process.stdout.write(`Migrating [${srcTable}] -> [${targetTable}]... `);

      // Fetch from source with explicit public. schema
      let rows = [];
      try {
        const res = await sourcePool.query(`SELECT * FROM public."${srcTable}"`);
        rows = res.rows;
      } catch (e1) {
        try {
          const res = await sourcePool.query(`SELECT * FROM public.${srcTable}`);
          rows = res.rows;
        } catch (e2) {
          console.log(`⚠️ Read Error: ${e1.message}`);
          continue;
        }
      }

      if (!rows || rows.length === 0) {
        console.log("0 rows");
        continue;
      }

      // Get columns and data types from target
      const targetColsRes = await targetClient.query(`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `, [targetTable]);
      
      const targetColMap = new Map();
      targetColsRes.rows.forEach((r) => {
        targetColMap.set(r.column_name, r);
      });

      // Filter row keys to only columns existing in target
      const sampleCols = Object.keys(rows[0]).filter((c) => targetColMap.has(c));
      if (sampleCols.length === 0) {
        console.log("0 matching columns");
        continue;
      }

      const colNames = sampleCols.map((c) => `"${c}"`).join(", ");
      let inserted = 0;
      const errors = new Map();

      for (const row of rows) {
        const values = sampleCols.map((c) => {
          const val = row[c];
          if (val === undefined) return null;
          const colMeta = targetColMap.get(c);
          
          // Serialize objects for JSON/JSONB columns
          if (
            val !== null &&
            typeof val === "object" &&
            !(val instanceof Date) &&
            (colMeta?.data_type === "json" || colMeta?.data_type === "jsonb" || colMeta?.udt_name === "json" || colMeta?.udt_name === "jsonb")
          ) {
            return JSON.stringify(val);
          }
          return val;
        });

        const placeholders = sampleCols.map((_, i) => `$${i + 1}`).join(", ");

        try {
          await targetClient.query(
            `INSERT INTO public."${targetTable}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          inserted++;
        } catch (rowErr) {
          const count = errors.get(rowErr.message) || 0;
          errors.set(rowErr.message, count + 1);
        }
      }

      if (errors.size > 0 && inserted < rows.length) {
        const errDetails = Array.from(errors.entries())
          .map(([msg, cnt]) => `(${cnt}x: ${msg})`)
          .join(", ");
        console.log(`✓ ${inserted} / ${rows.length} rows [Errors: ${errDetails}]`);
      } else {
        console.log(`✓ ${inserted} / ${rows.length} rows`);
      }
      totalMigrated += inserted;
    }

    // Re-enable constraints
    try {
      await targetClient.query("SET session_replication_role = 'origin';");
    } catch (_e) {
      // safe fallback
    }
    targetClient.release();

    console.log(`\n🎉 Data Migration Complete! Total rows migrated: ${totalMigrated}`);
  } catch (err) {
    console.error("Migration fatal error:", err);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

runMigration();
