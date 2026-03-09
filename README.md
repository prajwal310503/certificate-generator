# Certificate Generator

Full-stack dynamic PDF certificate generator — fill a form, get a merged PDF (certificate + 3 marksheets) downloaded instantly.

**Stack:** React 18 + Vite + Tailwind CSS · Node.js + Express · Supabase (PostgreSQL + Storage) · html2canvas + jsPDF · pdf-lib

---

## How PDF Merging Works

### 1. Frontend captures the certificate page

When the user clicks **Generate & Download Certificate**:

- `html2canvas` takes a pixel-perfect screenshot of the live `CertificatePreview` component rendered in the browser (includes stamp, signature, photo, QR code, all injected values).
- `jsPDF` converts that screenshot into a single-page A4 PDF blob entirely in the browser — no server needed for the design step.

### 2. Everything is sent to the backend

A `multipart/form-data` POST is sent to `POST /api/certificates/generate` containing:

| Field | Type | What it is |
|---|---|---|
| `certificate` | PDF blob | The A4 certificate captured above |
| `marksheet1` | PDF / JPG / PNG | First marksheet uploaded by user |
| `marksheet2` | PDF / JPG / PNG | Second marksheet |
| `marksheet3` | PDF / JPG / PNG | Third marksheet |
| `stamp` | JPG / PNG | Stamp image (stored to Supabase) |
| `signature` | JPG / PNG | Signature image (stored to Supabase) |
| `photo` | JPG / PNG | Passport photo (stored to Supabase) |
| `formData` | JSON string | All candidate, course, and certificate fields |

### 3. Backend merges the PDFs

The backend (`pdfService.js`) uses **pdf-lib** to merge:

```
Step A — For each marksheet:
  If it is a JPG or PNG  →  embed image into a new blank A4 PDF page
  If it is already a PDF →  use it directly

Step B — Merge in fixed order:
  Page 1  →  Certificate (captured from frontend)
  Page 2  →  Marksheet 1
  Page 3  →  Marksheet 2
  Page 4  →  Marksheet 3

Step C — Serialize the merged PDFDocument to bytes
Step D — Send merged PDF back as binary response
```

### 4. Frontend auto-downloads the result

The browser receives the merged PDF blob, creates a temporary link, and triggers an instant download:

```
Filename: CandidateName_Certificate.pdf
```

### Re-download from Admin Panel

When you click **Download PDF** from the Admin panel:

1. The certificate preview is captured fresh via `html2canvas` + `jsPDF`.
2. Sent to `POST /api/certificates/:id/download`.
3. Backend fetches the 3 saved marksheet files from **Supabase Storage** (stored during original generation).
4. Merges certificate + marksheets using the same pdf-lib logic.
5. Returns merged PDF for download.

Images stored in Supabase are proxied through `GET /api/proxy-image?url=...` to avoid CORS issues when displaying them in the browser preview.

---

## Supabase Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note your credentials.

### 2. Run this SQL in the Supabase SQL Editor

```sql
CREATE TABLE certificates (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_number TEXT UNIQUE NOT NULL,
  candidate_name    TEXT NOT NULL,
  father_name       TEXT NOT NULL,
  dob               DATE NOT NULL,
  nationality       TEXT NOT NULL,
  passport_number   TEXT,
  course_name       TEXT NOT NULL,
  web_technologies  TEXT[] NOT NULL DEFAULT '{}',
  course_title      TEXT NOT NULL,
  duration_start    DATE NOT NULL,
  duration_end      DATE NOT NULL,
  hours             INTEGER NOT NULL,
  issue_date        DATE NOT NULL,
  expiry_date       DATE NOT NULL,
  authorized_person TEXT NOT NULL,
  stamp_url         TEXT,
  signature_url     TEXT,
  photo_url         TEXT,
  marksheet1_url    TEXT,
  marksheet2_url    TEXT,
  marksheet3_url    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON certificates
  USING (true)
  WITH CHECK (true);
```

### 3. Create a Storage bucket

Go to **Storage** → **New Bucket** → Name: `certificate-assets` → check **Public** → Create.

This is where stamp, signature, photo, and marksheet files are stored.

### 4. Get your credentials

- **SUPABASE_URL** → Project Settings → API → Project URL
- **SUPABASE_SERVICE_KEY** → Project Settings → API → `service_role` key (the secret one, not anon)

---

## Environment Setup

Create a file at `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
PORT=5000
```

> Never commit this file. The service_role key has full database access.

---

## Running the Project

Open two terminals.

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:5000`

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
Certificate Task/
├── backend/
│   ├── index.js                       Express server, /api/proxy-image route
│   ├── .env                           Your credentials (create this)
│   ├── routes/
│   │   └── certificates.js            API route definitions
│   ├── controllers/
│   │   └── certificateController.js   generate, download, update, delete
│   └── services/
│       ├── supabaseService.js         DB queries + Storage upload/download
│       └── pdfService.js              imageToPdf + mergePdfs (pdf-lib)
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx               Generator form + live preview
        │   └── Admin.jsx              List, preview, edit, delete certificates
        ├── components/
        │   ├── CertificateForm.jsx    All form sections
        │   ├── CertificatePreview.jsx Live A4 preview (also the PDF capture target)
        │   ├── CalendarPicker.jsx     Custom date picker
        │   ├── TagInput.jsx           Tag input for web technologies
        │   └── FileUpload.jsx         Drag-and-drop file uploader
        ├── utils/
        │   ├── pdfGenerator.js        html2canvas → jsPDF capture logic
        │   ├── api.js                 Axios calls to backend
        │   └── validation.js          Frontend form validation rules
        └── theme/
            └── ThemeContext.jsx       Light/dark theme provider
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/certificates/number` | Get next auto-incremented certificate number |
| POST | `/api/certificates/generate` | Capture + merge + save + return PDF |
| GET | `/api/certificates` | List all certificates |
| PUT | `/api/certificates/:id` | Update record and optionally replace files |
| POST | `/api/certificates/:id/download` | Re-generate merged PDF for existing record |
| DELETE | `/api/certificates/:id` | Delete certificate record |
| GET | `/api/proxy-image?url=...` | Proxy Supabase images to avoid CORS |

---

## Deployment (Going Live)

The backend goes to **Render** (free), the frontend goes to **Vercel** (free).

---

### Step 1 — Push code to GitHub

1. Go to [github.com](https://github.com) → **New repository** → name it (e.g. `certificate-generator`) → Create.
2. Open a terminal in your project root (`Certificate Task/`) and run:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/certificate-generator.git
git push -u origin main
```

> The `.gitignore` already excludes `node_modules/` and `.env` so secrets are safe.

---

### Step 2 — Deploy Backend to Render

1. Go to [render.com](https://render.com) → Sign up / Log in → **New** → **Web Service**
2. Connect your GitHub account → select your repository
3. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `certificate-generator-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

4. Under **Environment Variables**, add:

```
SUPABASE_URL         = https://your-project.supabase.co
SUPABASE_SERVICE_KEY = your-service-role-key
PORT                 = 5000
```

> Leave `FRONTEND_URL` blank for now — you'll add it after Vercel gives you a URL.

5. Click **Deploy Web Service** — wait ~2 minutes.
6. Copy your backend URL, it looks like: `https://certificate-generator-api.onrender.com`

https://certificate-generator-api-s137.onrender.com

---

### Step 3 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up / Log in → **Add New Project**
2. Import your GitHub repository
3. Fill in the settings:

| Field | Value |
|---|---|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Under **Environment Variables**, add:

```
VITE_API_URL = https://certificate-generator-api.onrender.com
```

(Use your actual Render URL from Step 2 — no trailing slash)

5. Click **Deploy** — wait ~1 minute.
6. Copy your frontend URL, it looks like: `https://certificate-generator.vercel.app`

https://certificate-generator-beta-one.vercel.app/
---

### Step 4 — Connect frontend URL to backend (CORS fix)

1. Go back to Render → your web service → **Environment** tab
2. Add one more variable:

```
FRONTEND_URL = https://certificate-generator.vercel.app
```

3. Click **Save** — Render will auto-redeploy.

Your app is now live. Both URLs are permanent and free.

---

### Render Free Tier Note

On Render's free plan, the backend **spins down after 15 minutes of inactivity** and takes ~30 seconds to wake up on the next request. The first request after idle will be slow — subsequent requests are instant. Upgrade to a paid plan ($7/month) to keep it always-on.

---

## Certificate Number Format

```
AFF-YYYY-XXX
Example: AFF-2026-004
```

Auto-incremented by querying the highest existing number for the current year in Supabase. Generated fresh at download time (not reserved on page load).
