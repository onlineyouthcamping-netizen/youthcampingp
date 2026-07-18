const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUploadEndpoint() {
  try {
    // 1. Download the PDF from the old URL
    const pdfUrl = 'https://res.cloudinary.com/ddkndagvp/raw/upload/v1784359387/travel-desk/MKA-1/documents/vqi6mujxqiu9orknrbo9';
    console.log('Downloading PDF...');
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append('tripId', 'MKA-1');
    formData.append('category', 'Sales Guide');
    formData.append('visibility', 'internal');
    formData.append('files', buffer, { filename: 'Assignment - 3.pdf', contentType: 'application/pdf' });

    console.log('Sending upload request to backend endpoint...');
    const uploadRes = await axios.post('http://localhost:3001/api/travel-desk/documents/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        // Add auth token if needed, wait, let's see if we need token
      }
    });

    console.log('Upload Result:', JSON.stringify(uploadRes.data, null, 2));
  } catch (err) {
    console.error('Upload failed:', err.response ? err.response.data : err.message);
  }
}
testUploadEndpoint();
