const { prisma } = require('../backend/src/lib/prisma');

async function migrate() {
  console.log('--- DB MIGRATION STABILIZATION START ---');

  // 1. Update Admin Email
  console.log('Updating Admin email...');
  const updatedAdmin = await prisma.admin.updateMany({
    where: { email: 'admin@youthcamping.in' },
    data: { email: 'admin@youthcamping.online' }
  });
  console.log(`Updated ${updatedAdmin.count} Admin record(s).`);

  // 2. Update Trip MKA1 bookingUrl
  console.log('Updating Trip MKA1 bookingUrl...');
  const trip = await prisma.trip.findUnique({ where: { id: 'MKA1' } });
  if (trip && trip.bookingUrl) {
    const newBookingUrl = trip.bookingUrl.replace('youthcamping.in', 'youthcamping.online');
    await prisma.trip.update({
      where: { id: 'MKA1' },
      data: { bookingUrl: newBookingUrl }
    });
    console.log(`Successfully updated Trip MKA1 bookingUrl to: ${newBookingUrl}`);
  } else {
    console.log('Trip MKA1 not found or has no bookingUrl.');
  }

  // 3. Update global settings
  console.log('Updating global setting values...');
  const globalSetting = await prisma.setting.findUnique({ where: { key: 'global' } });
  if (globalSetting && globalSetting.value) {
    const val = globalSetting.value;
    
    // Replace youthcamping.in with youthcamping.online
    if (val.logo) val.logo = val.logo.replace('youthcamping.in', 'youthcamping.online');
    if (val.contactEmail) val.contactEmail = val.contactEmail.replace('youthcamping.in', 'youthcamping.online');
    if (val.socialLinks && val.socialLinks.instagram) {
      val.socialLinks.instagram = val.socialLinks.instagram.replace('youthcamping.in', 'youthcamping.online');
    }
    if (val.organization) {
      if (val.organization.logo) val.organization.logo = val.organization.logo.replace('youthcamping.in', 'youthcamping.online');
      if (val.organization.website) val.organization.website = val.organization.website.replace('youthcamping.in', 'youthcamping.online');
      if (val.organization.supportEmail) val.organization.supportEmail = val.organization.supportEmail.replace('youthcamping.in', 'youthcamping.online');
    }

    await prisma.setting.update({
      where: { key: 'global' },
      data: { value: val }
    });
    console.log('Successfully updated global setting configuration.');
  } else {
    console.log('Global setting not found.');
  }

  // 4. Update global_settings configuration
  console.log('Updating global_settings configuration...');
  const globalSettings = await prisma.setting.findUnique({ where: { key: 'global_settings' } });
  if (globalSettings && globalSettings.value) {
    const val = globalSettings.value;
    if (val.socialLinks && val.socialLinks.instagram) {
      val.socialLinks.instagram = val.socialLinks.instagram.replace('youthcamping.in', 'youthcamping.online');
    }
    
    await prisma.setting.update({
      where: { key: 'global_settings' },
      data: { value: val }
    });
    console.log('Successfully updated global_settings configuration.');
  } else {
    console.log('global_settings setting not found.');
  }

  console.log('--- DB MIGRATION STABILIZATION END ---');
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
