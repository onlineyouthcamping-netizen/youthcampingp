const dotenv = require('dotenv');
dotenv.config();

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      console.error('No admin found');
      return;
    }
    // Make request directly to localhost backend port 3001 using mock token auth or bypass auth check,
    // wait, we can just login or use a direct local request.
    // Let's call the controller directly!
    const controller = require('../src/controllers/travelDeskContentController');
    const req = {
      params: { tripId: 'MKA-1' },
      user: { id: admin.id, role: admin.role || 'superadmin' }
    };
    const res = {
      status: function(code) { console.log('Status code:', code); return this; },
      json: function(data) {
        console.log('Seeded Articles found:', data.data.filter(a => a.category.slug === 'inclusions-&-exclusions').map(a => ({
          title: a.title,
          summary: a.summary,
          content: a.content,
          status: a.status
        })));
      }
    };
    const next = function(err) { console.error('Error:', err); };
    
    await controller.getArticles(req, res, next);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
