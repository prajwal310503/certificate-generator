const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getNextCertificateNumber() {
  const year = new Date().getFullYear();

  const { data, error } = await supabase
    .from('certificates')
    .select('certificate_number')
    .like('certificate_number', `AFF-${year}-%`)
    .order('certificate_number', { ascending: false })
    .limit(1);

  if (error) throw error;

  let nextNum = 1;
  if (data && data.length > 0) {
    const parts = data[0].certificate_number.split('-');
    const lastNum = parseInt(parts[2], 10);
    nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
  }

  return `AFF-${year}-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Upload a file buffer to Supabase Storage (images or PDFs).
 * Returns the public URL or null if upload fails.
 */
async function uploadFile(buffer, mimeType, fileName) {
  try {
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('webp')) ext = 'webp';
    const path = `${fileName}.${ext}`;

    // Use Blob instead of raw Buffer — more reliable with Supabase JS v2 in Node.js
    const uploadBody = new Blob([buffer], { type: mimeType });

    const { error: uploadError } = await supabase.storage
      .from('certificate-assets')
      .upload(path, uploadBody, { contentType: mimeType, upsert: true });

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === '404') {
        console.error(
          '⚠️  Supabase Storage bucket "certificate-assets" not found.\n' +
          '   Go to Supabase Dashboard → Storage → New bucket → name it "certificate-assets" → enable Public.'
        );
      } else {
        console.error(
          `❌ uploadFile failed for "${path}": ${uploadError.message}`,
          '| statusCode:', uploadError.statusCode,
          '| error:', uploadError.error
        );
      }
      return null;
    }

    const { data } = supabase.storage
      .from('certificate-assets')
      .getPublicUrl(path);

    console.log(`✅ Uploaded to Storage: ${path}`);
    return data.publicUrl;
  } catch (err) {
    console.error(`❌ uploadFile exception for "${fileName}":`, err.message);
    return null;
  }
}

const BUCKET = 'certificate-assets';

/**
 * Extract the storage path (e.g. "stamp_AFF-2026-001.jpg") from a public URL.
 * Works with any Supabase project URL format.
 */
function extractStoragePath(url) {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx !== -1 ? decodeURIComponent(url.slice(idx + marker.length)) : null;
}

/**
 * Detect image MIME type from buffer magic bytes.
 * More reliable than relying on Supabase's returned Content-Type.
 */
function detectMimeType(buffer, fallback) {
  if (!buffer || buffer.length < 4) return fallback || 'image/jpeg';
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf';
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return 'image/webp';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
  return fallback || 'image/jpeg';
}

/**
 * Download a file from the certificate-assets bucket.
 * Returns { buffer, mimeType } or null on failure.
 */
async function downloadFile(url) {
  try {
    const filePath = extractStoragePath(url);
    if (!filePath) {
      console.warn('downloadFile: could not extract storage path from URL:', url);
      return null;
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(filePath);

    if (error) {
      console.warn(`downloadFile error for "${filePath}": ${error.message}`);
      return null;
    }
    if (!data) {
      console.warn(`downloadFile: no data returned for "${filePath}"`);
      return null;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const mimeType = detectMimeType(buffer, data.type || 'image/jpeg');
    return { buffer, mimeType };
  } catch (err) {
    console.warn('downloadFile exception:', err.message);
    return null;
  }
}

async function saveCertificate(certData) {
  const { data, error } = await supabase
    .from('certificates')
    .insert([certData])
    .select();

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

async function getCertificateById(id) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function getAllCertificates() {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function deleteCertificate(id) {
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function updateCertificate(id, certData) {
  const { error } = await supabase
    .from('certificates')
    .update(certData)
    .eq('id', id);

  if (error) throw error;
}

module.exports = {
  getNextCertificateNumber,
  uploadFile,
  downloadFile,
  saveCertificate,
  getCertificateById,
  getAllCertificates,
  deleteCertificate,
  updateCertificate,
};
