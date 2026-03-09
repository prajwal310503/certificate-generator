const express = require('express');
const router = express.Router();
const multer = require('multer');
const certificateController = require('../controllers/certificateController');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadFields = upload.fields([
  { name: 'certificate',  maxCount: 1 },
  { name: 'marksheet1',   maxCount: 1 },
  { name: 'marksheet2',   maxCount: 1 },
  { name: 'marksheet3',   maxCount: 1 },
  { name: 'stamp',        maxCount: 1 },
  { name: 'signature',    maxCount: 1 },
  { name: 'photo',        maxCount: 1 },
]);

// GET /api/certificates/number
router.get('/number', certificateController.getCertificateNumber);

// POST /api/certificates/generate
router.post('/generate', uploadFields, certificateController.generateCertificate);

// GET /api/certificates
router.get('/', certificateController.getAllCertificates);

// PUT /api/certificates/:id (with optional file replacements)
// Only invoke multer for multipart requests; plain JSON bypasses it entirely.
const conditionalUpload = (req, res, next) => {
  if ((req.headers['content-type'] || '').includes('multipart/form-data')) {
    return uploadFields(req, res, next);
  }
  next();
};
router.put('/:id', conditionalUpload, certificateController.updateCertificate);

// POST /api/certificates/:id/download  — merge cert PDF with saved marksheets
const certOnlyUpload = upload.fields([{ name: 'certificate', maxCount: 1 }]);
router.post('/:id/download', certOnlyUpload, certificateController.downloadCertificate);

// DELETE /api/certificates/:id
router.delete('/:id', certificateController.deleteCertificate);

module.exports = router;
