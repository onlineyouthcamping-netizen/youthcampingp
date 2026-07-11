const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = 'booking-documents';
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads/documents');

// Initialize Supabase client if keys are present
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('[STORAGE] Supabase client initialized successfully.');
  } catch (err) {
    console.error('[STORAGE] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[STORAGE] Supabase credentials not found. Falling back to local storage.');
}

/**
 * Uploads a file buffer securely.
 * @param {Buffer} fileBuffer
 * @param {string} storagePath - E.g. "bookings/bookingId/passengerId/filename.pdf"
 * @param {string} mimeType
 * @returns {Promise<{ storagePath: string, mode: 'supabase' | 'local' }>}
 */
async function uploadFile(fileBuffer, storagePath, mimeType) {
  // Try Supabase first if initialized
  if (supabase) {
    try {
      console.log(`[STORAGE] Uploading to Supabase bucket "${BUCKET_NAME}": ${storagePath}`);
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (error) throw error;
      console.log('[STORAGE] ✅ Supabase upload successful:', data.path);
      return { storagePath: data.path, mode: 'supabase' };
    } catch (err) {
      console.error('[STORAGE] ⚠️ Supabase upload failed, falling back to local:', err.message);
    }
  }

  // Fallback: Save to local directory
  try {
    const fullLocalPath = path.join(LOCAL_UPLOAD_DIR, storagePath);
    const parentDir = path.dirname(fullLocalPath);
    
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(fullLocalPath, fileBuffer);
    console.log('[STORAGE] ✅ Local fallback upload successful:', storagePath);
    return { storagePath, mode: 'local' };
  } catch (err) {
    console.error('[STORAGE] ❌ Local fallback upload failed:', err.message);
    throw new Error('Document storage failed. Please retry later.');
  }
}

/**
 * Downloads a file securely, returning a buffer and mimeType.
 * @param {string} storagePath
 * @returns {Promise<{ buffer: Buffer, mimeType: string }>}
 */
async function downloadFile(storagePath) {
  // Check if file exists locally first
  const fullLocalPath = path.join(LOCAL_UPLOAD_DIR, storagePath);
  if (fs.existsSync(fullLocalPath)) {
    console.log('[STORAGE] Retrieving file from local storage:', storagePath);
    const buffer = fs.readFileSync(fullLocalPath);
    return { buffer };
  }

  // Retrieve from Supabase if client is ready
  if (supabase) {
    try {
      console.log(`[STORAGE] Downloading from Supabase bucket "${BUCKET_NAME}": ${storagePath}`);
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(storagePath);

      if (error) throw error;
      
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return { buffer };
    } catch (err) {
      console.error('[STORAGE] Supabase download failed:', err.message);
      throw err;
    }
  }

  throw new Error('Document not found in storage.');
}

/**
 * Deletes a file securely.
 * @param {string} storagePath
 * @returns {Promise<boolean>}
 */
async function deleteFile(storagePath) {
  const fullLocalPath = path.join(LOCAL_UPLOAD_DIR, storagePath);
  if (fs.existsSync(fullLocalPath)) {
    try {
      fs.unlinkSync(fullLocalPath);
      console.log('[STORAGE] ✅ Local file deleted:', storagePath);
    } catch (err) {
      console.error('[STORAGE] Local file delete failed:', err.message);
    }
  }

  if (supabase) {
    try {
      console.log(`[STORAGE] Deleting from Supabase bucket "${BUCKET_NAME}": ${storagePath}`);
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (error) throw error;
      console.log('[STORAGE] ✅ Supabase file deletion successful:', storagePath);
      return true;
    } catch (err) {
      console.error('[STORAGE] Supabase delete failed:', err.message);
      throw err;
    }
  }

  return true;
}

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile
};
