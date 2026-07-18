const dotenv = require('dotenv');
dotenv.config();

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const controller = require('../src/controllers/travelDeskController');
const axios = require('axios');

async function testControllerDirectly() {
  try {
    // 1. Download PDF
    const pdfUrl = 'https://res.cloudinary.com/ddkndagvp/raw/upload/v1784359387/travel-desk/MKA-1/documents/vqi6mujxqiu9orknrbo9';
    console.log('Downloading PDF...');
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // 2. Fetch admin user to use a real ID from DB
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      console.error('No admin user found in database');
      return;
    }

    // 3. Mock Req & Res
    const req = {
      body: {
        tripId: 'MKA-1',
        category: 'Sales Guide',
        visibility: 'internal'
      },
      files: [
        {
          fieldname: 'files',
          originalname: 'Assignment - 3.pdf',
          mimetype: 'application/pdf',
          buffer: buffer,
          size: buffer.length
        }
      ],
      user: {
        id: admin.id,
        role: admin.role || 'superadmin'
      }
    };

    const res = {
      status: function(code) {
        console.log('Status code set:', code);
        return this;
      },
      json: function(data) {
        console.log('Response JSON:', JSON.stringify(data, null, 2));
        return this;
      }
    };

    const next = function(err) {
      console.error('Next called with error:', err);
    };

    console.log('Invoking uploadDocuments controller method directly...');
    await controller.uploadDocuments(req, res, next);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
testControllerDirectly();
