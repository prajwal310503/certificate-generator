import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
});

export async function getCertificateNumber() {
  const res = await api.get('/certificates/number');
  return res.data.certificateNumber;
}

export async function submitCertificate(formData, certificateBlob, files, images) {
  const data = new FormData();
  data.append('formData', JSON.stringify(formData));
  data.append('certificate', certificateBlob, 'certificate.pdf');
  data.append('marksheet1', files.marksheet1, files.marksheet1.name);
  data.append('marksheet2', files.marksheet2, files.marksheet2.name);
  data.append('marksheet3', files.marksheet3, files.marksheet3.name);

  // Optional image uploads for storage
  if (images?.stamp?.file)     data.append('stamp',     images.stamp.file,     'stamp.jpg');
  if (images?.signature?.file) data.append('signature', images.signature.file, 'signature.jpg');
  if (images?.photo?.file)     data.append('photo',     images.photo.file,     'photo.jpg');

  const res = await api.post('/certificates/generate', data, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data;
}

export async function getAllCertificates() {
  const res = await api.get('/certificates');
  return res.data;
}

export async function deleteCertificate(id) {
  await api.delete(`/certificates/${id}`);
}

/**
 * Sends the captured certificate PDF blob to the backend which fetches the
 * saved marksheets from Supabase and returns a single merged PDF blob.
 */
export async function downloadMergedCertificate(id, certificateBlob) {
  const fd = new FormData();
  fd.append('certificate', certificateBlob, 'certificate.pdf');
  const res = await api.post(`/certificates/${id}/download`, fd, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateCertificate(id, certData, files) {
  const hasFiles = files && Object.values(files).some(Boolean);
  if (hasFiles) {
    const fd = new FormData();
    fd.append('formData', JSON.stringify(certData));
    if (files.stamp)      fd.append('stamp',      files.stamp,      files.stamp.name);
    if (files.signature)  fd.append('signature',  files.signature,  files.signature.name);
    if (files.photo)      fd.append('photo',      files.photo,      files.photo.name);
    if (files.marksheet1) fd.append('marksheet1', files.marksheet1, files.marksheet1.name);
    if (files.marksheet2) fd.append('marksheet2', files.marksheet2, files.marksheet2.name);
    if (files.marksheet3) fd.append('marksheet3', files.marksheet3, files.marksheet3.name);
    const res = await api.put(`/certificates/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
  const res = await api.put(`/certificates/${id}`, certData);
  return res.data;
}
