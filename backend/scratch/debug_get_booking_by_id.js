require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { prisma } = require('../src/lib/prisma');
const controller = require('../src/controllers/bookingController');
const { stripFinancialFieldsForGuides } = require('../src/middleware/financialStripper');

async function test() {
  try {
    const id = "cmrivs50q00221s3xrw1916zr";
    
    // Call the function directly with guide user and middleware
    console.log("Simulating Guide request...");
    const req = {
      params: { id },
      user: { id: "cmrdbeffb0003gs2qglklyyyp", role: "guide", tenantId: "default" }
    };
    
    const res = {
      status: function(code) {
        console.log("Status code returned:", code);
        return this;
      },
      json: function(data) {
        console.log("Success! Sanitize returned data.");
        return this;
      }
    };
    
    const next = function(err) {
      if (err) console.error("Next called with error:", err);
    };

    // Apply middleware
    stripFinancialFieldsForGuides(req, res, () => {
      // Middleware next() called, now execute controller
      controller.getBookingById(req, res, next)
        .catch(err => {
          console.error("Controller rejected:", err);
        });
    });

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    // Wait a bit for async operations before disconnecting
    setTimeout(async () => {
      await prisma.$disconnect();
    }, 2000);
  }
}

test();
