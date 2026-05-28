// ============================================================
//  ADMIN.JS — Dashboard: fetch, filter, paginate, export
// ============================================================

const DEMO_DATA = [
  ['28 May 2025, 9:14 AM','Arjun Mehta','Senior 3D Artist','3D Department','Blender, ZBrush, Adobe Substance 3D Painter','Modelling, Texturing, Lifestyle Rendering','Luxury product viz campaign','Car interior renders for Q3','Sometimes','Rendering slow, GPU memory full','Need RTX 4090 urgently for Q3 deadline.'],
  ['28 May 2025, 10:02 AM','Priya Sharma','Unreal Engine Artist','UE Team','Unreal Engine, Maya, Adobe After Effects','Unreal Engine Environment, Unreal Engine Animation, Unreal Engine Rendering','Interactive car configurator','Virtual showroom expansion','No','Unreal crashing, Viewport lag, GPU memory full','Crashes 3-4 times a day, loses unsaved work.'],
  ['28 May 2025, 10:45 AM','Rahul Verma','Motion Graphics Designer','Motion Design','Adobe After Effects, Adobe Premiere Pro, Adobe Photoshop','Product Animation, Lifestyle + AI','Brand launch videos','3 more brand campaigns','Yes','','Running fine but storage is filling up fast.'],
  ['27 May 2025, 3:22 PM','Sneha Iyer','Texture Artist','3D Department','Adobe Substance 3D Painter, Adobe Photoshop, ZBrush','Texturing, Modelling','Furniture collection for e-commerce','Automotive material library','Sometimes','Viewport lag, Export slow','Substance Painter slows down with 4K maps.'],
  ['27 May 2025, 4:10 PM','Karan Patel','Lighting & Rendering Artist','Rendering','Blender, Houdini, Adobe Photoshop','Still Rendering, Lifestyle Rendering, Lifestyle + AI','High-end jewelry renders','AI-assisted lifestyle imagery','No','Rendering slow, Storage issue','Farm renders take 8 hrs per frame. Need better GPU.'],
  ['26 May 2025, 11:30 AM','Divya Nair','3D Generalist','3D Department','Maya, Blender, Adobe Substance 3D Painter','Modelling, Texturing, Still Rendering','Consumer electronics product shots','Home appliances collection','Sometimes','GPU memory full','Maya runs hot with 8K textures.'],
  ['26 May 2025, 2:15 PM','Amit Joshi','Unreal Engine Developer','UE Team','Unreal Engine, 3ds Max','Unreal Engine Environment, Unreal Engine Rendering','Retail virtual experience','Theme park visualization','No','Unreal crashing, GPU memory full, Viewport lag','Lumen + Nanite causes OOM crashes on current 8 GB VRAM.'],
  ['25 May 2025, 9:50 AM','Nisha Gupta','2D/3D Hybrid Artist','Motion Design','Adobe Illustrator, Adobe After Effects, Blender','Lifestyle + AI, Product Animation','Social media content','AI pipeline integration','Yes','','All good. A second monitor would help though.'],
  ['25 May 2025, 1:40 PM','Vikram Singh','Lead 3D Artist','3D Department','Maya, ZBrush, Houdini, Adobe Substance 3D Painter','Modelling, Texturing, Still Rendering, Lifestyle Rendering','Flagship product hero shots','2026 catalog production','Sometimes','Rendering slow, Viewport lag','Need 64 GB RAM min. Current 32 GB swaps heavily.'],
  ['24 May 2025, 10:05 AM','Ananya Reddy','VFX Artist','Motion Design','Adobe After Effects, Adobe Premiere Pro, Blender, Houdini','Lifestyle + AI, Product Animation','Exploded-view animations','Simulation-heavy content','No','Rendering slow, Export slow, Storage issue','Simulations are bottlenecked. Need NVMe upgrade.'],
];

// ── State ──────────────────────────────────────────────────────────────────
let allRows      = [];
let filteredRows = [];
let currentPage  = 1;
const pageSize   = CONFIG.ITEMS_PER_PAGE || 15;

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  document.getElementById('searchInput')?.addEventListener('input',  applyFilters);
  document.getElementById('deptFilter')?.addEventListener('change',  applyFilters);
  document.getElementById('hwFilter')?.addEventListener('change',    applyFilters);
  document.getElementById('refreshBtn')?.addEventListener('click',   fetchData);
  document.getElementById('exportCsvBtn')?.addEventListener('click', exportCSV);
  document.getElementById('exportXlsxBtn')?.addEventListener('click', exportXLSX);
  document.getElementById('detailModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeDetail();
  });
});

// ── Fetch ──────────────────────────────────────────────────────────────────
async function fetchData() {
  showSkeletons();

  if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    await new Promise(r => setTimeout(r, 800));
    allRows = DEMO_DATA.map(r => [...r]);
    renderAll();
    showBanner('demo-banner');
    return;
  }

  try {
    const url = `${CONFIG.GOOGLE_SCRIPT_URL}?action=getData&t=${Date.now()}`;
    const res  = await fetch(url);
    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Server error');

    const rows = json.data;
    // Skip header row (row 0)
    allRows = rows.length > 1 ? rows.slice(1) : [];
    renderAll();
  } catch (err) {
    console.error('Fetch error:', err);
    showError('Could not load data. Check your Google Apps Script URL in config.js.');
  }
}

function renderAll() {
  populateDeptFilter();
  applyFilters();
}

// ── Filters ────────────────────────────────────────────────────────────────
function applyFilters() {
  const query  = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const dept   = (document.getElementById('deptFilter')?.value  || '').toLowerCase();
  const hw     = (document.getElementById('hwFilter')?.value    || '').toLowerCase();

  filteredRows = allRows.filter(row => {
    const deptVal = (row[3] || '').toLowerCase();
    const hwVal   = (row[8] || '').toLowerCase();

    if (dept && !deptVal.includes(dept)) return false;
    if (hw   && hwVal !== hw)            return false;
    if (query) {
      const combined = row.slice(0, 9).join(' ').toLowerCase();
      if (!combined.includes(query)) return false;
    }
    return true;
  });

  currentPage = 1;
  renderTable();
  updateStats();
}

function populateDeptFilter() {
  const sel = document.getElementById('deptFilter');
  if (!sel) return;
  const depts = [...new Set(allRows.map(r => (r[3] || '').trim()).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">All Departments</option>';
  depts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.toLowerCase();
    opt.textContent = d;
    sel.appendChild(opt);
  });
}

// ── Table render ───────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('adminTableBody');
  const totalCount = document.getElementById('totalCount');
  if (!tbody) return;

  const start = (currentPage - 1) * pageSize;
  const page  = filteredRows.slice(start, start + pageSize);

  if (totalCount) totalCount.textContent = filteredRows.length;

  if (page.length === 0) {
    tbody.innerHTML = `<tr class="no-data"><td colspan="11" class="text-center py-16">
      <div class="text-4xl mb-3">🔍</div>
      <div class="text-slate-400 font-medium">No submissions found</div>
      <div class="text-slate-600 text-sm mt-1">Try adjusting your search or filters</div>
    </td></tr>`;
    renderPagination(0);
    return;
  }

  tbody.innerHTML = page.map((row, idx) => {
    const globalIdx = start + idx;
    const hw  = (row[8] || '').trim();
    const badgeClass = hw === 'Yes' ? 'badge-yes' : hw === 'No' ? 'badge-no' : 'badge-sometimes';
    const hwLabel    = hw || '—';

    return `<tr class="cursor-pointer" onclick="openDetail(${globalIdx})" title="Click to view full details">
      <td class="text-slate-500 text-xs">${escHtml(row[0] || '—')}</td>
      <td class="font-medium text-slate-200">${escHtml(row[1] || '—')}</td>
      <td>${escHtml(row[2] || '—')}</td>
      <td>${escHtml(row[3] || '—')}</td>
      <td class="hide-mobile">${escHtml(truncate(row[4], 40))}</td>
      <td class="hide-mobile">${escHtml(truncate(row[5], 40))}</td>
      <td class="hide-mobile">${escHtml(truncate(row[6], 35))}</td>
      <td><span class="badge ${badgeClass}">${escHtml(hwLabel)}</span></td>
      <td class="hide-mobile">${escHtml(truncate(row[9], 35))}</td>
      <td>
        <button onclick="event.stopPropagation(); openDetail(${globalIdx})"
          class="text-xs text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded"
          style="background: rgba(124,58,237,.1)">View</button>
      </td>
    </tr>`;
  }).join('');

  renderPagination(filteredRows.length);
}

// ── Pagination ─────────────────────────────────────────────────────────────
function renderPagination(total) {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

  const range = pageRange(currentPage, totalPages);
  range.forEach(p => {
    if (p === '…') {
      html += `<span class="page-btn" style="cursor:default;border:none;background:none;color:#475569">…</span>`;
    } else {
      html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="changePage(${p})">${p}</button>`;
    }
  });

  html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
  container.innerHTML = html;
}

function pageRange(cur, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
  if (cur <= 4)   return [1,2,3,4,5,'…',total];
  if (cur >= total - 3) return [1,'…',total-4,total-3,total-2,total-1,total];
  return [1,'…',cur-1,cur,cur+1,'…',total];
}

function changePage(p) {
  const totalPages = Math.ceil(filteredRows.length / pageSize);
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  renderTable();
  document.getElementById('adminTableBody')?.closest('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Stats ──────────────────────────────────────────────────────────────────
function updateStats() {
  const total    = allRows.length;
  const issues   = allRows.filter(r => r[8] === 'No' || r[8] === 'Sometimes').length;
  const thisWeek = allRows.filter(r => isThisWeek(r[0])).length;
  const topSw    = getTopSoftware();

  setText('stat-total',    total);
  setText('stat-issues',   issues);
  setText('stat-week',     thisWeek);
  setText('stat-software', topSw);

  const pct = document.getElementById('issues-pct');
  if (pct && total) pct.textContent = `${Math.round(issues / total * 100)}% need attention`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function isThisWeek(tsStr) {
  try {
    const d = new Date(tsStr);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  } catch { return false; }
}

function getTopSoftware() {
  const counts = {};
  allRows.forEach(r => {
    (r[4] || '').split(',').forEach(s => {
      const t = s.trim();
      if (t) counts[t] = (counts[t] || 0) + 1;
    });
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || '—';
}

// ── Detail modal ───────────────────────────────────────────────────────────
function openDetail(idx) {
  const row = filteredRows[idx];
  if (!row) return;

  const cols = CONFIG.ADMIN_COLUMNS;
  const modal = document.getElementById('detailModal');
  const body  = document.getElementById('detailBody');
  const nameEl= document.getElementById('detailName');
  if (!modal || !body) return;

  if (nameEl) nameEl.textContent = row[1] || 'Detail View';

  body.innerHTML = cols.map((col, i) => `
    <div class="detail-row">
      <div class="detail-label">${escHtml(col)}</div>
      <div class="detail-value">${escHtml(row[i] || '—')}</div>
    </div>
  `).join('');

  modal.classList.add('show');
}

function closeDetail() { document.getElementById('detailModal')?.classList.remove('show'); }
window.openDetail  = openDetail;
window.closeDetail = closeDetail;
window.changePage  = changePage;

// ── Exports ────────────────────────────────────────────────────────────────
function exportCSV() {
  const headers = CONFIG.ADMIN_COLUMNS;
  const rows    = filteredRows.length ? filteredRows : allRows;
  if (!rows.length) { alert('No data to export.'); return; }

  const csv = [
    headers.map(csvCell).join(','),
    ...rows.map(r => headers.map((_, i) => csvCell(r[i] || '')).join(','))
  ].join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `workstation_audit_${datestamp()}.csv`);
}

function csvCell(val) {
  const str = String(val).replace(/"/g, '""');
  return /[,"\n]/.test(str) ? `"${str}"` : str;
}

function exportXLSX() {
  if (typeof XLSX === 'undefined') {
    alert('SheetJS library not loaded. Check your internet connection.');
    return;
  }
  const rows = filteredRows.length ? filteredRows : allRows;
  if (!rows.length) { alert('No data to export.'); return; }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([CONFIG.ADMIN_COLUMNS, ...rows]);

  // Column widths
  ws['!cols'] = CONFIG.ADMIN_COLUMNS.map((_, i) => ({ wch: [22, 18, 18, 16, 30, 30, 30, 30, 12, 30, 35][i] || 20 }));

  XLSX.utils.book_append_sheet(wb, ws, 'Workstation Audit');
  XLSX.writeFile(wb, `workstation_audit_${datestamp()}.xlsx`);
}

function triggerDownload(blob, filename) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function datestamp() {
  return new Date().toISOString().slice(0, 10);
}

// ── UI state helpers ───────────────────────────────────────────────────────
function showSkeletons() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;
  tbody.innerHTML = Array.from({length: 6}, () => `
    <tr>${Array.from({length: 10}, () => `<td><div class="skeleton" style="width:${60+Math.random()*35}%"></div></td>`).join('')}</tr>
  `).join('');
}

function showError(msg) {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="no-data"><td colspan="10" class="text-center py-16">
    <div class="text-4xl mb-3">⚠️</div>
    <div class="text-red-400 font-medium">${escHtml(msg)}</div>
  </td></tr>`;
}

function showBanner(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

// ── Utilities ──────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function truncate(str, len) {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
