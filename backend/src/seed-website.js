require('./lib/env');
const { prisma } = require('./lib/prisma');

const defaultPages = [
  {
    slug: 'about-us',
    title: 'About Us',
    metaTitle: 'About Us — YouthCamping Adventure Expeditions',
    metaDescription: 'Discover the story, team, and mountain philosophy behind YouthCamping adventure trips.',
    published: true,
    content: {
      tagline: 'OUR STORY & PHILOSOPHY',
      headlinePrefix: 'REDEFINING THE',
      strikethroughWord: 'ORDINARY',
      subheadline: 'YouthCamping was born from a passion for raw, untouched landscapes and authentic group travels across India and beyond.',
      body: `<p>Founded in 2018, YouthCamping started as a group of passionate mountain enthusiasts exploring the high passes of Himachal Pradesh and Ladakh. Today, we are one of India's leading experiential travel platforms.</p><p>We believe that the best stories are written off the beaten path — sipping hot chai at 14,000 feet, stargazing at remote high-altitude campsites, or exploring ancient Himalayan villages.</p><p>Every itinerary is designed with meticulous detail — from handpicked cozy homestays to experienced local drivers and certified trip captains who ensure 100% safety and top-tier hospitality.</p>`
    }
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    metaTitle: 'Contact Us — 24/7 Expedition Assistance',
    metaDescription: 'Have questions about an upcoming trip or need custom group travel planning? Contact YouthCamping destination experts.',
    published: true,
    content: {
      tagline: '24/7 EXPEDITION SUPPORT',
      headlinePrefix: 'CONTACT',
      subheadline: 'Have questions about an upcoming trek or need custom group planning? Talk to our destination experts.',
      body: `<h2>Headquarters Address</h2><p>Money Plant High Street, A 738, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470</p><h2>Call & WhatsApp Hotline</h2><p>+91 99242 46267 (Available 10 AM - 8 PM IST)</p><h2>Email Assistance</h2><p>youthcampingmedia@gmail.com</p>`
    }
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    metaTitle: 'Terms & Conditions — YouthCamping',
    metaDescription: 'Please read our terms and conditions before booking any adventure trip with YouthCamping.',
    published: true,
    content: {
      tagline: 'LEGAL POLICIES & GUIDELINES',
      headlinePrefix: 'TERMS & CONDITIONS',
      subheadline: 'Please read these terms carefully before booking any adventure expedition with YouthCamping.',
      body: `<h2>01. Declaration & Voluntary Participation</h2><p>By booking a trip with YouthCamping, you declare that you are participating in this adventure & leisure trip on your own free will and at your own risk. Remote mountain exploration carries inherent terrain and climate risks.</p><p>YouthCamping, its trip captains, and affiliated partners shall not be held liable for personal injury, illness, or loss/damage to personal baggage resulting from participant negligence or unapproved hazardous activities.</p><h2>02. Booking & Payment Terms</h2><p>A minimum deposit is required at time of booking to reserve seats. Full remaining balance must be cleared at least 7 days prior to departure date.</p><h2>03. Code of Conduct & Captain Authority</h2><p>Participants are expected to respect local mountain cultures, environmental guidelines, and fellow group travelers. The decision of the assigned trip captain is final in all matters of group safety.</p>`
    }
  },
  {
    slug: 'cancellation-policy',
    title: 'Cancellation Policy',
    metaTitle: 'Cancellation Policy & Refund Timelines — YouthCamping',
    metaDescription: 'Transparent refund timelines and trip cancellation policy.',
    published: true,
    content: {
      tagline: 'TRANSPARENT REFUND TIMELINES',
      headlinePrefix: 'CANCELLATION POLICY',
      subheadline: 'We understand plans can change. Here is our transparent refund and cancellation policy.',
      body: `<h2>01. Cancellation Request Timelines</h2><p>Cancellation 30+ days before trip start: 90% refund or 100% trip voucher.</p><p>Cancellation 15-30 days before trip start: 50% refund or 75% trip voucher.</p><p>Cancellation less than 15 days before trip start: Non-refundable due to pre-booked hotel, transport & permit commitments.</p><h2>02. Unforeseen Weather & Natural Calamities</h2><p>In case of trip cancellation due to unexpected landslides, snow blockages, or government advisories, a trip credit voucher of equal value will be issued for future travel within 12 months.</p>`
    }
  }
];

const defaultSettings = [
  {
    key: 'navigation',
    value: [
      { id: 'nav-home', label: 'Home', href: '/', visible: true },
      { id: 'nav-trips', label: 'Trips', href: '/trips', visible: true },
      { id: 'nav-about', label: 'About Us', href: '/about-us', visible: true },
      { id: 'nav-contact', label: 'Contact Us', href: '/contact', visible: true },
    ]
  },
  {
    key: 'brand_settings',
    value: {
      brandName: 'YOUTHCAMPING',
      tagline: 'Adventure Tours for Young India',
      supportPhone: '+91 99242 46267',
      supportEmail: 'youthcampingmedia@gmail.com',
      address: 'Money Plant High Street, A 738, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470'
    }
  }
];

async function seed() {
  console.log('🌱 Seeding default WebsitePages and WebsiteSettings into database...');

  for (const page of defaultPages) {
    await prisma.websitePage.upsert({
      where: { slug: page.slug },
      update: {}, // Don't overwrite if already exists
      create: page
    });
    console.log(`  ✓ Page: /${page.slug}`);
  }

  for (const setting of defaultSettings) {
    await prisma.websiteSetting.upsert({
      where: { key: setting.key },
      update: {}, // Don't overwrite if already exists
      create: setting
    });
    console.log(`  ✓ Setting: ${setting.key}`);
  }

  console.log('✅ Website seed complete!');
}

seed()
  .catch((err) => {
    console.error('❌ Website seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
