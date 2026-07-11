const jwt = require('jsonwebtoken');
const axios = require('axios');

async function main() {
  const secret = "4f9e8d7c6b5a4132211009988776655443322110";
  const token = jwt.sign(
    {
      id: "admin_master_prod",
      email: "admin@youthcamping.online",
      role: "superadmin",
      tenantId: "default"
    },
    secret,
    { expiresIn: '1h' }
  );

  console.log("GENERATED JWT TOKEN:", token);

  try {
    const res = await axios.get('https://api.youthcamping.online/api/bookings/cmrd4qvxj0009il2cvww0kruk', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("LIVE API RESPONSE PASSENGERS:", JSON.stringify(res.data.data.passengers, null, 2));
  } catch (err) {
    console.error("LIVE API ERROR:", err.message, err.response?.data);
  }
}

main();
