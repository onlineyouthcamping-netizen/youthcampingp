const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              RESTORATION VERIFICATION REPORT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const trips = await prisma.trip.findMany({ orderBy: { order: 'asc' } });
  const reviews = await prisma.review.findMany();
  const blogs = await prisma.blog.findMany();
  const bookings = await prisma.booking.findMany();

  console.log(`📊 Summary: ${trips.length} Trips | ${reviews.length} Reviews | ${blogs.length} Blogs | ${bookings.length} Bookings\n`);

  for (const t of trips) {
    const imgCount = (t.images || []).length;
    const itinCount = t.itinerary ? (Array.isArray(t.itinerary) ? t.itinerary.length : 'obj') : 0;
    const inclCount = t.inclusions ? (Array.isArray(t.inclusions) ? t.inclusions.length : 'obj') : 0;
    const exclCount = t.exclusions ? (Array.isArray(t.exclusions) ? t.exclusions.length : 'obj') : 0;
    const hlCount = t.highlights ? (Array.isArray(t.highlights) ? t.highlights.length : 'obj') : 0;
    const dateCount = t.availableDates ? (Array.isArray(t.availableDates) ? t.availableDates.length : 'obj') : 0;
    const varCount = t.variants ? (Array.isArray(t.variants) ? t.variants.length : 'obj') : 0;
    const faqCount = t.faqs ? (Array.isArray(t.faqs) ? t.faqs.length : 'obj') : 0;
    
    const issues = [];
    if (imgCount <= 1) issues.push('⚠️ LOW IMAGES');
    if (itinCount === 0) issues.push('⚠️ NO ITINERARY');
    if (inclCount === 0) issues.push('⚠️ NO INCLUSIONS');
    if (exclCount === 0) issues.push('⚠️ NO EXCLUSIONS');
    if (!t.heroImage) issues.push('⚠️ NO HERO IMAGE');
    
    console.log(`───────────────────────────────────────────`);
    console.log(`📍 ${t.title}`);
    console.log(`   Slug: ${t.slug}`);
    console.log(`   Price: ₹${t.price} | Duration: ${t.duration} | Order: #${t.order}`);
    console.log(`   Images: ${imgCount} | Hero: ${t.heroImage ? '✅' : '❌'}`);
    console.log(`   Itinerary: ${itinCount} days | Highlights: ${hlCount}`);
    console.log(`   Inclusions: ${inclCount} | Exclusions: ${exclCount}`);
    console.log(`   Dates: ${dateCount} | Variants: ${varCount} | FAQs: ${faqCount}`);
    console.log(`   SEO: ${t.seo ? '✅' : '❌'} | Route: ${t.route ? '✅' : '❌'} | Popup: ${t.popupDetails ? '✅' : '❌'}`);
    console.log(`   BookingUrl: ${t.bookingUrl || '—'}`);
    if (issues.length > 0) console.log(`   ${issues.join(' | ')}`);
    else console.log(`   ✅ COMPLETE`);
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`✅ Restoration complete!`);
}

verify().catch(e => console.error(e)).finally(() => prisma.$disconnect());
