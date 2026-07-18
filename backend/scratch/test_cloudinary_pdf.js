const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const axios = require('axios');

const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

async function testUpload() {
  try {
    const url = 'https://res.cloudinary.com/ddkndagvp/raw/upload/v1784359387/travel-desk/MKA-1/documents/vqi6mujxqiu9orknrbo9';
    console.log('Downloading PDF...');
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Upload as 'image'
    console.log('Uploading as image...');
    const resultImage = await uploadToCloudinary(buffer, 'test-folder', 'image');
    console.log('Result as image:', resultImage.secure_url);
    
    // Upload as 'auto'
    console.log('Uploading as auto...');
    const resultAuto = await uploadToCloudinary(buffer, 'test-folder', 'auto');
    console.log('Result as auto:', resultAuto.secure_url);
  } catch (err) {
    console.error(err);
  }
}
testUpload();
