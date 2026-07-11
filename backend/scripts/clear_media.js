const { prisma } = require('../src/lib/prisma');

async function main() {
  console.log("=== STARTING MEDIA URL PURGE FROM DATABASE ===");

  // 1. Clear Trip Media fields
  console.log("Clearing Trip media fields...");
  const trips = await prisma.trip.findMany();
  for (const trip of trips) {
    // Process itinerary JSON to remove day photos
    let updatedItinerary = null;
    if (trip.itinerary) {
      try {
        const itineraryList = typeof trip.itinerary === 'string' 
          ? JSON.parse(trip.itinerary) 
          : trip.itinerary;
        
        if (Array.isArray(itineraryList)) {
          updatedItinerary = itineraryList.map(day => ({
            ...day,
            photos: [] // clear day photos
          }));
        }
      } catch (e) {
        console.warn(`Could not parse itinerary for trip ${trip.id}:`, e);
      }
    }

    // Process attractions JSON to clear attraction images
    let updatedAttractions = null;
    if (trip.attractions) {
      try {
        const attractionList = typeof trip.attractions === 'string'
          ? JSON.parse(trip.attractions)
          : trip.attractions;
        
        if (Array.isArray(attractionList)) {
          updatedAttractions = attractionList.map(attr => ({
            ...attr,
            image: "" // clear attraction image
          }));
        }
      } catch (e) {
        console.warn(`Could not parse attractions for trip ${trip.id}:`, e);
      }
    }

    // Process accommodations JSON to clear accommodations gallery
    let updatedAccommodations = null;
    if (trip.accommodations) {
      try {
        const accList = typeof trip.accommodations === 'string'
          ? JSON.parse(trip.accommodations)
          : trip.accommodations;
        
        if (Array.isArray(accList)) {
          updatedAccommodations = accList.map(acc => ({
            ...acc,
            gallery: [] // clear accommodation gallery
          }));
        }
      } catch (e) {
        console.warn(`Could not parse accommodations for trip ${trip.id}:`, e);
      }
    }

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        heroImage: "",
        images: [],
        reels: [],
        itinerary: updatedItinerary || undefined,
        attractions: updatedAttractions || undefined,
        accommodations: updatedAccommodations || undefined
      }
    });
  }
  console.log(`Updated ${trips.length} Trips.`);

  // 2. Clear Blog Cover & Author Image fields
  console.log("Clearing Blog media fields...");
  const blogUpdate = await prisma.blog.updateMany({
    data: {
      image: "",
      authorImage: ""
    }
  });
  console.log(`Updated ${blogUpdate.count} Blogs.`);

  // 3. Clear Review Photos & User Image fields
  console.log("Clearing Review media fields...");
  const reviewUpdate = await prisma.review.updateMany({
    data: {
      userImage: "",
      photos: []
    }
  });
  console.log(`Updated ${reviewUpdate.count} Reviews.`);

  // 4. Clear PageBuilder sections (Homepage and other pages)
  console.log("Clearing PageBuilder sections layout media...");
  const pages = await prisma.pageBuilder.findMany();
  for (const page of pages) {
    const clearLayout = (layoutJson) => {
      if (!layoutJson) return [];
      try {
        const sections = typeof layoutJson === 'string' ? JSON.parse(layoutJson) : layoutJson;
        if (Array.isArray(sections)) {
          return sections.map(sec => {
            const draft = sec.draft || {};
            
            // Clear standard media fields in section drafts
            if (draft.videoUrl) draft.videoUrl = "";
            if (draft.videoPosterUrl) draft.videoPosterUrl = "";
            if (draft.image) draft.image = "";
            if (draft.url && (draft.url.includes("http") || draft.url.includes("uploads"))) draft.url = "";
            
            // Clear arrays inside drafts
            if (Array.isArray(draft.images)) {
              draft.images = [];
            }
            if (Array.isArray(draft.videos)) {
              draft.videos = draft.videos.map(v => ({
                ...v,
                url: "",
                img: "",
                videoUrl: "",
                videoPosterUrl: "",
                videoEnabled: false
              }));
            }
            if (Array.isArray(draft.reasons)) {
              draft.reasons = draft.reasons.map(r => ({
                ...r,
                image: ""
              }));
            }
            if (Array.isArray(draft.destinations)) {
              draft.destinations = draft.destinations.map(d => ({
                ...d,
                img: ""
              }));
            }
            if (Array.isArray(draft.items)) {
              draft.items = draft.items.map(item => ({
                ...item,
                image: ""
              }));
            }

            return {
              ...sec,
              draft
            };
          });
        }
      } catch (e) {
        console.warn(`Could not parse sections/draft for PageBuilder ${page.name}:`, e);
      }
      return layoutJson;
    };

    await prisma.pageBuilder.update({
      where: { id: page.id },
      data: {
        sections: clearLayout(page.sections),
        draft: clearLayout(page.draft)
      }
    });
  }
  console.log(`Updated ${pages.length} PageBuilder pages.`);

  // 5. Clear setting keys that hold logo, background video/images
  console.log("Clearing Setting media fields...");
  const settings = await prisma.setting.findMany();
  for (const setting of settings) {
    let val = setting.value;
    if (val && typeof val === 'object') {
      let isUpdated = false;
      
      const clearMediaFields = (obj) => {
        const keys = [
          'logo', 'heroVideoUrl', 'heroVideoPosterUrl', 'heroVideoPublicId', 
          'favicon', 'backgroundImage', 'defaultCover'
        ];
        keys.forEach(k => {
          if (obj[k] !== undefined) {
            obj[k] = "";
            isUpdated = true;
          }
        });
      };

      clearMediaFields(val);
      
      if (isUpdated) {
        await prisma.setting.update({
          where: { id: setting.id },
          data: { value: val }
        });
      }
    }
  }
  console.log("Finished updating Setting keys.");

  console.log("=== DATABASE MEDIA URL PURGE COMPLETED SUCCESSFULLY ===");
}

main()
  .catch(err => {
    console.error("Purge script failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
