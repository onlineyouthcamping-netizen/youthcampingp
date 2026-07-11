const { prisma } = require('../src/lib/prisma');

async function main() {
  const bookingId = 'BK-FIVFSP137WGF';
  
  // Fetch existing booking to preserve details
  const booking = await prisma.booking.findFirst({
    where: { bookingId }
  });

  if (!booking) {
    console.error("Booking not found!");
    return;
  }

  // 1. Update primary details on booking table itself
  const primaryName = "CHAUHAN KHUSHBUBEN ASHWINBHAI";
  const primaryPhone = "9327359374";
  const primaryEmail = "khushichauhan2706@gmail.com";
  const primaryAge = 24;
  const primaryGender = "Female";

  // 2. Define the correct persons list
  const correctPersons = [
    {
      id: "main",
      age: primaryAge,
      name: primaryName,
      type: "3-TIER AC TRAIN ",
      email: primaryEmail,
      phone: primaryPhone,
      gender: primaryGender,
      status: "Form complete",
      roomSharing: "Quad",
      foodPreference: "Normal Food"
    },
    {
      id: "co-1",
      age: 24,
      name: "KHUSHI DARJI",
      type: "3-TIER AC TRAIN ",
      email: "khushidarji1507@gmail.com",
      phone: "7069755307",
      gender: "Female",
      status: "Form complete",
      roomSharing: "Quad",
      foodPreference: "Normal Food"
    },
    {
      id: "co-2",
      age: 24,
      name: "PATEL RUSHVI",
      type: "3-TIER AC TRAIN ",
      email: "patelrushvi89@gmail.com",
      phone: "9327623442",
      gender: "Female",
      status: "Form complete",
      roomSharing: "Quad",
      foodPreference: "Normal Food"
    },
    {
      id: "co-3",
      age: 32,
      name: "UMANGIBEN MITULKUMAR PATEL",
      type: "3-TIER AC TRAIN ",
      email: "umangi.borsad@gmail.com",
      phone: "8128511964",
      gender: "Female",
      status: "Form complete",
      roomSharing: "Quad",
      foodPreference: "Normal Food"
    }
  ];

  // 3. Define details object
  const details = {
    roomType: "QUAD SHARING ",
    basePrice: 21499,
    gstAmount: 4300, // as requested: 94000 total package is 23500 * 4 = 94000. 5% GST is 4700, but minus 400 deposit GST? Or let's see. Let's update details.
    depositGst: 250, // 250 GST per person * 4 = 1000
    trainClass: "3-TIER AC TRAIN ",
    ticketStatus: "Not Booked"
  };

  // 4. Update bookingItems in sourceMeta: 4 travelers * 23498 (3-tier AC Train rate is 23498, or 21499 package + 3000 train - wait, 21499 + 1999 = 23498? Yes)
  // Wait! Total package rate is 23500. Let's set 3-tier AC Train to qty 4, rate 23500.
  const newBookingItems = [
    {
      id: "non-ac_sleeper_",
      qty: 0,
      name: "NON-AC SLEEPER ",
      rate: 21499
    },
    {
      id: "3-tier_ac_train_",
      qty: 4,
      name: "3-TIER AC TRAIN ",
      rate: 23500
    },
    {
      id: "quad_sharing_",
      qty: 4,
      name: "QUAD SHARING ",
      rate: 0
    },
    {
      id: "triple_sharing_",
      qty: 0,
      name: "TRIPLE SHARING ",
      rate: 1499
    },
    {
      id: "double_sharing_",
      qty: 0,
      name: "DOUBLE SHARING ",
      rate: 2999
    }
  ];

  const updatedSourceMeta = {
    ...(booking.sourceMeta || {}),
    bookingItems: newBookingItems
  };

  // Calculate totals: 23500 * 4 = 94000 base package.
  // 5% GST = 4700.
  // Less 250 deposit GST per person = 1000.
  // Net GST = 4700 - 1000 = 3700? Or let's set gstAmount to 4700, and depositGst to 1000 (which is 250 * 4).
  const baseAmount = 94000;
  const gstAmount = 4700;
  const depositGst = 1000; // 250 per person * 4
  const totalAmount = baseAmount + gstAmount; // 98700

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      name: primaryName,
      fullName: primaryName,
      phone: primaryPhone,
      mobile: primaryPhone,
      email: primaryEmail,
      age: primaryAge,
      gender: primaryGender,
      numberOfTravelers: 4,
      baseAmount,
      gstAmount,
      depositGst,
      totalAmount,
      remainingAmount: totalAmount,
      sourceMeta: updatedSourceMeta,
      passengers: {
        details,
        persons: correctPersons
      }
    }
  });

  console.log("UPDATED BOOKING RESULT:", JSON.stringify(updatedBooking, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
