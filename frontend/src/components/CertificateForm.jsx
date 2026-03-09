import React from 'react';
import { User, BookOpen, Award, Pen, List } from 'lucide-react';
import TagInput from './TagInput.jsx';
import FileUpload from './FileUpload.jsx';
import CalendarPicker from './CalendarPicker.jsx';

const Field = ({ label, error, required, children }) => (
  <div>
    <label className="field-label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="field-error"><span className="text-red-400 font-bold">!</span> {error}</p>}
  </div>
);

export default function CertificateForm({ formData, onChange, errors }) {
  const set = (field) => (e) => onChange({ ...formData, [field]: e.target.value });
  const setDate = (field) => (v) => onChange({ ...formData, [field]: v });

  const handleImageFile = (field) => (file, dataUrl, fileError) => {
    if (fileError) { onChange({ ...formData, [field]: null }); return; }
    onChange({ ...formData, [field]: file ? { file, dataUrl } : null });
  };

  const handleMarksheet = (field) => (file, _, fileError) => {
    if (fileError) { onChange({ ...formData, [field]: null }); return; }
    onChange({ ...formData, [field]: file || null });
  };

  return (
    <div className="space-y-5 pb-8">

      {/* ── Candidate Details ─────────────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">
          <User size={15} className="text-blue-500" /> Candidate Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Candidate Full Name" error={errors.candidateName} required>
            <input className={`glass-input ${errors.candidateName ? 'error' : ''}`}
              placeholder="e.g. John Alexander" value={formData.candidateName} onChange={set('candidateName')} />
          </Field>
          <Field label="Father's Name" error={errors.fatherName} required>
            <input className={`glass-input ${errors.fatherName ? 'error' : ''}`}
              placeholder="e.g. Robert Smith" value={formData.fatherName} onChange={set('fatherName')} />
          </Field>
          <Field label="Date of Birth" error={errors.dob} required>
            <CalendarPicker fullWidth value={formData.dob} onChange={setDate('dob')} placeholder="Select date"
              maxDate={new Date().toISOString().split('T')[0]} />
          </Field>
          <Field label="Nationality" error={errors.nationality} required>
            <input className={`glass-input ${errors.nationality ? 'error' : ''}`}
              placeholder="e.g. Indian" value={formData.nationality} onChange={set('nationality')} />
          </Field>
          <Field label="Passport Number" error={errors.passportNumber}>
            <input className={`glass-input ${errors.passportNumber ? 'error' : ''}`}
              placeholder="e.g. A1234567 (optional)" value={formData.passportNumber} onChange={set('passportNumber')} />
          </Field>
          <div className="sm:col-span-2">
            <FileUpload
              label="Passport Size Photo"
              accept="image/jpeg,image/jpg,image/png"
              onFile={handleImageFile('photo')}
              value={formData.photo?.file}
              dataUrl={formData.photo?.dataUrl}
              error={errors.photo}
              preview
            />
          </div>
        </div>
      </div>

      {/* ── Course Details ────────────────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">
          <BookOpen size={15} className="text-blue-500" /> Course Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Course Name" error={errors.courseName} required>
            <input className={`glass-input ${errors.courseName ? 'error' : ''}`}
              placeholder="e.g. Full Stack Web Development" value={formData.courseName} onChange={set('courseName')} />
          </Field>
          <Field label="Course Title" error={errors.courseTitle} required>
            <input className={`glass-input ${errors.courseTitle ? 'error' : ''}`}
              placeholder="e.g. Advanced Web Technologies" value={formData.courseTitle} onChange={set('courseTitle')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Web Technologies" error={errors.webTechnologies} required>
              <TagInput value={formData.webTechnologies}
                onChange={(tags) => onChange({ ...formData, webTechnologies: tags })}
                placeholder="HTML, CSS, JavaScript — press Enter"
                error={errors.webTechnologies} />
            </Field>
          </div>
          <Field label="Duration Start Date" error={errors.durationStart} required>
            <CalendarPicker fullWidth value={formData.durationStart} onChange={setDate('durationStart')} placeholder="Select date"
              maxDate={formData.durationEnd || undefined} />
          </Field>
          <Field label="Duration End Date" error={errors.durationEnd} required>
            <CalendarPicker fullWidth value={formData.durationEnd} onChange={setDate('durationEnd')} placeholder="Select date"
              minDate={formData.durationStart || undefined} />
          </Field>
          <Field label="Total Hours" error={errors.hours} required>
            <input type="number" min="1" className={`glass-input ${errors.hours ? 'error' : ''}`}
              placeholder="e.g. 120" value={formData.hours} onChange={set('hours')} />
          </Field>
        </div>
      </div>

      {/* ── Certificate Details ───────────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">
          <Award size={15} className="text-blue-500" /> Certificate Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date of Issue" error={errors.issueDate} required>
            <CalendarPicker fullWidth value={formData.issueDate} onChange={setDate('issueDate')} placeholder="Select date" />
          </Field>
          <Field label="Date of Expiry" error={errors.expiryDate} required>
            <CalendarPicker fullWidth value={formData.expiryDate} onChange={setDate('expiryDate')} placeholder="Select date"
              minDate={formData.issueDate || undefined} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Name of Duly Authorized Person" error={errors.authorizedPerson} required>
              <input className={`glass-input ${errors.authorizedPerson ? 'error' : ''}`}
                placeholder="e.g. Dr. Sarah Johnson" value={formData.authorizedPerson} onChange={set('authorizedPerson')} />
            </Field>
          </div>
        </div>
      </div>

      {/* ── Stamp & Signature ─────────────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">
          <Pen size={15} className="text-blue-500" /> Stamp & Signature
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileUpload label="Upload Stamp" accept="image/jpeg,image/jpg,image/png"
            onFile={handleImageFile('stamp')} value={formData.stamp?.file}
            dataUrl={formData.stamp?.dataUrl} error={errors.stamp} preview required />
          <FileUpload label="Upload Signature" accept="image/jpeg,image/jpg,image/png"
            onFile={handleImageFile('signature')} value={formData.signature?.file}
            dataUrl={formData.signature?.dataUrl} error={errors.signature} preview required />
        </div>
      </div>

      {/* ── Marksheets ────────────────────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">
          <List size={15} className="text-blue-500" /> Marksheets Upload
        </h3>
        <p className="text-xs text-slate-500 dark:text-white/35 mb-4">
          Upload all 3 marksheets (PDF, JPG, or PNG — max 5MB each). Images are auto-converted to PDF.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FileUpload label="Marksheet 1" accept="application/pdf,image/jpeg,image/jpg,image/png"
            onFile={handleMarksheet('marksheet1')} value={formData.marksheet1} error={errors.marksheet1} required />
          <FileUpload label="Marksheet 2" accept="application/pdf,image/jpeg,image/jpg,image/png"
            onFile={handleMarksheet('marksheet2')} value={formData.marksheet2} error={errors.marksheet2} required />
          <FileUpload label="Marksheet 3" accept="application/pdf,image/jpeg,image/jpg,image/png"
            onFile={handleMarksheet('marksheet3')} value={formData.marksheet3} error={errors.marksheet3} required />
        </div>
      </div>
    </div>
  );
}
