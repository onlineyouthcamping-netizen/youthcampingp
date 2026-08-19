const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function testApi() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) {
    console.log("No super admin found");
    return;
  }
  
  const token = jwt.sign({ id: admin.id, role: admin.role, tenantId: admin.tenantId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1d' });
  
  const axios = require('axios');
  try {
    const res = await axios.get('http://localhost:3001/api/bookings?limit=5', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const bookings = res.data.data;
    if (bookings && bookings.length > 0) {
      console.log("First booking keys:", Object.keys(bookings[0]));
      console.log("opsClientPayments:", bookings[0].opsClientPayments);
      console.log("paymentHistory:", bookings[0].paymentHistory);
      console.log("clientPayments:", bookings[0].clientPayments);
    } else {
      console.log("No bookings returned.");
    }
  } catch (err) {
    console.error("API Error:", err.message);
  }
}

testApi().catch(console.error).finally(() => prisma.$disconnect());
