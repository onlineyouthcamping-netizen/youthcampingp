const { prisma } = require('../src/lib/prisma');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function main() {
  const secret = process.env.JWT_SECRET || 'secret';
  console.log(`JWT Secret: ${secret}`);
  
  // Generate a token for superadmin
  const token = jwt.sign(
    { id: 'admin_master_prod', email: 'admin@youthcamping.online', role: 'superadmin', tenantId: 'default' },
    secret,
    { expiresIn: '1d' }
  );
  
  console.log(`Generated token: ${token.substring(0, 20)}...`);
  
  // Now make a request to the local backend if running, or run the controller function directly!
  const req = {
    query: { status: 'all', tripId: 'SPT-1', limit: '100' },
    user: { id: 'admin_master_prod', email: 'admin@youthcamping.online', role: 'superadmin', tenantId: 'default' }
  };
  
  const res = {
    status: (code) => {
      console.log(`HTTP Status: ${code}`);
      return res;
    },
    json: (data) => {
      console.log("JSON response received:");
      console.log(`Success: ${data.success}`);
      if (data.data) {
        console.log(`Bookings returned: ${data.data.length}`);
        if (data.data.length > 0) {
          console.log(`Sample booking 1: ${JSON.stringify(data.data[0])}`);
        }
      } else {
        console.log(data);
      }
    }
  };
  
  const next = (err) => {
    console.error("Next called with error:", err);
  };
  
  const { getBookings } = require('../src/controllers/bookingController');
  await getBookings(req, res, next);
}

main();
