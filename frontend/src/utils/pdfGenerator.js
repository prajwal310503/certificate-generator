import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Fetches a remote image via backend proxy → base64 data URL.
 * Proxy avoids Supabase Storage CORS restrictions.
 * Fallback: returns the original URL on any error.
 */
async function toDataUrl(url) {
  if (!url || url.startsWith('data:')) return url;
  try {
    // Route through backend proxy for external URLs
    const fetchUrl = url.startsWith('http')
      ? `/api/proxy-image?url=${encodeURIComponent(url)}`
      : url;
    const resp = await fetch(fetchUrl);
    if (!resp.ok) return url;
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload  = (e) => resolve(e.target.result);
      reader.onerror = ()  => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/**
 * Captures a DOM element (794×1123px certificate) as an A4 PDF Blob.
 * The element must be in the DOM at a reachable position (not -9999px).
 */
export async function captureElementAsPdf(element) {
  await document.fonts.ready;

  // Temporarily bring the hidden wrapper into the visible viewport
  // (html2canvas cannot render elements at top: -9999px)
  const wrapper = element.parentElement;
  const prev = {
    position: wrapper.style.position,
    top:      wrapper.style.top,
    left:     wrapper.style.left,
    opacity:  wrapper.style.opacity,
    zIndex:   wrapper.style.zIndex,
  };

  wrapper.style.position = 'fixed';
  wrapper.style.top      = '0';
  wrapper.style.left     = '0';
  wrapper.style.opacity  = '0.01';   // near-invisible but rendered by browser
  wrapper.style.zIndex   = '9999';

  // Two animation frames so the browser has fully painted the element
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 150));

  // Pre-load all remote <img> sources as base64 data URLs so html2canvas
  // never has to make cross-origin requests (avoids CORS + timing issues).
  const imgs = Array.from(element.querySelectorAll('img'));
  const origSrcs = imgs.map((img) => img.getAttribute('src'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      const dataUrl = await toDataUrl(src);
      if (dataUrl !== src) {
        img.src = dataUrl;
        // Wait for img to repaint with the new data URL
        if (!img.complete) {
          await new Promise((r) => { img.onload = r; img.onerror = r; });
        }
      }
    })
  );

  // Small extra wait after image swap
  await new Promise((r) => setTimeout(r, 100));

  const canvas = await html2canvas(element, {
    scale:           2,
    useCORS:         false,   // not needed — all imgs are now data URLs
    allowTaint:      false,
    logging:         false,
    backgroundColor: '#ffffff',
    width:           794,
    height:          1123,
    x:               0,
    y:               0,
    scrollX:         0,
    scrollY:         0,
  });

  // Restore original hidden position
  wrapper.style.position = prev.position;
  wrapper.style.top      = prev.top;
  wrapper.style.left     = prev.left;
  wrapper.style.opacity  = prev.opacity;
  wrapper.style.zIndex   = prev.zIndex;

  // Restore original img srcs (in case the component re-uses them)
  imgs.forEach((img, i) => {
    if (origSrcs[i] !== null) img.src = origSrcs[i];
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

  return pdf.output('blob');
}
