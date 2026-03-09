import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../theme/ThemeContext.jsx';
import { Download, RotateCcw, Eye, EyeOff, BookOpen, Grid, Loader, FileText, Paperclip } from 'lucide-react';
import CertificateForm from '../components/CertificateForm.jsx';
import CertificatePreview from '../components/CertificatePreview.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { validateForm } from '../utils/validation.js';
import { getCertificateNumber, submitCertificate } from '../utils/api.js';
import { captureElementAsPdf } from '../utils/pdfGenerator.js';

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INITIAL_FORM = {
  certificateNumber: '',
  candidateName: '',
  fatherName: '',
  dob: '',
  nationality: '',
  passportNumber: '',
  courseName: '',
  webTechnologies: [],
  courseTitle: '',
  durationStart: '',
  durationEnd: '',
  hours: '',
  issueDate: '',
  expiryDate: '',
  authorizedPerson: '',
  stamp: null,
  signature: null,
  photo: null,
  marksheet1: null,
  marksheet2: null,
  marksheet3: null,
};

export default function Home() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const captureRef = useRef(null);

  useEffect(() => {
    getCertificateNumber()
      .then((num) => setFormData((f) => ({ ...f, certificateNumber: num })))
      .catch(() => setFormData((f) => ({ ...f, certificateNumber: 'AFF-2026-001' })));
  }, []);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted errors.');
      document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});
    setLoading(true);
    const toastId = toast.loading('Generating certificate PDF...');
    try {
      if (!captureRef.current) throw new Error('Certificate preview not ready.');
      const certBlob = await captureElementAsPdf(captureRef.current);
      toast.loading('Merging with marksheets...', { id: toastId });

      const mergedBlob = await submitCertificate(
        {
          certificateNumber: formData.certificateNumber,
          candidateName: formData.candidateName,
          fatherName: formData.fatherName,
          dob: formData.dob,
          nationality: formData.nationality,
          passportNumber: formData.passportNumber,
          courseName: formData.courseName,
          webTechnologies: formData.webTechnologies,
          courseTitle: formData.courseTitle,
          durationStart: formData.durationStart,
          durationEnd: formData.durationEnd,
          hours: formData.hours,
          issueDate: formData.issueDate,
          expiryDate: formData.expiryDate,
          authorizedPerson: formData.authorizedPerson,
        },
        certBlob,
        { marksheet1: formData.marksheet1, marksheet2: formData.marksheet2, marksheet3: formData.marksheet3 },
        { stamp: formData.stamp, signature: formData.signature, photo: formData.photo }
      );

      const safeName = formData.candidateName.replace(/\s+/g, '_');
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_Certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Certificate downloaded!', { id: toastId });
      const nextNum = await getCertificateNumber().catch(() => null);
      if (nextNum) setFormData((f) => ({ ...f, certificateNumber: nextNum }));
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || err.message || 'Something went wrong.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const handleReset = () => {
    if (!window.confirm('Reset the form? All entered data will be cleared.')) return;
    getCertificateNumber()
      .then((num) => setFormData({ ...INITIAL_FORM, certificateNumber: num }))
      .catch(() => setFormData({ ...INITIAL_FORM, certificateNumber: 'AFF-2026-001' }));
    setErrors({});
  };

  return (
    <div className="min-h-screen page-bg transition-colors duration-300">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 navbar-glass">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-white leading-tight tracking-tight">
                Certificate Generator
              </h1>
              <p className="text-xs text-slate-400 dark:text-white/35 hidden sm:block">Dynamic PDF Certificate System</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 hover:scale-105"
              style={{
                background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(186,214,243,0.5)'}`,
                color: dark ? 'rgba(255,255,255,0.75)' : '#334155',
              }}
            >
              <Grid size={14} className="text-blue-500" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">

        {/* Certificate Number badge */}
        {formData.certificateNumber && (
          <div className="mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold animate-fade-in"
            style={{
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.18)',
              color: '#1d4ed8',
            }}>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Certificate No.&nbsp;
            <span className="font-bold font-mono tracking-wider">{formData.certificateNumber}</span>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-6">

          {/* ── Left: Form ── */}
          <div className="xl:w-[55%] xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto xl:pr-2">
            <CertificateForm formData={formData} onChange={setFormData} errors={errors} />

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
              >
                {loading
                  ? <><Loader size={17} className="animate-spin" /> Processing...</>
                  : <><Download size={17} /> Generate &amp; Download Certificate</>
                }
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(186,214,243,0.5)'}`,
                  color: dark ? 'rgba(255,255,255,0.75)' : '#334155',
                }}
              >
                <RotateCcw size={15} /> Reset
              </button>
            </div>
          </div>

          {/* ── Right: Preview ── */}
          <div className="xl:w-[45%]">
            <div className="sticky top-[68px]">
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-blue-500" />
                    <h2 className="text-sm font-bold text-slate-700 dark:text-white">Live Preview</h2>
                    <span className="px-2 py-0.5 text-xs rounded-full font-semibold"
                      style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.15)' }}>
                      A4
                    </span>
                  </div>
                  <button
                    className="xl:hidden inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium"
                    onClick={() => setPreviewVisible((v) => !v)}
                  >
                    {previewVisible ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                  </button>
                </div>

                <div className={`${previewVisible ? 'block' : 'hidden'} xl:block`}>
                  <div className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(186,214,243,0.4)', background: 'rgba(241,248,255,0.5)' }}>
                    <CertificatePreview formData={formData} captureRef={captureRef} />
                  </div>
                  <p className="text-xs text-center text-slate-400 dark:text-white/30 mt-2">
                    Preview matches the generated certificate PDF
                  </p>
                </div>

                {!previewVisible && (
                  <button
                    className="xl:hidden w-full py-3 text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center gap-2"
                    onClick={() => setPreviewVisible(true)}
                  >
                    <Eye size={15} /> Show Certificate Preview
                  </button>
                )}
              </div>
            </div>

            {/* ── Attached Files ── */}
            {(formData.marksheet1 || formData.marksheet2 || formData.marksheet3 ||
              formData.stamp || formData.signature || formData.photo) && (
              <div className="glass-card p-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip size={14} className="text-blue-500" />
                  <h2 className="text-sm font-bold text-slate-700 dark:text-white">Attached Files</h2>
                </div>

                {/* Image thumbnails */}
                {[
                  { key: 'stamp', label: 'Stamp' },
                  { key: 'signature', label: 'Signature' },
                  { key: 'photo', label: 'Photo' },
                ].filter(({ key }) => formData[key]).length > 0 && (
                  <div className="flex gap-3 flex-wrap mb-3">
                    {[
                      { key: 'stamp', label: 'Stamp' },
                      { key: 'signature', label: 'Signature' },
                      { key: 'photo', label: 'Photo' },
                    ].filter(({ key }) => formData[key]).map(({ key, label }) => (
                      <div key={key} className="flex flex-col items-center gap-1">
                        <img
                          src={formData[key]?.dataUrl}
                          alt={label}
                          className="w-14 h-14 object-contain rounded-lg"
                          style={{ background: 'rgba(241,248,255,0.8)', border: '1px solid rgba(186,214,243,0.5)' }}
                        />
                        <span className="text-xs text-slate-500 dark:text-white/40">{label}</span>
                        {formData[key]?.file && (
                          <span className="text-xs text-slate-400 dark:text-white/25">{fmtSize(formData[key].file.size)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Marksheet file list */}
                <div className="space-y-2">
                  {[
                    { key: 'marksheet1', label: 'Marksheet 1' },
                    { key: 'marksheet2', label: 'Marksheet 2' },
                    { key: 'marksheet3', label: 'Marksheet 3' },
                  ].filter(({ key }) => formData[key]).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)' }}>
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                        style={{ background: 'rgba(37,99,235,0.1)' }}>
                        <FileText size={13} style={{ color: '#2563eb' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-700 dark:text-white/80">{label}</div>
                        <div className="text-xs text-slate-400 dark:text-white/30 truncate">
                          {formData[key].name} · {fmtSize(formData[key].size)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
