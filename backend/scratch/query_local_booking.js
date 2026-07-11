const axios = require('axios');
const jwt = require('jsonwebtoken');

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

  try {
    const res = await axios.get('http://localhost:3001/api/bookings/cmrdd1f7w000kiamk5wb72abq', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("RESPONSE:", res.data);
  } catch (err) {
    console.error("STATUS:", err.response?.status);
    console.error("BODY:", JSON.stringify(err.response?.data, null, 2));
  }
}

main();
