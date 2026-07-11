const { prisma } = require('../src/lib/prisma');
const { generateBookingId } = require('../src/utils/bookingIdGenerator');

async function main() {
  console.log("=== STARTING DEPARTURE & CUSTOMER PROFILE VERIFICATION ===");
  const results = {};
  let testBookingId = null;

  try {
    // 1. Fetch real trip records
    const trip = await prisma.trip.findFirst();
    if (!trip) throw new Error("No trip found in database");
    console.log(`Using Trip: ${trip.title} (ID: ${trip.id})`);

    const dateA = new Date("2026-07-25");
    const dateB = new Date("2026-08-10");

    // ==========================================
    // 6. DEPARTURE TESTING
    // ==========================================
    console.log("\n--- Testing Departure Changing ---");

    // A. Query initial traveler counts for Departure A & B
    const getCountForDate = async (dateStr) => {
      const bookingsForDate = await prisma.booking.findMany({
        where: {
          tripId: trip.id,
          departureDate: dateStr,
          status: { not: "cancelled" }
        }
      });
      return bookingsForDate.reduce((sum, b) => sum + (b.numberOfTravelers || 0), 0);
    };

    const countA_initial = await getCountForDate(dateA);
    const countB_initial = await getCountForDate(dateB);
    console.log(`Initial passenger count for Departure A (${dateA.toISOString().split('T')[0]}): ${countA_initial}`);
    console.log(`Initial passenger count for Departure B (${dateB.toISOString().split('T')[0]}): ${countB_initial}`);

    // B. Create a booking on Departure A
    const bookingId = generateBookingId();
    const booking = await prisma.booking.create({
      data: {
        bookingId,
        tripId: trip.id,
        name: "Departure Test User",
        fullName: "Departure Test User",
        phone: "9777777777",
        email: "departure@test.com",
        amount: 25000,
        totalAmount: 25000,
        numberOfTravelers: 3, // 3 travelers
        departureDate: dateA,
        status: "confirmed",
        paymentStatus: "unpaid",
        tenantId: "default"
      }
    });
    testBookingId = booking.id;
    console.log(`Created test booking with 3 travelers on Departure A: ${booking.bookingId}`);

    const countA_afterCreate = await getCountForDate(dateA);
    results["Passenger count increments on old departure"] = countA_afterCreate === (countA_initial + 3);
    console.log(`Passenger count for Departure A after create: ${countA_afterCreate}`);

    // C. Change departure date to Departure B
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { departureDate: dateB }
    });
    console.log("Changed booking departure date to Departure B");

    const countA_afterChange = await getCountForDate(dateA);
    const countB_afterChange = await getCountForDate(dateB);

    results["Old departure passenger count decrements"] = countA_afterChange === countA_initial;
    results["New departure passenger count increments"] = countB_afterChange === (countB_initial + 3);

    console.log(`Passenger count for Departure A after change: ${countA_afterChange}`);
    console.log(`Passenger count for Departure B after change: ${countB_afterChange}`);


    // ==========================================
    // 7. CUSTOMER TESTING
    // ==========================================
    console.log("\n--- Testing Customer Profile Aggregation ---");

    // We will query the customer details based on their phone/email
    const customerPhone = "9777777777";
    const customerEmail = "departure@test.com";

    // Create a past payment, document, and activity log to test profile displays
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: 5000,
        paymentMode: "UPI",
        transactionId: "UPI9777",
        status: "SUCCESS",
        tenantId: "default"
      }
    });

    await prisma.bookingDocument.create({
      data: {
        bookingId: booking.id,
        passengerId: "p1",
        uploadedBy: "Admin",
        documentType: "Aadhar",
        storagePath: "test/aadhar.pdf",
        originalFileName: "aadhar.pdf",
        mimeType: "application/pdf",
        fileSize: 5000,
        status: "UPLOADED",
        tenantId: "default"
      }
    });

    // Query profile details
    const bookings = await prisma.booking.findMany({
      where: { phone: customerPhone, tenantId: "default" },
      include: {
        documents: true
      }
    });

    const bookingIds = bookings.map(b => b.id);
    const payments = await prisma.payment.findMany({
      where: { bookingId: { in: bookingIds } }
    });

    // Segment trips
    const upcomingTrips = bookings.filter(b => b.status !== "cancelled" && b.departureDate > new Date());
    const cancelledTrips = bookings.filter(b => b.status === "cancelled");
    const totalRemaining = bookings.reduce((sum, b) => sum + ((b.totalAmount || 0) - (payments.filter(p => p.bookingId === b.id).reduce((s, p) => s + p.amount, 0))), 0);
    const docs = bookings.flatMap(b => b.documents);
    const notes = bookings.map(b => b.notes).filter(Boolean);

    results["Profile shows Booking History"] = bookings.length > 0;
    results["Profile shows Payments"] = payments.length > 0;
    results["Profile calculates Remaining Balance"] = totalRemaining === 20000; // 25000 total - 5000 paid
    results["Profile displays Documents"] = docs.length > 0;
    results["Profile displays Notes / Remarks"] = Array.isArray(notes);
    results["Profile displays Upcoming Trips"] = upcomingTrips.length > 0;
    results["Profile displays Cancelled Trips"] = Array.isArray(cancelledTrips);

  } catch (err) {
    console.error("ERROR running departure/customer verification:", err);
  } finally {
    // CLEANUP
    console.log("\n--- Cleaning Up Test Data ---");
    if (testBookingId) {
      await prisma.bookingDocument.deleteMany({ where: { bookingId: testBookingId } }).catch(() => {});
      await prisma.payment.deleteMany({ where: { bookingId: testBookingId } }).catch(() => {});
      await prisma.booking.delete({ where: { id: testBookingId } }).catch(() => {});
    }
    console.log("Cleanup complete.");
  }

  // Print results
  console.log("\n=== DEPARTURE & CUSTOMER VERIFICATION RESULTS ===");
  let passedCount = 0;
  let totalCount = 0;
  for (const [key, value] of Object.entries(results)) {
    totalCount++;
    if (value) {
      passedCount++;
      console.log(`[✓] PASSED: ${key}`);
    } else {
      console.log(`[✗] FAILED: ${key}`);
    }
  }
  console.log(`\nScore: ${passedCount}/${totalCount} tests passed.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
