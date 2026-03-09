import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, RefreshCw, Trash2, Search, X, BookOpen, FileText,
  Calendar, Users, Grid, Loader, Eye, Download, Pencil, Save,
  ChevronLeft, ChevronRight, ChevronDown, Paperclip, Upload,
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';
import CalendarPicker from '../components/CalendarPicker.jsx';
import CertificatePreview from '../components/CertificatePreview.jsx';
import TagInput from '../components/TagInput.jsx';
import { getAllCertificates, deleteCertificate, updateCertificate, downloadMergedCertificate } from '../utils/api.js';
import { captureElementAsPdf } from '../utils/pdfGenerator.js';

const ITEMS_PER_PAGE = 10;

/* ── Custom dropdown ──────────────────────────────────────────── */
function FilterDropdown({ value, onChange, options, placeholder = 'All' }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  const selected = options.find((o) => o.value === value);
  const active = value !== '' && value != null;
  const activeColor = dark ? '#60a5fa' : '#2563eb';
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-150 hover:scale-105 whitespace-nowrap"
        style={{
          background: active ? (dark ? 'rgba(37,99,235,0.2)' : 'rgba(37,99,235,0.1)') : dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
          border: `1px solid ${active ? (dark ? 'rgba(96,165,250,0.4)' : 'rgba(37,99,235,0.35)') : dark ? 'rgba(255,255,255,0.12)' : 'rgba(186,214,243,0.6)'}`,
          color: active ? activeColor : dark ? 'rgba(255,255,255,0.55)' : '#475569',
          minWidth: '96px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <span className="flex-1 text-left">{selected?.label || placeholder}</span>
        <ChevronDown size={12} style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div
          className="absolute z-50 py-1.5 rounded-xl overflow-hidden"
          style={{
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '150px',
            background: dark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.99)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(186,214,243,0.7)'}`,
            boxShadow: '0 10px 36px rgba(37,99,235,0.13), 0 2px 8px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full text-left flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background: value === opt.value ? (dark ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.07)') : 'transparent',
                color: value === opt.value ? activeColor : dark ? 'rgba(255,255,255,0.75)' : '#334155',
              }}
              onMouseEnter={(e) => { if (value !== opt.value) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(37,99,235,0.04)'; }}
              onMouseLeave={(e) => { if (value !== opt.value) e.currentTarget.style.background = 'transparent'; }}
            >
              {opt.label}
              {value === opt.value && <span style={{ color: activeColor, fontSize: '10px' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function fmt(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInput(str) {
  if (!str) return '';
  return str.split('T')[0];
}

function getCertStatus(expiryDate) {
  if (!expiryDate) return null;
  return new Date(expiryDate) >= new Date() ? 'active' : 'expired';
}

const API_BASE = import.meta.env.VITE_API_URL || '';

/** Fetch a remote URL via backend proxy → base64 data URL (avoids Supabase CORS). */
async function fetchAsDataUrl(url) {
  if (!url || url.startsWith('data:')) return url;
  try {
    const proxyUrl = `${API_BASE}/api/proxy-image?url=${encodeURIComponent(url)}`;
    const resp = await fetch(proxyUrl);
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

function dbToFormData(cert) {
  return {
    certificateNumber: cert.certificate_number || 'AFF-2026-001',
    candidateName:     cert.candidate_name || '',
    fatherName:        cert.father_name || '',
    dob:               toDateInput(cert.dob),
    nationality:       cert.nationality || '',
    passportNumber:    cert.passport_number || '',
    courseName:        cert.course_name || '',
    webTechnologies:   Array.isArray(cert.web_technologies) ? cert.web_technologies : [],
    courseTitle:       cert.course_title || '',
    durationStart:     toDateInput(cert.duration_start),
    durationEnd:       toDateInput(cert.duration_end),
    hours:             cert.hours || '',
    issueDate:         toDateInput(cert.issue_date),
    expiryDate:        toDateInput(cert.expiry_date),
    authorizedPerson:  cert.authorized_person || '',
    // Use pre-loaded dataUrl (base64) if available, else fall back to URL
    stamp:     cert._stamp_data     ? { dataUrl: cert._stamp_data }     : cert.stamp_url     ? { dataUrl: cert.stamp_url }     : null,
    signature: cert._signature_data ? { dataUrl: cert._signature_data } : cert.signature_url ? { dataUrl: cert.signature_url } : null,
    photo:     cert._photo_data     ? { dataUrl: cert._photo_data }     : cert.photo_url     ? { dataUrl: cert.photo_url }     : null,
  };
}

const ghostBtn = (dark) => ({
  background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)',
  border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(186,214,243,0.5)'}`,
  color: dark ? 'rgba(255,255,255,0.75)' : '#334155',
});

const Field = ({ label, children }) => (
  <div>
    <label className="field-label">{label}</label>
    {children}
  </div>
);

/* ── Image replacer (stamp / signature / photo) ── */
function ImageReplacer({ label, currentUrl, newPreview, onFile }) {
  const inputRef = useRef(null);
  const src = newPreview || currentUrl;
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-center gap-3">
        {src ? (
          <img src={src} alt={label}
            className="w-14 h-14 object-contain rounded-xl shrink-0"
            style={{ background: 'rgba(241,248,255,0.9)', border: '1px solid rgba(186,214,243,0.5)' }} />
        ) : (
          <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.06)', border: '1px dashed rgba(37,99,235,0.2)' }}>
            <Upload size={16} style={{ color: '#93c5fd' }} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <button type="button" onClick={() => inputRef.current?.click()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563eb' }}>
            {src ? 'Replace' : 'Upload'}
          </button>
          {newPreview && (
            <span className="text-xs font-medium" style={{ color: '#16a34a' }}>New file selected</span>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => onFile(file, ev.target.result);
          reader.readAsDataURL(file);
          e.target.value = '';
        }} />
    </div>
  );
}

/* ── Marksheet replacer ── */
function MarksheetReplacer({ label, currentUrl, newFile, onFile }) {
  const inputRef = useRef(null);
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl"
        style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)' }}>
        <div className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
          style={{ background: 'rgba(37,99,235,0.1)' }}>
          <FileText size={13} style={{ color: '#2563eb' }} />
        </div>
        <div className="flex-1 min-w-0">
          {newFile ? (
            <div className="text-xs font-semibold text-slate-700 dark:text-white/80 truncate">{newFile.name}</div>
          ) : currentUrl ? (
            <a href={currentUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold truncate block"
              style={{ color: '#2563eb', textDecoration: 'none' }}>
              View current file ↗
            </a>
          ) : (
            <span className="text-xs text-slate-400 dark:text-white/30">No file uploaded</span>
          )}
          {newFile && <span className="text-xs font-medium" style={{ color: '#16a34a' }}>New file selected</span>}
        </div>
        <button type="button" onClick={() => inputRef.current?.click()}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0 transition-all hover:scale-105"
          style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563eb' }}>
          {currentUrl || newFile ? 'Replace' : 'Upload'}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/jpg,image/png" className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onFile(file);
          e.target.value = '';
        }} />
    </div>
  );
}

/* ── Attachments panel (read-only, for Preview modal) ── */
function AttachmentsPanel({ cert }) {
  const images = [
    { label: 'Stamp',     url: cert.stamp_url },
    { label: 'Signature', url: cert.signature_url },
    { label: 'Photo',     url: cert.photo_url },
  ].filter((f) => f.url);

  const marksheets = [
    { label: 'Marksheet 1', url: cert.marksheet1_url },
    { label: 'Marksheet 2', url: cert.marksheet2_url },
    { label: 'Marksheet 3', url: cert.marksheet3_url },
  ].filter((f) => f.url);

  if (!images.length && !marksheets.length) return null;

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(186,214,243,0.3)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Paperclip size={13} className="text-blue-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40">Attached Files</span>
      </div>

      {images.length > 0 && (
        <div className="flex gap-4 flex-wrap mb-3">
          {images.map(({ label, url }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
              <img src={url} alt={label}
                className="w-16 h-16 object-contain rounded-xl transition-transform group-hover:scale-105"
                style={{ background: 'rgba(241,248,255,0.9)', border: '1px solid rgba(186,214,243,0.5)' }} />
              <span className="text-xs text-slate-500 dark:text-white/40 group-hover:text-blue-500 transition-colors">{label}</span>
            </a>
          ))}
        </div>
      )}

      {marksheets.length > 0 && (
        <div className="space-y-2">
          {marksheets.map(({ label, url }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.13)', color: '#2563eb', textDecoration: 'none' }}>
              <FileText size={14} />
              <span className="text-xs font-semibold flex-1">{label}</span>
              <Download size={12} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Pagination helper ── */
function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

const EMPTY_FILES = { stamp: null, signature: null, photo: null, marksheet1: null, marksheet2: null, marksheet3: null };
const EMPTY_PREVIEWS = { stamp: null, signature: null, photo: null };

export default function Admin() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const [previewCert, setPreviewCert] = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const adminCaptureRef = useRef(null);

  const [editCert, setEditCert] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editFiles, setEditFiles] = useState(EMPTY_FILES);
  const [editPreviews, setEditPreviews] = useState(EMPTY_PREVIEWS);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCertificates();
      setCerts(data || []);
    } catch {
      toast.error('Failed to load certificates. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCerts(); }, [fetchCerts]);
  useEffect(() => { setCurrentPage(1); }, [search, filterYear, filterStatus, filterCourse, filterDateFrom, filterDateTo]);

  const years = [...new Set(
    certs.map((c) => c.certificate_number?.split('-')[1]).filter(Boolean)
  )].sort().reverse();

  const courses = [...new Set(certs.map((c) => c.course_name).filter(Boolean))].sort();

  const filtered = certs.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.candidate_name?.toLowerCase().includes(q) ||
      c.certificate_number?.toLowerCase().includes(q) ||
      c.course_name?.toLowerCase().includes(q);
    const matchYear   = !filterYear   || c.certificate_number?.includes(filterYear);
    const matchStatus = !filterStatus || getCertStatus(c.expiry_date) === filterStatus;
    const matchCourse = !filterCourse || c.course_name === filterCourse;
    const issueDay    = c.issue_date ? c.issue_date.split('T')[0] : '';
    const matchFrom   = !filterDateFrom || issueDay >= filterDateFrom;
    const matchTo     = !filterDateTo   || issueDay <= filterDateTo;
    return matchSearch && matchYear && matchStatus && matchCourse && matchFrom && matchTo;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /** Opens preview modal, pre-fetching image URLs as base64 for reliable display + PDF capture. */
  const openPreview = useCallback(async (cert) => {
    setLoadingPreviewId(cert.id);
    try {
      const [stampData, sigData, photoData] = await Promise.all([
        fetchAsDataUrl(cert.stamp_url),
        fetchAsDataUrl(cert.signature_url),
        fetchAsDataUrl(cert.photo_url),
      ]);
      setPreviewCert({
        ...cert,
        _stamp_data:     stampData !== cert.stamp_url     ? stampData     : null,
        _signature_data: sigData   !== cert.signature_url ? sigData       : null,
        _photo_data:     photoData !== cert.photo_url     ? photoData     : null,
      });
    } catch {
      setPreviewCert(cert);
    } finally {
      setLoadingPreviewId(null);
    }
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete certificate for "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteCertificate(id);
      toast.success('Certificate record deleted.');
      setCerts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdminDownload = async () => {
    if (!adminCaptureRef.current) {
      toast.error('Preview not ready. Please wait a moment and try again.');
      return;
    }
    setDownloadingPDF(true);
    const toastId = toast.loading('Generating certificate PDF...');
    try {
      // Capture the certificate page as PDF
      const certBlob = await captureElementAsPdf(adminCaptureRef.current);
      toast.loading('Merging with marksheets...', { id: toastId });
      // Send to backend which merges with saved marksheets from Supabase Storage
      const mergedBlob = await downloadMergedCertificate(previewCert.id, certBlob);
      const safeName = (previewCert.candidate_name || 'Certificate').replace(/\s+/g, '_');
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_Certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Certificate downloaded!', { id: toastId });
    } catch (err) {
      console.error('Admin download error:', err);
      toast.error('Failed to generate PDF.', { id: toastId });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleEdit = (cert) => {
    setEditCert(cert);
    setEditForm(dbToFormData(cert));
    setEditFiles(EMPTY_FILES);
    setEditPreviews(EMPTY_PREVIEWS);
  };

  const closeEdit = () => {
    setEditCert(null);
    setEditForm(null);
    setEditFiles(EMPTY_FILES);
    setEditPreviews(EMPTY_PREVIEWS);
  };

  const setField = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }));
  const setDateField = (key) => (v) => setEditForm((f) => ({ ...f, [key]: v }));

  const setImageFile = (key) => (file, dataUrl) => {
    setEditFiles((f) => ({ ...f, [key]: file }));
    setEditPreviews((p) => ({ ...p, [key]: dataUrl }));
  };

  const setDocFile = (key) => (file) => {
    setEditFiles((f) => ({ ...f, [key]: file }));
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const payload = {
        candidate_name:    editForm.candidateName,
        father_name:       editForm.fatherName,
        dob:               editForm.dob || null,
        nationality:       editForm.nationality,
        passport_number:   editForm.passportNumber || null,
        course_name:       editForm.courseName,
        web_technologies:  editForm.webTechnologies,
        course_title:      editForm.courseTitle,
        duration_start:    editForm.durationStart || null,
        duration_end:      editForm.durationEnd || null,
        hours:             editForm.hours ? parseInt(editForm.hours, 10) : null,
        issue_date:        editForm.issueDate || null,
        expiry_date:       editForm.expiryDate || null,
        authorized_person: editForm.authorizedPerson,
      };

      const hasFiles = Object.values(editFiles).some(Boolean);
      const updated = await updateCertificate(editCert.id, payload, hasFiles ? editFiles : null);

      toast.success('Certificate updated successfully!');
      setCerts((prev) => prev.map((c) => c.id === editCert.id ? { ...c, ...updated } : c));
      // Sync preview modal if the same cert is currently open in preview.
      // Clear any pre-loaded base64 for fields whose URLs changed so they reload fresh.
      if (previewCert?.id === editCert.id) {
        setPreviewCert((prev) => ({
          ...prev,
          ...updated,
          _stamp_data:     updated.stamp_url     ? null : prev._stamp_data,
          _signature_data: updated.signature_url ? null : prev._signature_data,
          _photo_data:     updated.photo_url     ? null : prev._photo_data,
        }));
      }
      closeEdit();
    } catch (err) {
      console.error('Update error:', err?.response?.data || err);
      const msg = err?.response?.data?.error || err?.message || 'Failed to update certificate.';
      toast.error(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const thisYear = new Date().getFullYear();


  return (
    <div className="min-h-screen page-bg transition-colors duration-300">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 navbar-glass">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-xl transition-all hover:scale-105" style={{ color: '#64748b' }}>
              <ArrowLeft size={18} />
            </Link>
            <div className="h-5 w-px" style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(186,214,243,0.5)' }} />
            <div className="p-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              <Grid size={18} />
            </div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={fetchCerts} disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50"
              style={ghostBtn(dark)}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Certificates', value: certs.length, icon: FileText, accent: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
            { label: `Issued in ${thisYear}`, value: certs.filter((c) => c.certificate_number?.includes(String(thisYear))).length, icon: Calendar, accent: '#0891b2', bg: 'rgba(8,145,178,0.08)' },
            { label: 'Latest Number', value: certs[0]?.certificate_number || '—', icon: BookOpen, accent: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: s.bg }}>
                <s.icon size={20} style={{ color: s.accent }} />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-800 dark:text-white truncate max-w-[120px] sm:max-w-none">{s.value}</div>
                <div className="text-xs text-slate-500 dark:text-white/40 mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Filters ── */}
        <div className="glass-card p-4 mb-4">

          {/* Search row */}
          <div className="flex items-center gap-2.5">
            <Search size={15} className="text-slate-400 dark:text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, certificate number, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-slate-800 dark:text-white/90 placeholder-slate-400 dark:placeholder-white/30"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="my-3" style={{ height: '1px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(186,214,243,0.35)' }} />

          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Status pills */}
            <div className="flex items-center gap-1">
              {[
                { v: '',        label: 'All' },
                { v: 'active',  label: 'Active' },
                { v: 'expired', label: 'Expired' },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setFilterStatus(v)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-150 hover:scale-105"
                  style={
                    filterStatus === v
                      ? v === ''
                        ? { background: '#2563eb', color: '#fff', border: '1px solid #2563eb', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }
                        : v === 'active'
                        ? { background: 'rgba(22,163,74,0.13)', color: dark ? '#4ade80' : '#16a34a', border: `1px solid rgba(22,163,74,${dark ? '0.4' : '0.35'})` }
                        : { background: 'rgba(220,38,38,0.10)', color: dark ? '#f87171' : '#dc2626', border: `1px solid rgba(220,38,38,${dark ? '0.4' : '0.3'})` }
                      : { background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)', color: dark ? 'rgba(255,255,255,0.5)' : '#64748b', border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(186,214,243,0.6)'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-5 w-px" style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(186,214,243,0.5)' }} />

            {/* Year dropdown */}
            <FilterDropdown
              value={filterYear}
              onChange={setFilterYear}
              placeholder="All Years"
              options={[{ value: '', label: 'All Years' }, ...years.map((y) => ({ value: y, label: y }))]}
            />

            {/* Course dropdown */}
            <FilterDropdown
              value={filterCourse}
              onChange={setFilterCourse}
              placeholder="All Courses"
              options={[{ value: '', label: 'All Courses' }, ...courses.map((c) => ({ value: c, label: c }))]}
            />

            <div className="h-5 w-px" style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(186,214,243,0.5)' }} />

            {/* Issue date range */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <CalendarPicker
                value={filterDateFrom}
                onChange={setFilterDateFrom}
                placeholder="From date"
                maxDate={filterDateTo || undefined}
              />
              <span className="text-xs font-bold text-slate-300 dark:text-white/20">→</span>
              <CalendarPicker
                value={filterDateTo}
                onChange={setFilterDateTo}
                placeholder="To date"
                minDate={filterDateFrom || undefined}
              />
            </div>

            {/* Clear all */}
            {(filterYear || filterStatus || filterCourse || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => { setFilterYear(''); setFilterStatus(''); setFilterCourse(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105 ml-auto"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader size={36} className="text-blue-400 animate-spin" />
              <p className="text-sm text-slate-400 dark:text-white/35">Loading certificates...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users size={48} className="text-slate-200 dark:text-white/10" />
              <p className="text-slate-500 dark:text-white/40 font-medium">
                {search || filterYear || filterStatus || filterCourse || filterDateFrom || filterDateTo ? 'No certificates match your filters.' : 'No certificates generated yet.'}
              </p>
              {!search && !filterYear && !filterStatus && !filterCourse && !filterDateFrom && !filterDateTo && (
                <Link to="/" className="btn-primary mt-2 text-sm inline-flex items-center gap-1.5">
                  <BookOpen size={14} /> Generate First Certificate
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(186,214,243,0.35)'}`, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(241,248,255,0.6)' }}>
                    {['Cert. No.', 'Candidate', 'Course', 'Issue Date', 'Expiry / Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: '#2563eb' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((cert, i) => {
                    const status = getCertStatus(cert.expiry_date);
                    return (
                      <tr key={cert.id}
                        className="transition-colors"
                        style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(186,214,243,0.2)'}`, background: i % 2 !== 0 ? (dark ? 'rgba(255,255,255,0.03)' : 'rgba(241,248,255,0.3)') : 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(37,99,235,0.04)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = i % 2 !== 0 ? (dark ? 'rgba(255,255,255,0.03)' : 'rgba(241,248,255,0.3)') : 'transparent'}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-xs tracking-wider" style={{ color: '#2563eb' }}>
                            {cert.certificate_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 dark:text-white/90">{cert.candidate_name}</div>
                          <div className="text-xs text-slate-400 dark:text-white/35 mt-0.5">{cert.nationality}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700 dark:text-white/80">{cert.course_name}</div>
                          <div className="text-xs text-slate-400 dark:text-white/35 mt-0.5 max-w-[180px] truncate">
                            {Array.isArray(cert.web_technologies) ? cert.web_technologies.join(', ') : cert.web_technologies}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-white/60 whitespace-nowrap">{fmt(cert.issue_date)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-slate-600 dark:text-white/60">{fmt(cert.expiry_date)}</div>
                          {status && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-semibold mt-1"
                              style={status === 'active'
                                ? { background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' }
                                : { background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.15)' }}>
                              <span className="w-1.5 h-1.5 rounded-full"
                                style={{ background: status === 'active' ? '#22c55e' : '#ef4444' }} />
                              {status === 'active' ? 'Active' : 'Expired'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openPreview(cert)} disabled={loadingPreviewId === cert.id} title="Preview"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all hover:scale-105 disabled:opacity-60"
                              style={{ background: dark ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.08)', border: `1px solid ${dark ? 'rgba(96,165,250,0.25)' : 'rgba(37,99,235,0.15)'}`, color: dark ? '#60a5fa' : '#2563eb' }}>
                              {loadingPreviewId === cert.id ? <Loader size={12} className="animate-spin" /> : <Eye size={12} />}
                              <span className="hidden sm:inline">Preview</span>
                            </button>
                            <button onClick={() => handleEdit(cert)} title="Edit"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all hover:scale-105"
                              style={{ background: dark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)', border: `1px solid ${dark ? 'rgba(251,191,36,0.25)' : 'rgba(245,158,11,0.2)'}`, color: dark ? '#fbbf24' : '#d97706' }}>
                              <Pencil size={12} /><span className="hidden sm:inline">Edit</span>
                            </button>
                            <button onClick={() => handleDelete(cert.id, cert.candidate_name)} disabled={deletingId === cert.id} title="Delete"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                              style={{ background: dark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.07)', border: `1px solid ${dark ? 'rgba(248,113,113,0.25)' : 'rgba(239,68,68,0.15)'}`, color: '#ef4444' }}>
                              {deletingId === cert.id ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer: count + pagination */}
              <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                style={{ borderTop: '1px solid rgba(186,214,243,0.3)' }}>
                <span className="text-xs text-slate-400 dark:text-white/30">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
                      className="p-1.5 rounded-lg disabled:opacity-30 transition-all" style={{ color: '#2563eb' }}>
                      <ChevronLeft size={15} />
                    </button>
                    {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                      page === '…' ? (
                        <span key={`e${idx}`} className="px-1 text-xs text-slate-400 dark:text-white/30">…</span>
                      ) : (
                        <button key={page} onClick={() => setCurrentPage(page)}
                          className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                          style={page === currentPage ? { background: '#2563eb', color: '#fff' } : { color: '#64748b' }}>
                          {page}
                        </button>
                      )
                    )}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}
                      className="p-1.5 rounded-lg disabled:opacity-30 transition-all" style={{ color: '#2563eb' }}>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ PREVIEW MODAL ══════════════════════════════════════════════ */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4 px-3"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
          <div className="modal-card w-full max-w-3xl my-auto">
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(186,214,243,0.4)' }}>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Certificate Preview</h3>
                <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5 font-mono">{previewCert.certificate_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleAdminDownload} disabled={downloadingPDF}
                  className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3">
                  {downloadingPDF
                    ? <><Loader size={13} className="animate-spin" /> Generating...</>
                    : <><Download size={13} /> Download PDF</>}
                </button>
                <button onClick={() => setPreviewCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <X size={17} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(186,214,243,0.4)', background: 'rgba(241,248,255,0.5)' }}>
                <CertificatePreview formData={dbToFormData(previewCert)} captureRef={adminCaptureRef} />
              </div>
              <p className="text-xs text-center text-slate-400 dark:text-white/30 mt-2">
                Click "Download PDF" to save this certificate
              </p>
              {/* Warn when stamp / signature / photo were not saved */}
              {(!previewCert.stamp_url || !previewCert.signature_url || !previewCert.photo_url) && (
                <div className="mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2.5 text-xs"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#b45309' }}>
                  <span className="shrink-0 font-bold mt-0.5">⚠</span>
                  <span>
                    {[
                      !previewCert.stamp_url     && 'Stamp',
                      !previewCert.signature_url && 'Signature',
                      !previewCert.photo_url     && 'Photo',
                    ].filter(Boolean).join(', ')} not saved for this certificate.
                    {' '}Use <strong>Edit</strong> → <em>Update Documents</em> to upload and save them, then re-download.
                  </span>
                </div>
              )}
              <AttachmentsPanel cert={previewCert} />
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT MODAL ══════════════════════════════════════════════ */}
      {editCert && editForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4 px-3"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
          <div className="modal-card w-full max-w-2xl my-auto">

            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(186,214,243,0.4)' }}>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Edit Certificate</h3>
                <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5 font-mono">{editCert.certificate_number}</p>
              </div>
              <button onClick={closeEdit}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                style={{ background: 'rgba(0,0,0,0.04)' }}>
                <X size={17} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">

              {/* ── Candidate Details ── */}
              <div className="section-card">
                <h4 className="section-title">Candidate Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Candidate Full Name">
                    <input className="glass-input" value={editForm.candidateName} onChange={setField('candidateName')} />
                  </Field>
                  <Field label="Father's Name">
                    <input className="glass-input" value={editForm.fatherName} onChange={setField('fatherName')} />
                  </Field>
                  <Field label="Date of Birth">
                    <CalendarPicker fullWidth value={editForm.dob} onChange={setDateField('dob')} placeholder="Select date" />
                  </Field>
                  <Field label="Nationality">
                    <input className="glass-input" value={editForm.nationality} onChange={setField('nationality')} />
                  </Field>
                  <Field label="Passport Number">
                    <input className="glass-input" placeholder="optional" value={editForm.passportNumber} onChange={setField('passportNumber')} />
                  </Field>
                </div>
              </div>

              {/* ── Course Details ── */}
              <div className="section-card">
                <h4 className="section-title">Course Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Course Name">
                    <input className="glass-input" value={editForm.courseName} onChange={setField('courseName')} />
                  </Field>
                  <Field label="Course Title">
                    <input className="glass-input" value={editForm.courseTitle} onChange={setField('courseTitle')} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Web Technologies">
                      <TagInput value={editForm.webTechnologies}
                        onChange={(tags) => setEditForm((f) => ({ ...f, webTechnologies: tags }))}
                        placeholder="HTML, CSS, JavaScript — press Enter" />
                    </Field>
                  </div>
                  <Field label="Duration Start">
                    <CalendarPicker fullWidth value={editForm.durationStart} onChange={setDateField('durationStart')} placeholder="Select date" maxDate={editForm.durationEnd || undefined} />
                  </Field>
                  <Field label="Duration End">
                    <CalendarPicker fullWidth value={editForm.durationEnd} onChange={setDateField('durationEnd')} placeholder="Select date" minDate={editForm.durationStart || undefined} />
                  </Field>
                  <Field label="Total Hours">
                    <input type="number" min="1" className="glass-input" value={editForm.hours} onChange={setField('hours')} />
                  </Field>
                </div>
              </div>

              {/* ── Certificate Details ── */}
              <div className="section-card">
                <h4 className="section-title">Certificate Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Date of Issue">
                    <CalendarPicker fullWidth value={editForm.issueDate} onChange={setDateField('issueDate')} placeholder="Select date" />
                  </Field>
                  <Field label="Date of Expiry">
                    <CalendarPicker fullWidth value={editForm.expiryDate} onChange={setDateField('expiryDate')} placeholder="Select date" minDate={editForm.issueDate || undefined} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Authorized Person">
                      <input className="glass-input" value={editForm.authorizedPerson} onChange={setField('authorizedPerson')} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* ── Update Documents ── */}
              <div className="section-card">
                <h4 className="section-title">
                  <Upload size={13} className="text-blue-500" /> Update Documents
                </h4>
                <p className="text-xs text-slate-500 dark:text-white/35 mb-4">
                  Click "Replace" to upload a new file. Leave unchanged to keep existing.
                </p>

                {/* Images */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <ImageReplacer
                    label="Stamp"
                    currentUrl={editCert.stamp_url}
                    newPreview={editPreviews.stamp}
                    onFile={setImageFile('stamp')}
                  />
                  <ImageReplacer
                    label="Signature"
                    currentUrl={editCert.signature_url}
                    newPreview={editPreviews.signature}
                    onFile={setImageFile('signature')}
                  />
                  <ImageReplacer
                    label="Passport Photo"
                    currentUrl={editCert.photo_url}
                    newPreview={editPreviews.photo}
                    onFile={setImageFile('photo')}
                  />
                </div>

                {/* Marksheets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MarksheetReplacer
                    label="Marksheet 1"
                    currentUrl={editCert.marksheet1_url}
                    newFile={editFiles.marksheet1}
                    onFile={setDocFile('marksheet1')}
                  />
                  <MarksheetReplacer
                    label="Marksheet 2"
                    currentUrl={editCert.marksheet2_url}
                    newFile={editFiles.marksheet2}
                    onFile={setDocFile('marksheet2')}
                  />
                  <MarksheetReplacer
                    label="Marksheet 3"
                    currentUrl={editCert.marksheet3_url}
                    newFile={editFiles.marksheet3}
                    onFile={setDocFile('marksheet3')}
                  />
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4"
              style={{ borderTop: '1px solid rgba(186,214,243,0.4)' }}>
              <button onClick={closeEdit}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                style={ghostBtn(dark)}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={savingEdit}
                className="btn-primary flex items-center gap-2 text-sm py-2.5">
                {savingEdit
                  ? <><Loader size={14} className="animate-spin" /> Saving...</>
                  : <><Save size={14} /> Save Changes</>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
