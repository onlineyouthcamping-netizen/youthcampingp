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

  try {
    const res = await axios.get('https://api.youthcamping.online/api/bookings/cmrd4qvxj0009il2cvww0kruk', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("LIVE API BOOKING ITEMS:", JSON.stringify(res.data.data.sourceMeta?.bookingItems, null, 2));
    console.log("LIVE API TOTAL AMOUNT:", res.data.data.totalAmount);
    console.log("LIVE API NUMBER OF TRAVELERS:", res.data.data.numberOfTravelers);
  } catch (err) {
    console.error("LIVE API ERROR:", err.message, err.response?.data);
  }
}

main();
