import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isConfigured = true;
} else {
  console.log("Cloudinary env variables not fully set. Falling back to local storage uploads.");
}

export async function uploadToCloudinary(filePath: string): Promise<string | null> {
  if (!isConfigured) {
    return null;
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "guide_reporting_selfies",
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Selfie image upload to Cloudinary failed: " + (error as Error).message);
  }
}
