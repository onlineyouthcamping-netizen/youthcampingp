const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    const settings = {
      siteName: "YouthCamping",
      contactEmail: "info@youthcamping.in",
      contactPhone: "99242 46267",
      address: "Money Plant High Street, A 738, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470",
      currency: "INR",
      socialLinks: {
        facebook: "https://facebook.com/youthcamping",
        instagram: "https://instagram.com/youthcamping.in",
        twitter: "https://twitter.com/youthcamping",
        youtube: "https://youtube.com/youthcamping",
        linkedin: "https://linkedin.com/company/youthcamping"
      },
      logo: "https://youthcamping.in/wp-content/uploads/2024/05/youthcamping-logo.png", // Just a placeholder if broken
      favicon: "/favicon.ico",
      organization: {
        name: "YouthCamping",
        logo: "https://youthcamping.in/wp-content/uploads/2024/05/youthcamping-logo.png",
        website: "https://youthcamping.in",
        supportEmail: "info@youthcamping.in",
        supportPhone: "99242 46267",
        mailingAddress: "Money Plant High Street, A 738, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470"
      }
    };

    await prisma.setting.upsert({
      where: { key: 'global' },
      update: { value: settings },
      create: { key: 'global', value: settings }
    });

    console.log('Global settings seeded successfully!');
  } catch (err) {
    console.error('Error seeding settings:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
