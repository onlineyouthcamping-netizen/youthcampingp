const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

// Mapping of old IDs to their expected titles/slugs for validation,
// and their new replacement IDs (based on actual database trips).
// Let's build a mapping of known old slugs to new database IDs.
const OLD_TRIP_INFO = {
  "cmqmci2y00001llvajjevqan2": { title: "Leh Ladakh Bike Expedition 2026", slug: "leh-ladakh-bike-expedition-2026" },
  "cmqmci4ky0003llvarw8kyrkp": { title: "Kedarnath Badrinath - Tungnath & Rishikesh", slug: "kedarnath-badrinath-tungnath-rishikesh" },
  "cmqmci4p10004llvaa1uoddlu": { title: "Shimla Manali Dalhousie Dharamshala", slug: "shimla-manali-dalhousie-dharamshala" },
  "cmqmci4tk0005llva1gp5p54n": { title: "Kerala Getaway", slug: "kerala-getaway" },
  "cmqmci4yz0006llvaowf2ojb2": { title: "Spiti Valley Road Trip", slug: "spiti-valley-road-trip" },
  "CMQMCI53S0007LLVAJDIR94UG": { title: "Bali Tour Package", slug: "bali-tour-package" },
  "cmqmci2ma0000llvaepmle8lb": { title: "Meghalaya Backpacking", slug: "meghalaya-backpacking" },
  "cmqmci32w0002llvahlpuozmk": { title: "Kashmir Paradise Group Tour", slug: "kashmir-paradise-group-tour" }
};

async function migrate() {
  console.log(`=== PageBuilder Migration Script ===`);
  console.log(`Dry Run Mode: ${DRY_RUN ? 'ON' : 'OFF'}\n`);

  // 1. Fetch active trips in database
  const activeTrips = await prisma.trip.findMany({
    where: { status: 'published', isActive: true }
  });
  console.log(`Found ${activeTrips.length} active published trips in DB:`);
  activeTrips.forEach(t => console.log(` - ID: ${t.id} | Slug: ${t.slug} | Title: ${t.title}`));
  console.log('');

  // 2. Fetch homepage PageBuilder record
  const page = await prisma.pageBuilder.findUnique({
    where: { name: 'home' }
  });

  if (!page) {
    console.error('❌ Homepage PageBuilder record not found in database.');
    return;
  }

  // Backup folder
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, `pagebuilder_home_backup_${Date.now()}.json`);
  if (!DRY_RUN) {
    fs.writeFileSync(backupPath, JSON.stringify(page, null, 2));
    console.log(`💾 Backup of current PageBuilder layout written to: ${backupPath}`);
  } else {
    console.log(`[Dry-Run] Would create backup at: ${backupPath}`);
  }

  // Parse sections and draft
  let sections = typeof page.sections === 'string' ? JSON.parse(page.sections) : (page.sections || []);
  let draft = typeof page.draft === 'string' ? JSON.parse(page.draft) : (page.draft || []);

  let changeLog = [];

  // Helper to map trip IDs safely based on matching slugs/titles, falling back to active trip IDs
  function mapTripIds(oldIds) {
    if (!Array.isArray(oldIds)) return [];
    
    return oldIds.map(oldId => {
      // Find the info for the old ID
      const oldInfo = OLD_TRIP_INFO[oldId];
      if (oldInfo) {
        // Find if we have an active trip matching the slug
        const matchingTrip = activeTrips.find(t => t.slug === oldInfo.slug);
        if (matchingTrip) {
          changeLog.push(`Mapped old ID '${oldId}' (${oldInfo.title}) to new ID '${matchingTrip.id}' (${matchingTrip.title})`);
          return matchingTrip.id;
        }
      }
      
      // Fallback: If there is no specific slug match, map it to the first active trip if any exist
      if (activeTrips.length > 0) {
        const fallbackTrip = activeTrips[0];
        changeLog.push(`Fallback: Mapped old ID '${oldId}' to active ID '${fallbackTrip.id}' (${fallbackTrip.title})`);
        return fallbackTrip.id;
      }
      
      changeLog.push(`Warning: No replacement found for old ID '${oldId}'`);
      return oldId;
    });
  }

  // Update upcoming_trips section in sections
  let sectionsChanged = false;
  sections = sections.map(sec => {
    if (sec.type === 'upcoming_trips') {
      const oldIds = sec.draft?.tripIds || sec.content?.tripIds || [];
      const newIds = mapTripIds(oldIds);
      
      if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
        if (sec.draft) sec.draft.tripIds = newIds;
        if (sec.content) sec.content.tripIds = newIds;
        sectionsChanged = true;
      }
    }
    return sec;
  });

  // Update upcoming_trips section in draft
  let draftChanged = false;
  draft = draft.map(sec => {
    if (sec.type === 'upcoming_trips') {
      const oldIds = sec.draft?.tripIds || sec.content?.tripIds || [];
      const newIds = mapTripIds(oldIds);
      
      if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
        if (sec.draft) sec.draft.tripIds = newIds;
        if (sec.content) sec.content.tripIds = newIds;
        draftChanged = true;
      }
    }
    return sec;
  });

  console.log('\n=== Change Log ===');
  if (changeLog.length === 0) {
    console.log('No changes needed. IDs are already aligned.');
  } else {
    // De-duplicate logs for display
    const uniqueLogs = Array.from(new Set(changeLog));
    uniqueLogs.forEach(log => console.log(` - ${log}`));
  }

  if (sectionsChanged || draftChanged) {
    if (DRY_RUN) {
      console.log('\n[Dry-Run] Changes would be saved to database.');
    } else {
      await prisma.pageBuilder.update({
        where: { name: 'home' },
        data: {
          sections: sections,
          draft: draft
        }
      });
      console.log('\n✅ Database PageBuilder home layout successfully updated!');
    }
  } else {
    console.log('\nNo updates required.');
  }
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
