export function validateForm(formData) {
  const errors = {};

  // ── Candidate Details ───────────────────────────────────────────
  if (!formData.candidateName?.trim()) {
    errors.candidateName = 'Candidate name is required';
  } else if (!/^[a-zA-Z\s]+$/.test(formData.candidateName.trim())) {
    errors.candidateName = 'Name must contain alphabets only';
  }

  if (!formData.fatherName?.trim()) {
    errors.fatherName = "Father's name is required";
  } else if (!/^[a-zA-Z\s]+$/.test(formData.fatherName.trim())) {
    errors.fatherName = "Father's name must contain alphabets only";
  }

  if (!formData.dob) {
    errors.dob = 'Date of birth is required';
  } else if (new Date(formData.dob) >= new Date()) {
    errors.dob = 'Date of birth must be in the past';
  }

  if (!formData.nationality?.trim()) {
    errors.nationality = 'Nationality is required';
  }

  if (formData.passportNumber?.trim() && !/^[a-zA-Z0-9]+$/.test(formData.passportNumber.trim())) {
    errors.passportNumber = 'Passport number must be alphanumeric';
  }

  // ── Course Details ──────────────────────────────────────────────
  if (!formData.courseName?.trim()) {
    errors.courseName = 'Course name is required';
  }

  if (!formData.webTechnologies || formData.webTechnologies.length === 0) {
    errors.webTechnologies = 'At least one technology is required';
  }

  if (!formData.courseTitle?.trim()) {
    errors.courseTitle = 'Course title is required';
  }

  if (!formData.durationStart) {
    errors.durationStart = 'Duration start date is required';
  }

  if (!formData.durationEnd) {
    errors.durationEnd = 'Duration end date is required';
  } else if (formData.durationStart && new Date(formData.durationEnd) <= new Date(formData.durationStart)) {
    errors.durationEnd = 'End date must be after start date';
  }

  if (!formData.hours) {
    errors.hours = 'Hours is required';
  } else if (isNaN(formData.hours) || parseInt(formData.hours, 10) <= 0) {
    errors.hours = 'Hours must be a positive number';
  }

  // ── Certificate Details ─────────────────────────────────────────
  if (!formData.issueDate) {
    errors.issueDate = 'Date of issue is required';
  }

  if (!formData.expiryDate) {
    errors.expiryDate = 'Date of expiry is required';
  } else if (formData.issueDate && new Date(formData.expiryDate) <= new Date(formData.issueDate)) {
    errors.expiryDate = 'Expiry date must be after issue date';
  }

  if (!formData.authorizedPerson?.trim()) {
    errors.authorizedPerson = 'Authorized person name is required';
  }

  // ── Uploads ────────────────────────────────────────────────────
  if (!formData.stamp) errors.stamp = 'Stamp image is required';
  if (!formData.signature) errors.signature = 'Signature image is required';
  if (!formData.marksheet1) errors.marksheet1 = 'Marksheet 1 is required';
  if (!formData.marksheet2) errors.marksheet2 = 'Marksheet 2 is required';
  if (!formData.marksheet3) errors.marksheet3 = 'Marksheet 3 is required';

  return errors;
}

export function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'Only PDF, JPG, PNG files are allowed';
  }
  if (file.size > maxSize) {
    return 'File size must be less than 5MB';
  }
  return null;
}
