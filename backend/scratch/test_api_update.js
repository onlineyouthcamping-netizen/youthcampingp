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

  const testPayload = {
    totalAmount: 94000,
    remainingAmount: 73000,
    baseAmount: 94000,
    gstAmount: 0,
    sourceMeta: {
      bookingItems: [
        {
          "id": "3-tier_ac_train_",
          "qty": 4,
          "name": "3-TIER AC TRAIN ",
          "rate": 23500
        },
        {
          "id": "quad_sharing_",
          "qty": 4,
          "name": "QUAD SHARING ",
          "rate": 0
        },
        {
          "id": "gst_discount_test",
          "name": "GST Discount",
          "rate": 4700,
          "qty": 1,
          "isCustom": true
        }
      ]
    }
  };

  try {
    const res = await axios.put('https://api.youthcamping.online/api/bookings/cmrd4qvxj0009il2cvww0kruk', testPayload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("UPDATE STATUS:", res.status);
    console.log("RESPONSE DATA:", JSON.stringify(res.data.data.sourceMeta, null, 2));
  } catch (err) {
    console.error("UPDATE ERROR:", err.message, err.response?.data);
  }
}

main();
