# Artist Workstation Audit — Setup Guide

A professional dark-themed web application for collecting artist workstation usage, software, project details, and hardware requirements for IT infrastructure planning.

---

## Folder Structure

```
artist-workstation-audit/
├── index.html                  # Main audit form (open this in browser)
├── admin.html                  # Admin dashboard — view, search, filter, export
├── css/
│   └── custom.css              # Glassmorphism dark theme styles
├── js/
│   ├── config.js               # ⚙️  App config — set your Google Script URL here
│   ├── form.js                 # Form rendering, validation, submission
│   └── admin.js                # Admin dashboard logic, export
├── google-apps-script/
│   └── Code.gs                 # Google Apps Script backend (paste into Apps Script)
└── README.md                   # This file
```

---

## Features

| Feature | Details |
|---|---|
| Dark UI | Glassmorphism cards, gradient accents, smooth animations |
| Form Sections | Basic details, Software, Project types, Project details, Hardware, Notes |
| Validation | Required field checks, at-least-one-checkbox, smooth error display |
| Google Sheets | POST submissions → Sheets via Apps Script |
| Admin Dashboard | Live data table with search, filter, pagination |
| Export | CSV download + Excel (.xlsx) via SheetJS |
| Demo Mode | Works fully offline with sample data (no URL needed) |
| Responsive | Mobile-first, works on all screen sizes |

---

## Part 1 — Run Locally in VS Code

### Requirements
- [VS Code](https://code.visualstudio.com/)
- [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (free, by Ritwick Dey)

### Steps

1. **Open the folder in VS Code**
   ```
   File → Open Folder → select the artist-workstation-audit folder
   ```

2. **Install Live Server** (if not already installed)
   - Press `Ctrl+Shift+X` → search "Live Server" → Install

3. **Start the server**
   - Right-click `index.html` in the Explorer panel
   - Select **"Open with Live Server"**
   - Browser opens at `http://127.0.0.1:5500/index.html`

4. **View the admin dashboard**
   - Open `http://127.0.0.1:5500/admin.html`
   - In demo mode (no Google URL set), sample data is shown automatically

> **Demo mode**: Without a Google Script URL, the form simulates submission (1.2 s delay → success). The admin dashboard shows 10 realistic sample rows. Everything works — just not saved anywhere.

---

## Part 2 — Google Sheets Setup

### Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → create a **New Spreadsheet**
2. Name it: `Artist Workstation Audit`
3. Leave the first sheet as-is (the script will create and format the `Workstation_Audit` tab automatically)

### Step 2: Open Apps Script

1. In the spreadsheet, click **Extensions → Apps Script**
2. The script editor opens in a new tab

### Step 3: Paste the backend code

1. Delete all existing code in the editor
2. Open `google-apps-script/Code.gs` from this project
3. Copy the entire contents and paste into the Apps Script editor
4. Click **Save** (disk icon) — name the project `Workstation Audit API`

### Step 4: Test the setup (optional but recommended)

1. In the Apps Script editor, select the function `testSetup` from the dropdown
2. Click **Run**
3. Grant permissions when prompted (click "Review permissions" → choose your Google account → "Allow")
4. Check your spreadsheet — a test row should appear in the `Workstation_Audit` sheet

### Step 5: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ next to "Type" → select **Web app**
3. Configure:
   - **Description**: `Workstation Audit API v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` ← **important**
4. Click **Deploy**
5. Copy the **Web app URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### Step 6: Connect to the app

1. Open `js/config.js` in VS Code
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with your copied URL:
   ```javascript
   GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
   ```
3. Save the file

### Step 7: Test the full flow

1. Open `index.html` in Live Server
2. Fill out the form and submit
3. Open your Google Sheet — the new response should appear in the `Workstation_Audit` tab
4. Open `admin.html` — click **Refresh** to load the live data

---

## Part 3 — Deploying Updates to Apps Script

If you edit `Code.gs` later:
1. In Apps Script editor, click **Deploy → Manage deployments**
2. Click the pencil ✏️ icon on your existing deployment
3. Change version to **"New version"**
4. Click **Deploy**

> The URL stays the same — no need to update `config.js` again.

---

## Part 4 — Customization

### Change company name / initials
Edit `js/config.js`:
```javascript
COMPANY_NAME:  'Your Studio Name',
LOGO_INITIALS: 'YS',
```

Then update the two `CS` text references in `index.html` and `admin.html` (search for `>CS<`).

### Add / remove software options
Edit the array in `js/config.js`:
```javascript
SOFTWARE_OPTIONS: [
  'Blender',
  'Your New Tool',   // add here
  // ...
]
```

### Add / remove project types
Edit `PROJECT_TYPE_OPTIONS` in `js/config.js`.

### Add / remove hardware issues
Edit `HARDWARE_ISSUES` in `js/config.js`.

### Change items per page (admin table)
```javascript
ITEMS_PER_PAGE: 20,  // default is 15
```

---

## Part 5 — Export Features

### CSV Export
- Click **CSV** button in admin dashboard nav
- Downloads `workstation_audit_YYYY-MM-DD.csv`
- Opens in Excel, Google Sheets, Numbers, etc.
- Includes BOM for correct UTF-8 handling

### Excel Export
- Click **Excel** button in admin dashboard nav
- Downloads `workstation_audit_YYYY-MM-DD.xlsx`
- Uses [SheetJS](https://sheetjs.com/) (loaded from CDN)
- Pre-formatted column widths

> Both exports apply your current **search/filter** — filter first, then export to get a targeted subset.

---

## Part 6 — Admin Dashboard Features

| Feature | How to use |
|---|---|
| Search | Type in the search box — searches name, role, dept, software, project types |
| Filter by dept | Dropdown populated from actual submission data |
| Filter by PC status | Yes / Sometimes / No |
| Row detail view | Click any row to see full untruncated data in a modal |
| Refresh | Re-fetches data from Google Sheets |
| Pagination | 15 rows per page (configurable in config.js) |

---

## Troubleshooting

**Form submits but data doesn't appear in Sheets**
- Check the Apps Script URL in `config.js` (no trailing slash, no quotes issues)
- Make sure the web app is deployed with **"Anyone"** access (not "Anyone with link")
- Check Apps Script → Executions log for errors

**Admin shows "Could not load data"**
- Same URL issue as above
- CORS is automatically handled for GET requests when "Anyone" access is set
- Try opening the URL directly in your browser — you should see `{"success":true,"message":"..."}`

**Excel export says "SheetJS library not loaded"**
- You need an internet connection for the CDN to load
- Or download SheetJS locally: https://unpkg.com/xlsx/dist/xlsx.full.min.js and change the script src to `js/xlsx.full.min.js`

**Live Server shows 404**
- Make sure you're opening the folder (not just a file) in VS Code
- Right-click `index.html` → "Open with Live Server"

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | HTML5, Tailwind CSS CDN, Vanilla JavaScript |
| Icons | Inline SVG |
| Fonts | Inter (Google Fonts CDN) |
| Excel | SheetJS (CDN) |
| Backend | Google Apps Script (free) |
| Database | Google Sheets (free) |
| Hosting (local) | VS Code Live Server |

No build tools, no npm, no Node.js required. Open in browser and it works.

---

*Artist Workstation Audit — Creative Studio IT Department*
