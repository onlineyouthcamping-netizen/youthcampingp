const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const reviewsData = [
  {
    userName: "Zeel",
    instagram: "@_zeel_1608",
    tripSearch: "Manali",
    comment: "Had an amazing time on the Manali-Kasol trip. The vibes, people & memories were truly unforgettable. Everything was fun, smooth and full of adventure. Can't wait for the next trip already!"
  },
  {
    userName: "Neeki",
    instagram: "@neeki_0606",
    tripSearch: "Spiti",
    comment: "Spiti was pure magic. Crazy roads, breathtaking views & unforgettable moments throughout the journey. Every day felt like a new adventure. Definitely a once in a lifetime experience."
  },
  {
    userName: "Suru Chaudhary",
    instagram: "@suru_chaudhary2927",
    tripSearch: "Kerala",
    comment: "Kerala was full of peace, fun & beautiful vibes. From beaches to backwaters, every moment felt refreshing. The whole trip was relaxing and memorable. So many beautiful memories made together."
  },
  {
    userName: "Vidhi",
    instagram: "@vidhiithummar",
    tripSearch: "Manali",
    comment: "Had an amazing time on the Manali-Kasol trip. The vibes, people & memories were truly unforgettable. Everything was fun, smooth and full of adventure. Can't wait for the next trip already!"
  }
]

async function seed() {
  console.log('🌱 Updating reviews with Instagram handles (field: instagram)...')
  
  // Clear old ones first to avoid duplicates
  await prisma.review.deleteMany({})

  for (const r of reviewsData) {
    try {
      const trip = await prisma.trip.findFirst({
        where: { title: { contains: r.tripSearch, mode: 'insensitive' } }
      })
      
      await prisma.review.create({
        data: {
          userName: r.userName,
          instagram: r.instagram,
          comment: r.comment,
          rating: 5,
          tripId: trip ? trip.id : null,
          isActive: true,
          tenantId: 'default'
        }
      })
      console.log(`✅ Added review for ${r.userName} (${r.instagram})`)
    } catch (e) {
      console.error(`❌ Failed: ${r.userName}:`, e.message)
    }
  }
  
  console.log('🏁 DONE')
  await prisma.$disconnect()
}

seed().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
