const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const importRoutes = require('./src/routes/importRoutes');
console.log('Routes loaded');
