require('./src/utils/testSafety').assertReadOnlyTestSafety();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.page.findUnique({ where: { slug: 'home' } })
  .then(p => { 
    console.log(JSON.stringify(p?.sections, null, 2)); 
    return prisma.$disconnect(); 
  })
  .catch(e => { 
    console.error(e); 
    return prisma.$disconnect(); 
  });
