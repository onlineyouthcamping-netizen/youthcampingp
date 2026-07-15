require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { prisma } = require('../src/lib/prisma');
const controller = require('../src/controllers/bookingController');

async function test() {
  try {
    const id = "cmrivs50q00221s3xrw1916zr";
    
    console.log("1. Simulating update request (changing departure date)...");
    let req = {
      params: { id },
      user: { id: "cmrdbeffb0003gs2qglklyyyp", role: "admin", tenantId: "default" },
      body: {
        departureDate: "2026-06-07",
        reason: "Customer rescheduled"
      }
    };
    
    let res = {
      status: function(code) {
        console.log("Status code:", code);
        return this;
      },
      json: function(data) {
        console.log("Response:", data);
        return this;
      }
    };
    
    await controller.updateBooking(req, res, (err) => console.error("Error callback:", err));

    console.log("\n2. Simulating update request (changing notes, no departure date)...");
    req = {
      params: { id },
      user: { id: "cmrdbeffb0003gs2qglklyyyp", role: "admin", tenantId: "default" },
      body: {
        notes: "Updated notes at " + new Date().toISOString()
      }
    };
    
    await controller.updateBooking(req, res, (err) => console.error("Error callback:", err));

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
