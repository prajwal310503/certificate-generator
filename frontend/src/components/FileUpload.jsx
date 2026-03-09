import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image, X } from 'lucide-react';
import { validateFile } from '../utils/validation.js';

export default function FileUpload({
  label,
  accept = 'image/jpeg,image/png,application/pdf',
  onFile,
  value,
  error,
  preview = false,
  dataUrl,
  required = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) { onFile(null, null, err); return; }
    if (preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => onFile(file, e.target.result, null);
      reader.readAsDataURL(file);
    } else {
      onFile(file, null, null);
    }
  };

  const handleChange = (e) => processFile(e.target.files?.[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const clear = (e) => {
    e.stopPropagation();
    onFile(null, null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const zoneClass = dragging
    ? 'border-blue-400 bg-blue-50/60 dark:bg-blue-500/10 scale-[1.02]'
    : error
    ? 'border-red-400/60 bg-red-50/30 dark:bg-red-500/5'
    : value
    ? 'border-blue-300/60 bg-blue-50/30 dark:bg-blue-500/5'
    : 'border-slate-200/60 dark:border-white/[0.1] bg-white/60 dark:bg-white/[0.04] hover:border-blue-300 dark:hover:border-white/20 hover:bg-blue-50/40 dark:hover:bg-white/[0.06]';

  return (
    <div>
      <label className="field-label">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 min-h-[88px] ${zoneClass}`}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />

        {preview && dataUrl ? (
          <div className="flex flex-col items-center gap-1 w-full">
            <img src={dataUrl} alt="Preview" className="h-16 w-auto object-contain rounded-lg border border-blue-200/50 dark:border-white/10" />
            <span className="text-xs text-slate-500 dark:text-white/40 truncate max-w-[160px]">{value?.name}</span>
            <button onClick={clear} className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-red-100/80 dark:bg-red-500/20 text-red-500 hover:bg-red-200 transition-colors">
              <X size={12} />
            </button>
          </div>
        ) : value ? (
          <div className="flex items-center gap-2 w-full px-1">
            {value.type === 'application/pdf'
              ? <FileText size={22} className="text-blue-500 dark:text-blue-400 shrink-0" />
              : <Image size={22} className="text-blue-500 dark:text-blue-400 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-white/90 truncate">{value.name}</p>
              <p className="text-xs text-slate-400 dark:text-white/35">{(value.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={clear} className="p-1 rounded-full bg-red-100/80 dark:bg-red-500/20 text-red-500 hover:bg-red-200 transition-colors shrink-0">
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud size={24} className="text-blue-400 dark:text-blue-400/60" />
            <p className="text-xs text-center text-slate-500 dark:text-white/40">
              <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-slate-400 dark:text-white/25">PDF, JPG, PNG — max 5MB</p>
          </>
        )}
      </div>
      {error && <p className="field-error"><span className="text-red-400">!</span> {error}</p>}
    </div>
  );
}
