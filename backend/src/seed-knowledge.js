const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Travel Desk/Knowledge Base data...');

  // Get some trips
  const trips = await prisma.trip.findMany();
  if (trips.length === 0) {
    console.log('⚠️ No trips found to attach seed knowledge base records to. Please seed trips first.');
    return;
  }

  for (const trip of trips) {
    // Delete existing records to prevent duplicates
    await prisma.knowledgeSection.deleteMany({ where: { tripId: trip.id } });
    await prisma.tripNotice.deleteMany({ where: { tripId: trip.id } });

    // Seed Notices
    await prisma.tripNotice.createMany({
      data: [
        {
          tripId: trip.id,
          title: `Important Notice for ${trip.title}`,
          body: 'Ensure all passenger registrations are submitted at least 7 days before departure. Late permits will not be processed.',
        },
        {
          tripId: trip.id,
          title: 'Weather Update & High Altitude Guidelines',
          body: 'Pack heavy woollens and thermal wear. Avoid intensive physical exercise on Day 1 to prevent AMS (Acute Mountain Sickness).',
        }
      ]
    });

    // Seed Knowledge Sections
    const sections = [
      {
        tripId: trip.id,
        tabKey: 'Overview',
        title: 'Safety protocols & health advice',
        description: 'Complete health safety rules, medical check requirements, and high altitude rescue protocols.',
        itemCount: 8
      },
      {
        tripId: trip.id,
        tabKey: 'Overview',
        title: 'Local customs & etiquette',
        description: 'Important cultural information, local dress codes, environment rules, and sensitive region etiquette.',
        itemCount: 4
      },
      {
        tripId: trip.id,
        tabKey: 'Overview',
        title: 'Permit & regulatory requirements',
        description: 'Required identity proofs, inner-line permit processes, and forest department permissions.',
        itemCount: 6
      },
      {
        tripId: trip.id,
        tabKey: 'Overview',
        title: 'Network connectivity & communication',
        description: 'Detailing mobile coverage (BSNL/Jio/Airtel state-wise status) and emergency satellite networks.',
        itemCount: 3
      },
      {
        tripId: trip.id,
        tabKey: 'Sales Guide',
        title: 'Sales Pitch & USP Book',
        description: 'Key highlights, unique features, comparison points with competitors, and conversion arguments.',
        itemCount: 12
      },
      {
        tripId: trip.id,
        tabKey: 'Customer FAQs',
        title: 'Pre-departure traveler queries',
        description: 'Answers for electricity, hot water availability, luggage rules, age limits, and diet options.',
        itemCount: 25
      },
      {
        tripId: trip.id,
        tabKey: 'Itinerary',
        title: 'Detailed Day-by-Day Walkthrough',
        description: 'Exact times, coordinates, activities, transit milestones, altitude levels, and guide coordinates.',
        itemCount: 7
      },
      {
        tripId: trip.id,
        tabKey: 'Ticketing SOPs',
        title: 'Train & bus booking timeline',
        description: 'Ticketing queues map, senior approvals flow, verification details, and quota priorities.',
        itemCount: 5
      },
      {
        tripId: trip.id,
        tabKey: 'Operational SOPs',
        title: 'Guide and Driver assignment checklist',
        description: 'Operational checklist, guide reporting logs, vendor cost allocations, and emergency contact lists.',
        itemCount: 9
      },
      {
        tripId: trip.id,
        tabKey: 'Destination Guide',
        title: 'Weather patterns, history and terrain',
        description: 'Deep geography details, local market guides, must-try cafes, and cultural backgrounds.',
        itemCount: 14
      },
      {
        tripId: trip.id,
        tabKey: 'Packing Guide',
        title: 'Gear recommendations and check-list',
        description: 'Detailed layers guide, medical kit contents, shoes specs, electronic backups, and bags limits.',
        itemCount: 19
      },
      {
        tripId: trip.id,
        tabKey: 'Pricing & Policies',
        title: 'Refund, cancellation and transfer policy',
        description: 'Trip rescheduling, refund margins, credit voucher policy, and custom packages policies.',
        itemCount: 10
      },
      {
        tripId: trip.id,
        tabKey: 'Documents',
        title: 'Mandatory certificates and templates',
        description: 'Medical certificate templates, self-declaration forms, minor parent consent documents.',
        itemCount: 4
      },
      {
        tripId: trip.id,
        tabKey: 'Emergency Procedures',
        title: 'Crisis response, evacuation routes, and contacts',
        description: 'List of nearest hospitals, army posts, local coordinators, and SOS evacuation procedures.',
        itemCount: 8
      },
      {
        tripId: trip.id,
        tabKey: 'Vendor Directory',
        title: 'Local operator contacts & reviews',
        description: 'Authorized vendors, guides ratings, stays operators, and vehicle drivers numbers list.',
        itemCount: 11
      }
    ];

    // Add Visa Information specifically for international trips
    if (trip.tripType === 'international' || trip.category === 'international' || trip.location.toLowerCase().includes('vietnam') || trip.location.toLowerCase().includes('thailand') || trip.location.toLowerCase().includes('nepal') || trip.location.toLowerCase().includes('bhutan')) {
      sections.push({
        tripId: trip.id,
        tabKey: 'Visa Information',
        title: 'E-visa application & immigration process',
        description: 'Step by step guide to visa applications, fees, passport requirements, and immigration checkpoint rules.',
        itemCount: 5
      });
    }

    await prisma.knowledgeSection.createMany({
      data: sections
    });
  }

  console.log('✅ Travel Desk/Knowledge Base data successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
