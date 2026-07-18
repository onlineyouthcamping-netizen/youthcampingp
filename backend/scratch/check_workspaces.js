const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const workspaces = await prisma.travelDeskWorkspace.findMany({
      select: { tripId: true }
    });
    console.log('Workspaces in DB:', workspaces);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
