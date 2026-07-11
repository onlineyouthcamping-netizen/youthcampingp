const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function clear() {
  console.log('⚠️  CLEARING ALL DATA...')
  
  try {
    // Delete in order to handle foreign key constraints
    await prisma.booking.deleteMany({})
    await prisma.review.deleteMany({})
    await prisma.tripVendor.deleteMany({})
    await prisma.trip.deleteMany({})
    
    console.log('✅ ALL TRIPS, REVIEWS, AND BOOKINGS DELETED.')
  } catch (e) {
    console.error('❌ FAILED TO CLEAR DATA:', e.message)
  }
  
  await prisma.$disconnect()
}

clear()
