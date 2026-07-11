const { Client } = require('d:/os/backend/node_modules/pg');

const client = new Client({
  connectionString: "postgresql://postgres:Parth%40315001@db.pzcmebgelxkcudtjjwdq.supabase.co:5432/postgres"
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT passengers FROM \"Booking\" WHERE \"bookingId\" = '2605192947424'");
  console.log("PASSENGERS ROW VALUE:", JSON.stringify(res.rows[0]?.passengers, null, 2));
  await client.end();
}

run();
