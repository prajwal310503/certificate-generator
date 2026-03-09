const {
  getNextCertificateNumber,
  uploadFile,
  downloadFile,
  saveCertificate,
  getAllCertificates,
  getCertificateById,
  deleteCertificate,
  updateCertificate,
} = require('../services/supabaseService');
const { imageToPdf, mergePdfs } = require('../services/pdfService');

/**
 * GET /api/certificates/number
 * Returns the next available certificate number without reserving it.
 */
const getCertificateNumber = async (req, res) => {
  try {
    const certificateNumber = await getNextCertificateNumber();
    res.json({ certificateNumber });
  } catch (error) {
    console.error('getCertificateNumber error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/certificates/generate
 * Receives certificate PDF + marksheets + optional images, merges PDFs,
 * uploads images to Supabase Storage, saves record, returns merged PDF.
 */
const generateCertificate = async (req, res) => {
  try {
    const files = req.files || {};

    if (!files.certificate?.[0]) {
      return res.status(400).json({ error: 'Certificate PDF is required.' });
    }
    if (!files.marksheet1?.[0] || !files.marksheet2?.[0] || !files.marksheet3?.[0]) {
      return res.status(400).json({ error: 'All 3 marksheets are required.' });
    }

    let formData;
    try {
      formData = JSON.parse(req.body.formData);
    } catch {
      return res.status(400).json({ error: 'Invalid form data.' });
    }

    const certNumber = await getNextCertificateNumber();

    // Log received files so upload failures are visible in the backend console
    console.log(`📋 Generating ${certNumber} — received files:`, {
      stamp:     files.stamp?.[0]     ? `${files.stamp[0].mimetype} ${files.stamp[0].size}b`     : 'none',
      signature: files.signature?.[0] ? `${files.signature[0].mimetype} ${files.signature[0].size}b` : 'none',
      photo:     files.photo?.[0]     ? `${files.photo[0].mimetype} ${files.photo[0].size}b`     : 'none',
    });

    // Upload all assets to Supabase Storage in parallel (non-blocking on failure)
    const [stampUrl, signatureUrl, photoUrl, marksheet1Url, marksheet2Url, marksheet3Url] = await Promise.all([
      files.stamp?.[0]
        ? uploadFile(files.stamp[0].buffer, files.stamp[0].mimetype, `stamp_${certNumber}`)
        : Promise.resolve(null),
      files.signature?.[0]
        ? uploadFile(files.signature[0].buffer, files.signature[0].mimetype, `signature_${certNumber}`)
        : Promise.resolve(null),
      files.photo?.[0]
        ? uploadFile(files.photo[0].buffer, files.photo[0].mimetype, `photo_${certNumber}`)
        : Promise.resolve(null),
      files.marksheet1?.[0]
        ? uploadFile(files.marksheet1[0].buffer, files.marksheet1[0].mimetype, `marksheet1_${certNumber}`)
        : Promise.resolve(null),
      files.marksheet2?.[0]
        ? uploadFile(files.marksheet2[0].buffer, files.marksheet2[0].mimetype, `marksheet2_${certNumber}`)
        : Promise.resolve(null),
      files.marksheet3?.[0]
        ? uploadFile(files.marksheet3[0].buffer, files.marksheet3[0].mimetype, `marksheet3_${certNumber}`)
        : Promise.resolve(null),
    ]);

    console.log(`📤 Upload results for ${certNumber}:`, {
      stamp:      stampUrl      ? '✅' : '❌ null',
      signature:  signatureUrl  ? '✅' : '❌ null',
      photo:      photoUrl      ? '✅' : '❌ null',
      marksheet1: marksheet1Url ? '✅' : '❌ null',
      marksheet2: marksheet2Url ? '✅' : '❌ null',
      marksheet3: marksheet3Url ? '✅' : '❌ null',
    });

    // Build PDF buffer list: certificate first, then marksheets
    const pdfBuffers = [files.certificate[0].buffer];
    for (const key of ['marksheet1', 'marksheet2', 'marksheet3']) {
      const file = files[key][0];
      if (file.mimetype === 'application/pdf') {
        pdfBuffers.push(file.buffer);
      } else {
        pdfBuffers.push(await imageToPdf(file.buffer, file.mimetype));
      }
    }

    const mergedPdfBuffer = await mergePdfs(pdfBuffers);

    // Save record to Supabase
    await saveCertificate({
      certificate_number: certNumber,
      candidate_name:     formData.candidateName,
      father_name:        formData.fatherName,
      dob:                formData.dob,
      nationality:        formData.nationality,
      passport_number:    formData.passportNumber || null,
      course_name:        formData.courseName,
      web_technologies:   formData.webTechnologies || [],
      course_title:       formData.courseTitle,
      duration_start:     formData.durationStart,
      duration_end:       formData.durationEnd,
      hours:              parseInt(formData.hours, 10),
      issue_date:         formData.issueDate,
      expiry_date:        formData.expiryDate,
      authorized_person:  formData.authorizedPerson,
      stamp_url:          stampUrl,
      signature_url:      signatureUrl,
      photo_url:          photoUrl,
      marksheet1_url:     marksheet1Url,
      marksheet2_url:     marksheet2Url,
      marksheet3_url:     marksheet3Url,
    });

    const safeName = (formData.candidateName || 'Certificate')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Certificate.pdf"`);
    res.setHeader('Content-Length', mergedPdfBuffer.length);
    res.send(mergedPdfBuffer);
  } catch (error) {
    console.error('generateCertificate error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/certificates
 * Returns all certificate records (admin panel).
 */
const getAllCertificatesHandler = async (req, res) => {
  try {
    const certificates = await getAllCertificates();
    res.json(certificates);
  } catch (error) {
    console.error('getAllCertificates error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/certificates/:id
 * Updates certificate text fields and optionally replaces uploaded files.
 */
const updateCertificateHandler = async (req, res) => {
  try {
    const files = req.files || {};

    // Support both multipart/form-data (with files) and plain JSON
    let certData;
    try {
      certData = req.body.formData ? JSON.parse(req.body.formData) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid form data.' });
    }

    // Upload any replacement files to Supabase Storage
    const id = req.params.id;
    const fileFields = {
      stamp_url:      files.stamp?.[0],
      signature_url:  files.signature?.[0],
      photo_url:      files.photo?.[0],
      marksheet1_url: files.marksheet1?.[0],
      marksheet2_url: files.marksheet2?.[0],
      marksheet3_url: files.marksheet3?.[0],
    };

    const uploadEntries = Object.entries(fileFields).filter(([, f]) => f);
    const uploadedUrls = {};
    if (uploadEntries.length) {
      const results = await Promise.all(
        uploadEntries.map(([key, f]) =>
          uploadFile(f.buffer, f.mimetype, `${key.replace('_url', '')}_edit_${id}`)
        )
      );
      uploadEntries.forEach(([key], i) => {
        if (results[i]) uploadedUrls[key] = results[i];
      });
    }

    // Whitelist only known DB columns to avoid Supabase column errors
    const ALLOWED = [
      'candidate_name', 'father_name', 'dob', 'nationality', 'passport_number',
      'course_name', 'web_technologies', 'course_title', 'duration_start', 'duration_end',
      'hours', 'issue_date', 'expiry_date', 'authorized_person',
      'stamp_url', 'signature_url', 'photo_url',
      'marksheet1_url', 'marksheet2_url', 'marksheet3_url',
    ];
    const safeData = {};
    for (const key of ALLOWED) {
      if (key in certData) safeData[key] = certData[key];
    }

    const dataToSave = { ...safeData, ...uploadedUrls };
    await updateCertificate(id, dataToSave);
    res.json(dataToSave);
  } catch (error) {
    console.error('updateCertificate error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};

/**
 * DELETE /api/certificates/:id
 * Deletes a certificate record (admin panel).
 */
const deleteCertificateHandler = async (req, res) => {
  try {
    await deleteCertificate(req.params.id);
    res.json({ message: 'Certificate deleted successfully.' });
  } catch (error) {
    console.error('deleteCertificate error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/certificates/:id/download
 * Accepts a captured certificate PDF, fetches the saved marksheets from
 * Supabase Storage (server-side, no CORS), merges everything into one PDF.
 */
const downloadCertificateHandler = async (req, res) => {
  try {
    const cert = await getCertificateById(req.params.id);

    if (!req.files?.certificate?.[0]) {
      return res.status(400).json({ error: 'Certificate PDF is required.' });
    }

    const pdfBuffers = [req.files.certificate[0].buffer];

    // Download saved marksheets from Supabase Storage via admin client
    for (const key of ['marksheet1_url', 'marksheet2_url', 'marksheet3_url']) {
      const url = cert[key];
      if (!url) continue;
      try {
        const result = await downloadFile(url);
        if (!result) { console.warn(`downloadFile returned null for ${key}`); continue; }
        const { buffer: buf, mimeType } = result;
        if (mimeType.includes('pdf') || buf.slice(0, 4).toString() === '%PDF') {
          pdfBuffers.push(buf);
        } else {
          pdfBuffers.push(await imageToPdf(buf, mimeType));
        }
      } catch (err) {
        console.warn(`Could not download ${key}:`, err.message);
      }
    }

    const mergedPdfBuffer = await mergePdfs(pdfBuffers);

    const safeName = (cert.candidate_name || 'Certificate')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Certificate.pdf"`);
    res.setHeader('Content-Length', mergedPdfBuffer.length);
    res.send(mergedPdfBuffer);
  } catch (error) {
    console.error('downloadCertificate error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCertificateNumber,
  generateCertificate,
  getAllCertificates: getAllCertificatesHandler,
  updateCertificate: updateCertificateHandler,
  deleteCertificate: deleteCertificateHandler,
  downloadCertificate: downloadCertificateHandler,
};
