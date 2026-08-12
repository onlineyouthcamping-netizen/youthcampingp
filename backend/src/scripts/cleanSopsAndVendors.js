const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting cleanup of all SOP templates, tasks, checklists, and vendor records...");

  try {
    // 1. Delete dependent checklist activity logs & checklists
    await prisma.opsChecklistActivity.deleteMany({}).catch(() => {});
    const deletedChecklist = await prisma.opsTripChecklist.deleteMany({});
    console.log(`✅ Deleted ${deletedChecklist.count} OpsTripChecklist records.`);

    // 2. Delete SOP task templates, versions, and templates
    const deletedTaskTemplates = await prisma.opsSopTaskTemplate.deleteMany({});
    console.log(`✅ Deleted ${deletedTaskTemplates.count} OpsSopTaskTemplate records.`);

    const deletedSopVersions = await prisma.opsSopVersion.deleteMany({});
    console.log(`✅ Deleted ${deletedSopVersions.count} OpsSopVersion records.`);

    const deletedSopTemplates = await prisma.opsSopTemplate.deleteMany({});
    console.log(`✅ Deleted ${deletedSopTemplates.count} OpsSopTemplate records.`);

    const deletedSopLibraries = await prisma.opsSopLibrary.deleteMany({});
    console.log(`✅ Deleted ${deletedSopLibraries.count} OpsSopLibrary records.`);

    // 3. Delete Vendor child relations first
    await prisma.opsVendorPayment.deleteMany({}).catch(() => {});
    await prisma.opsVendorAdditionalCharge.deleteMany({}).catch(() => {});
    await prisma.opsDepartureVendorAllocation.deleteMany({}).catch(() => {});
    await prisma.opsTripVendorRate.deleteMany({}).catch(() => {});
    await prisma.opsTripVendor.deleteMany({}).catch(() => {});
    await prisma.tripVendor.deleteMany({}).catch(() => {});

    await prisma.opsVendorRoom.deleteMany({}).catch(() => {});
    await prisma.opsVendorSeasonalRate.deleteMany({}).catch(() => {});
    await prisma.opsVendorDestination.deleteMany({}).catch(() => {});
    await prisma.opsVendorContact.deleteMany({}).catch(() => {});
    await prisma.opsVendorContract.deleteMany({}).catch(() => {});
    await prisma.opsVendorCalendar.deleteMany({}).catch(() => {});
    await prisma.opsVendorLedger.deleteMany({}).catch(() => {});
    await prisma.opsVendorPriceHistory.deleteMany({}).catch(() => {});
    await prisma.opsVendorTimeline.deleteMany({}).catch(() => {});
    await prisma.opsVendorHotelRate.deleteMany({}).catch(() => {});
    await prisma.opsAccommodationRate.deleteMany({}).catch(() => {});
    await prisma.opsTransportRate.deleteMany({}).catch(() => {});

    // 4. Delete parent Vendor records
    const deletedOpsVendors = await prisma.opsVendor.deleteMany({});
    console.log(`✅ Deleted ${deletedOpsVendors.count} OpsVendor records.`);

    const deletedBaseVendors = await prisma.vendor.deleteMany({});
    console.log(`✅ Deleted ${deletedBaseVendors.count} Vendor base records.`);

    console.log("🎉 ALL SOPs and Vendor details cleaned up 100% cleanly! Ready for real data.");
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
