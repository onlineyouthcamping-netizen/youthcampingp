const jwt = require('jsonwebtoken');

const secret = "4f9e8d7c6b5a4132211009988776655443322110";
const payload = {
  id: 'cmqqnir78000u3jieoddcq8x9',
  role: 'sales',
  tenantId: 'default',
  tokenVersion: 0
};

const token = jwt.sign(payload, secret);
console.log("Token:", token);
console.log(`curl -i -H "Authorization: Bearer ${token}" https://api.youthcamping.online/api/bookings/cmrivs50q00221s3xrw1916zr`);
