/**
 * Database Seed Script for 7 YouthCamping Backend API Endpoints
 */

const { prisma: defaultPrisma } = require('../utils/database');

async function seedData(customPrisma) {
  const prisma = customPrisma || defaultPrisma;
  console.log('🌱 Seeding database for YouthCamping 7 API Endpoints...');

  try {
    // 1. Seed Destinations
    console.log('📌 Seeding Destinations...');
    await prisma.destination.deleteMany({});
    await prisma.destination.createMany({
      data: [
        {
          id: 1,
          name: 'Sunset Over Palms',
          image: 'https://cdn.youthcamping.in/destinations/sunset.jpg',
          order: 1,
        },
        {
          id: 2,
          name: 'Mountain Peak',
          image: 'https://cdn.youthcamping.in/destinations/mountain.jpg',
          order: 2,
        },
        {
          id: 3,
          name: 'Golden Valley Trails',
          image: 'https://cdn.youthcamping.in/destinations/valley.jpg',
          order: 3,
        },
        {
          id: 4,
          name: 'Serene River Banks',
          image: 'https://cdn.youthcamping.in/destinations/river.jpg',
          order: 4,
        },
        {
          id: 5,
          name: 'High Himalayan Pass',
          image: 'https://cdn.youthcamping.in/destinations/himalayas.jpg',
          order: 5,
        },
      ],
    });

    // 2. Seed Stories
    console.log('📌 Seeding Stories...');
    await prisma.story.deleteMany({});
    await prisma.story.createMany({
      data: [
        {
          id: 'story-1',
          title: 'The Pristine Colors of Kasol: Riverside Cafes & Parvati Valley Trails',
          author: 'Siddharth',
          avatar: 'https://cdn.youthcamping.in/avatars/siddharth.jpg',
          readTime: 5,
          image: 'https://cdn.youthcamping.in/stories/kasol.jpg',
          slug: 'pristine-colors-kasol',
          excerpt: 'Explore the riverside cafes and stunning valley trails of Kasol with our essential backpacking guide...',
          publishedAt: '2026-07-20',
          featured: true,
        },
        {
          id: 'story-2',
          title: 'Unlocking Spiti Valley: High Altitude Monasteries and Cold Desert Dreams',
          author: 'Aanya',
          avatar: 'https://cdn.youthcamping.in/avatars/aanya.jpg',
          readTime: 7,
          image: 'https://cdn.youthcamping.in/stories/spiti.jpg',
          slug: 'unlocking-spiti-valley',
          excerpt: 'Journey into the heart of Spiti Valley and experience ancient monasteries, moonlit lakes, and endless trails...',
          publishedAt: '2026-07-15',
          featured: true,
        },
        {
          id: 'story-3',
          title: 'Wagah Border & Golden Temple: Spiritual & Patriotic Soul of Amritsar',
          author: 'Vikram',
          avatar: 'https://cdn.youthcamping.in/avatars/vikram.jpg',
          readTime: 4,
          image: 'https://cdn.youthcamping.in/stories/amritsar.jpg',
          slug: 'amritsar-spiritual-patriotism',
          excerpt: 'Feel the electrifying energy at Wagah Border and peaceful bliss at the Golden Temple in Punjab...',
          publishedAt: '2026-07-10',
          featured: true,
        },
      ],
    });

    // 3. Seed Trips & Related Tables
    console.log('📌 Seeding Trips & Relations...');

    // Delete existing relation records
    await prisma.faq.deleteMany({});
    await prisma.reviewItem.deleteMany({});
    await prisma.highlight.deleteMany({});
    await prisma.stay.deleteMany({});
    await prisma.exclusion.deleteMany({});
    await prisma.inclusion.deleteMany({});
    await prisma.itineraryItem.deleteMany({});
    await prisma.roomSharing.deleteMany({});
    await prisma.travelMode.deleteMany({});
    await prisma.tripDetail.deleteMany({});
    await prisma.apiTrip.deleteMany({});

    // Upsert Trip 1: Manali Kasol Amritsar
    const trip1 = await prisma.apiTrip.create({
      data: {
        id: 'mka-1',
        title: 'Manali Kasol Amritsar',
        subtitle: 'Backpacking Trip',
        location: 'HIMACHAL PRADESH & PUNJAB',
        image: 'https://cdn.youthcamping.in/trips/mka-1.jpg',
        galleryImages: [
          'https://cdn.youthcamping.in/trips/mka-1-1.jpg',
          'https://cdn.youthcamping.in/trips/mka-1-2.jpg',
          'https://cdn.youthcamping.in/trips/mka-1-3.jpg',
          'https://cdn.youthcamping.in/trips/mka-1-4.jpg',
        ],
        description: 'Get ready for an unforgettable journey through Northern India! Explore the picturesque mountain views of Manali, chilled riverside vibes of Kasol, and spiritual tranquility of Amritsar.',
        price: 12999,
        currency: 'INR',
        difficulty: 'Easy to moderate',
        ageGroup: '12-35 years',
        maxAltitude: '10,000 ft',
        durationNights: 8,
        durationDays: 9,
        slug: 'manali-kasol-amritsar',
        month: 'August',
        details: {
          create: {
            nights: 8,
            days: 9,
            month: 'August',
            departureMonth: ['August', 'September', 'October'],
            departureDates: {
              August: [2, 3, 9, 10, 16, 17, 23],
              September: [4, 8, 10, 20, 25],
            },
          },
        },
        travelModes: {
          create: [
            {
              id: 'mode-1',
              name: 'NON AC SLEEPER',
              price: 0,
              included: true,
              description: 'Budget-friendly sleeper class train',
            },
            {
              id: 'mode-2',
              name: '3 AC TRAIN',
              price: 2000,
              included: false,
              description: 'Air-conditioned train with 3 berths',
            },
          ],
        },
        roomSharing: {
          create: [
            {
              id: 'room-1',
              type: 'Quad Sharing (4 Person)',
              price: 0,
              base: true,
              description: 'Share room with 3 others',
            },
            {
              id: 'room-2',
              type: 'Triple Sharing',
              price: 999,
              base: false,
              description: 'Share room with 2 others',
            },
            {
              id: 'room-3',
              type: 'Double Sharing',
              price: 2500,
              base: false,
              description: 'Share room with 1 other',
            },
          ],
        },
        itinerary: {
          create: [
            {
              day: 1,
              title: 'Train Journey to Jalandhar',
              description: 'Board your train and begin your adventure...',
              location: 'Jalandhar',
              activities: ['Train journey'],
            },
            {
              day: 2,
              title: 'Visit Wagha Border & Golden Temple',
              description: 'Explore the vibrant culture of Amritsar...',
              location: 'Amritsar',
              activities: ['Border visit', 'Temple visit'],
            },
            {
              day: 3,
              title: 'Arrival in Kasol & Riverside Relaxation',
              description: 'Reach Kasol, check into riverside cottages and enjoy local cafe culture...',
              location: 'Kasol',
              activities: ['Cafe hopping', 'Riverside walk'],
            },
          ],
        },
        inclusions: {
          create: [
            {
              id: 'inc-1',
              text: 'Meals as per the detailed itinerary',
              icon: 'utensils',
            },
            {
              id: 'inc-2',
              text: 'Complimentary Adventurous Rope Activities',
              icon: 'rope',
            },
          ],
        },
        exclusions: {
          create: [
            {
              id: 'exc-1',
              text: 'Food during travelling',
              icon: 'cross',
            },
            {
              id: 'exc-2',
              text: 'Paid Activities like paragliding',
              icon: 'cross',
            },
          ],
        },
        stays: {
          create: [
            {
              id: 'stay-1',
              name: 'Kasol Riverside Cottages',
              location: 'Kasol, Himachal Pradesh',
              image: 'https://cdn.youthcamping.in/stays/kasol-riverside.jpg',
              nights: 2,
              amenities: ['WiFi', 'Hot Water', 'Restaurant'],
              tags: ['Riverside Location', 'Cozy Cottages'],
            },
          ],
        },
        highlights: {
          create: [
            {
              id: 'hl-1',
              image: 'https://cdn.youthcamping.in/highlights/kasol.jpg',
              title: 'Kasol Beauty',
            },
          ],
        },
        reviews: {
          create: [
            {
              id: 'review-1',
              author: 'Bhumit Rabadiya',
              avatar: 'https://cdn.youthcamping.in/avatars/bhumit.jpg',
              date: '2026-07-29',
              rating: 5,
              text: 'Thank you for crafting a trip that perfectly matched our style! The team was super helpful and everything ran on time.',
              images: ['https://cdn.youthcamping.in/reviews/bhumit-1.jpg'],
              featured: true,
              tripName: 'Manali Kasol Amritsar',
              tripSlug: 'manali-kasol-amritsar',
            },
          ],
        },
        faqs: {
          create: [
            {
              id: 'faq-1',
              question: 'What Will Be the Group Size?',
              answer: 'Group size typically ranges from 15-30 travelers to ensure a fun community experience.',
            },
          ],
        },
      },
    });

    // Seed Trip 2: Spiti Valley Circuit
    const trip2 = await prisma.apiTrip.create({
      data: {
        id: 'spiti-1',
        title: 'Spiti Valley Expedition',
        subtitle: 'High Altitude Expedition',
        location: 'HIMACHAL PRADESH',
        image: 'https://cdn.youthcamping.in/trips/spiti-1.jpg',
        galleryImages: [
          'https://cdn.youthcamping.in/trips/spiti-1-1.jpg',
          'https://cdn.youthcamping.in/trips/spiti-1-2.jpg',
        ],
        description: 'Explore the rugged high-altitude cold desert of Spiti Valley, visit Key Monastery, and stargaze at Chandratal Lake.',
        price: 18999,
        currency: 'INR',
        difficulty: 'Moderate to Challenging',
        ageGroup: '18-40 years',
        maxAltitude: '15,000 ft',
        durationNights: 7,
        durationDays: 8,
        slug: 'spiti-valley-expedition',
        month: 'September',
        details: {
          create: {
            nights: 7,
            days: 8,
            month: 'September',
            departureMonth: ['September', 'October'],
            departureDates: {
              September: [5, 12, 19, 26],
            },
          },
        },
        travelModes: {
          create: [
            {
              id: 'mode-spiti-1',
              name: 'TEMPO TRAVELLER',
              price: 0,
              included: true,
              description: 'Shared Tempo Traveller from Delhi/Chandigarh',
            },
          ],
        },
        roomSharing: {
          create: [
            {
              id: 'room-spiti-1',
              type: 'Triple Sharing',
              price: 0,
              base: true,
              description: 'Share room with 2 others',
            },
          ],
        },
        itinerary: {
          create: [
            {
              day: 1,
              title: 'Drive from Shimla to Kalpa',
              description: 'Scenic mountain drive passing through Kinnaur valley...',
              location: 'Kalpa',
              activities: ['Scenic drive', 'Sunset view'],
            },
          ],
        },
        inclusions: {
          create: [
            {
              id: 'inc-spiti-1',
              text: 'Breakfast and Dinner daily',
              icon: 'utensils',
            },
          ],
        },
        exclusions: {
          create: [
            {
              id: 'exc-spiti-1',
              text: 'Personal expenses & tips',
              icon: 'cross',
            },
          ],
        },
        stays: {
          create: [
            {
              id: 'stay-spiti-1',
              name: 'Kaza Heights Guesthouse',
              location: 'Kaza, Spiti Valley',
              image: 'https://cdn.youthcamping.in/stays/kaza.jpg',
              nights: 3,
              amenities: ['Hot Water', 'Restaurant'],
              tags: ['Mountain View'],
            },
          ],
        },
        highlights: {
          create: [
            {
              id: 'hl-spiti-1',
              image: 'https://cdn.youthcamping.in/highlights/key-monastery.jpg',
              title: 'Key Monastery Visit',
            },
          ],
        },
        reviews: {
          create: [
            {
              id: 'review-2',
              author: 'Priya Sharma',
              avatar: 'https://cdn.youthcamping.in/avatars/priya.jpg',
              date: '2026-07-25',
              rating: 5,
              text: 'Spiti with YouthCamping was magical! Unforgettable stargazing at Chandratal.',
              images: ['https://cdn.youthcamping.in/reviews/priya-1.jpg'],
              featured: true,
              tripName: 'Spiti Valley Expedition',
              tripSlug: 'spiti-valley-expedition',
            },
          ],
        },
        faqs: {
          create: [
            {
              id: 'faq-spiti-1',
              question: 'Is acclimatization required for Spiti?',
              answer: 'Yes, we follow a gradual ascent route starting from Shimla/Kalpa to avoid AMS.',
            },
          ],
        },
      },
    });

    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    throw err;
  }
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = seedData;
