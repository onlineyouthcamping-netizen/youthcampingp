const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // MKA-1 Manali Kasol Amritsar
  await prisma.trip.update({
    where: { id: 'MKA-1' },
    data: {
      price: 12999, // Base price for Non-AC Sleeper from Ahmedabad
      variants: [
        { location: 'Ahmedabad/Gandhinagar (NON AC SL)', duration: '9D/8N', discountedPrice: 12999 },
        { location: 'Ahmedabad/Gandhinagar (3TIER AC)', duration: '9D/8N', discountedPrice: 14999 },
        { location: 'Mumbai (NON AC SLEEPER)', duration: '9D/8N', discountedPrice: 14999 },
        { location: 'Vadodara/Surat (NON AC SLEEPER)', duration: '9D/8N', discountedPrice: 13699 },
        { location: 'Delhi to Delhi (Without Amritsar)', duration: '8D/7N', discountedPrice: 13999 },
        { location: 'Jalandhar or Kasol (Direct)', duration: '8D/7N', discountedPrice: 12999, excludeTravel: true }
      ],
      roomOptions: [
        { label: 'Quad Sharing (4 Person)', priceDelta: 0 },
        { label: 'Triple Sharing', priceDelta: 999 }
      ],
      travelOptions: [],
      addons: [
        { label: 'Festival Dates Surcharge', price: 999 }
      ]
    }
  });

  // SPT-1 Spiti Valley
  await prisma.trip.update({
    where: { id: 'SPT-1' },
    data: {
      price: 19999,
      variants: [
        { location: 'Chandigarh to Chandigarh', duration: '11D/10N', discountedPrice: 19999, excludeTravel: true },
        { location: 'Ahmedabad (Non-AC Sleeper Train)', duration: '11D/10N', discountedPrice: 21499 },
        { location: 'Ahmedabad (3 Tier AC Train)', duration: '11D/10N', discountedPrice: 23499 }
      ],
      roomOptions: [],
      travelOptions: [],
      addons: []
    }
  });

  // WSPT-1 Winter Spiti
  await prisma.trip.update({
    where: { id: 'WSPT-1' },
    data: {
      price: 19999,
      variants: [
        { location: 'Chandigarh to Chandigarh', duration: '10D/9N', discountedPrice: 19999, excludeTravel: true },
        { location: 'Ahmedabad (NON AC SL TRAIN)', duration: '10D/9N', discountedPrice: 21499 },
        { location: 'Ahmedabad (3TIER AC TRAIN)', duration: '10D/9N', discountedPrice: 23499 }
      ],
      roomOptions: [
        { label: 'Triple/Quad Sharing', priceDelta: 0 },
        { label: 'Double Sharing', priceDelta: 3000 }
      ],
      travelOptions: [],
      addons: [
        { label: 'Extra Surcharge for 18 & 25 DEC', price: 1500 }
      ]
    }
  });

  // KRL-1 Kerala
  await prisma.trip.update({
    where: { id: 'KRL-1' },
    data: {
      price: 19999,
      variants: [
        { location: 'Cochin To Cochin', duration: '9D/8N', discountedPrice: 19999, excludeTravel: true },
        { location: 'Ahmedabad (Non-AC)', duration: '9D/8N', discountedPrice: 22499 },
        { location: 'Ahmedabad (3AC Train)', duration: '9D/8N', discountedPrice: 24999 }
      ],
      roomOptions: [
        { label: 'Triple Sharing', priceDelta: 0 },
        { label: 'Double Sharing (3AC Base)', priceDelta: 2000 } // Because double sharing 3AC is 26,999 vs 24,999
      ],
      travelOptions: [],
      addons: [
        { label: 'House Boat Premium', price: 2499 },
        { label: 'Extra Stay Cochin', price: 999 }
      ]
    }
  });

  console.log("All pricing and variants aligned perfectly!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
