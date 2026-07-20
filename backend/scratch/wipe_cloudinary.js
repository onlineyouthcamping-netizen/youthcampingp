require('dotenv').config({ path: 'backend/.env' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function deleteAllResources(resource_type) {
  let next_cursor = null;
  let deletedCount = 0;

  do {
    const result = await cloudinary.api.resources({
      resource_type: resource_type,
      max_results: 100,
      next_cursor: next_cursor
    });

    const publicIds = result.resources.map(r => r.public_id);
    if (publicIds.length > 0) {
      await cloudinary.api.delete_resources(publicIds, { resource_type });
      deletedCount += publicIds.length;
      console.log(`Deleted ${publicIds.length} ${resource_type} resources...`);
    }

    next_cursor = result.next_cursor;
  } while (next_cursor);

  console.log(`Total ${resource_type} resources deleted: ${deletedCount}`);
}

async function run() {
  console.log("Starting Cloudinary cleanup...");
  try {
    await deleteAllResources('image');
    await deleteAllResources('video');
    await deleteAllResources('raw');
    console.log("Cloudinary wipe complete!");
  } catch (error) {
    console.error("Cloudinary Error:", error);
  }
}

run();
