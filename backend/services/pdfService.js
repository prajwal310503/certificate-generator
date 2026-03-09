const { PDFDocument } = require('pdf-lib');

/**
 * Converts an image buffer (JPEG or PNG) to a single-page PDF buffer.
 * The image is scaled to fit A4 dimensions while maintaining aspect ratio.
 */
async function imageToPdf(imageBuffer, mimeType) {
  const pdfDoc = await PDFDocument.create();

  let image;
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageBuffer);
  } else if (mimeType === 'image/png') {
    image = await pdfDoc.embedPng(imageBuffer);
  } else {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  // A4 in points (72 DPI standard for PDF): 595 x 842
  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;

  const { width: imgW, height: imgH } = image;
  const scale = Math.min(A4_WIDTH / imgW, A4_HEIGHT / imgH);
  const drawWidth = imgW * scale;
  const drawHeight = imgH * scale;

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  page.drawImage(image, {
    x: (A4_WIDTH - drawWidth) / 2,
    y: (A4_HEIGHT - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  });

  return Buffer.from(await pdfDoc.save());
}

/**
 * Merges an array of PDF buffers into a single PDF buffer.
 */
async function mergePdfs(pdfBuffers) {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const pageIndices = pdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return Buffer.from(await mergedPdf.save());
}

module.exports = { imageToPdf, mergePdfs };
