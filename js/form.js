// ============================================================
//  FORM.JS — Form rendering, validation, and submission
// ============================================================

document.addEventListener('DOMContentLoaded', initForm);

function initForm() {
  renderCheckboxGroup('softwareCheckboxes',    CONFIG.SOFTWARE_OPTIONS,      'software',    'softwareOtherContainer');
  renderCheckboxGroup('projectTypeCheckboxes', CONFIG.PROJECT_TYPE_OPTIONS,  'projectType', 'projectTypeOtherContainer');
  renderCheckboxGroup('hardwareIssuesCheckboxes', CONFIG.HARDWARE_ISSUES,    'hwIssue',     null);

  setupChipInputs();
  setupHardwareToggle();
  setupValidation();
  setupCharCounter();
  animateSections();

  document.getElementById('auditForm').addEventListener('submit', handleSubmit);
  document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) hideModal('successModal');
  });
}

// ── Render checkbox groups ─────────────────────────────────────────────────

function renderCheckboxGroup(containerId, options, name, otherContainerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  options.forEach(option => {
    const isOther = (option === 'Other' || option === 'Others');
    const label = document.createElement('label');
    label.className = 'custom-checkbox';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = name;
    cb.value = option;

    const span = document.createElement('span');
    span.textContent = option;
    span.className = 'text-sm text-slate-300 select-none';

    cb.addEventListener('change', () => {
      label.classList.toggle('checked', cb.checked);
      if (isOther && otherContainerId) {
        const el = document.getElementById(otherContainerId);
        if (el) el.classList.toggle('show', cb.checked);
      }
      clearGroupError(name);
    });

    label.appendChild(cb);
    label.appendChild(span);
    container.appendChild(label);
  });
}

// ── Project chip inputs ────────────────────────────────────────────────────

function setupChipInputs() {
  [['currentProject', 'currentProjectAddBtn'], ['futureProject', 'futureProjectAddBtn']].forEach(([group, btnId]) => {
    const input = document.getElementById(`${group}Input`);
    const btn   = document.getElementById(btnId);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addChip(group); } });
    btn?.addEventListener('click', () => addChip(group));
  });
}

function addChip(group) {
  const input     = document.getElementById(`${group}Input`);
  const container = document.getElementById(`${group}Chips`);
  if (!input || !container) return;
  const val = input.value.trim();
  if (!val) return;

  const chip = document.createElement('div');
  chip.className = 'chip';

  const label = document.createElement('span');
  label.textContent = val;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'chip-remove';
  remove.setAttribute('aria-label', 'Remove');
  remove.textContent = '×';
  remove.addEventListener('click', () => chip.remove());

  chip.appendChild(label);
  chip.appendChild(remove);
  container.appendChild(chip);

  // Clear validation error as soon as first chip is added
  const err = document.getElementById(`${group}-error`);
  if (err) err.classList.add('hidden');

  input.value = '';
  input.focus();
}

function getChips(group) {
  const container = document.getElementById(`${group}Chips`);
  if (!container) return '';
  return [...container.querySelectorAll('span')].map(s => s.textContent.trim()).filter(Boolean).join(', ');
}

// ── Hardware toggle ────────────────────────────────────────────────────────

function setupHardwareToggle() {
  document.querySelectorAll('input[name="hardwareHandles"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.custom-radio').forEach(r => r.classList.remove('selected'));
      radio.closest('.custom-radio').classList.add('selected');
      const show = radio.value === 'No' || radio.value === 'Sometimes';
      document.getElementById('hardwareIssuesSection').classList.toggle('show', show);
      clearGroupError('hardwareHandles');
    });
  });
}

// ── Real-time validation ───────────────────────────────────────────────────

function setupValidation() {
  ['employeeName', 'role'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('blur',  () => validateTextField(el));
    el.addEventListener('input', () => { if (el.classList.contains('error')) validateTextField(el); });
  });
}

function validateTextField(el) {
  const hasVal = el.value.trim().length > 0;
  el.classList.toggle('error', !hasVal);
  const errEl = document.getElementById(`${el.id}-error`);
  if (errEl) errEl.classList.toggle('hidden', hasVal);
  return hasVal;
}

function clearGroupError(name) {
  const errEl = document.getElementById(`${name}-error`);
  if (errEl) errEl.classList.add('hidden');
}

// ── Char counter ───────────────────────────────────────────────────────────

function setupCharCounter() {
  const ta = document.getElementById('additionalNotes');
  const counter = document.getElementById('notesCounter');
  if (!ta || !counter) return;
  ta.addEventListener('input', () => {
    counter.textContent = `${ta.value.length} / 1000`;
    counter.style.color = ta.value.length > 900 ? '#f87171' : '#475569';
  });
}

// ── Section entrance animation ─────────────────────────────────────────────

function animateSections() {
  const sections = document.querySelectorAll('.form-section');
  // Mark ready for animation — done here in JS so sections stay visible if JS fails
  sections.forEach(s => s.classList.add('animate-ready'));
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }});
  }, { threshold: 0.05 });
  sections.forEach(s => obs.observe(s));
}

// ── Submit ─────────────────────────────────────────────────────────────────

async function handleSubmit(e) {
  e.preventDefault();
  if (!validateAll()) return;

  setLoading(true);
  const data = collectFormData();

  try {
    await sendData(data);
    setLoading(false);
    showModal('successModal');
    e.target.reset();
    resetUIState();
  } catch (err) {
    setLoading(false);
    showToast('Submission failed — please try again or contact IT support.');
    console.error(err);
  }
}

function validateAll() {
  let ok = true;

  ['employeeName', 'role'].forEach(id => {
    if (!validateTextField(document.getElementById(id))) ok = false;
  });

  const swChecked = document.querySelectorAll('input[name="software"]:checked').length;
  const swErr = document.getElementById('software-error');
  if (swChecked === 0) { if (swErr) swErr.classList.remove('hidden'); ok = false; }
  else { if (swErr) swErr.classList.add('hidden'); }

  // Primary & Secondary project names required
  ['currentProject', 'futureProject'].forEach(group => {
    const chips = document.getElementById(`${group}Chips`)?.querySelectorAll('span').length || 0;
    const err   = document.getElementById(`${group}-error`);
    if (chips === 0) { if (err) err.classList.remove('hidden'); ok = false; }
    else             { if (err) err.classList.add('hidden'); }
  });

  const hwSel = document.querySelector('input[name="hardwareHandles"]:checked');
  const hwErr = document.getElementById('hardwareHandles-error');
  if (!hwSel) { if (hwErr) hwErr.classList.remove('hidden'); ok = false; }
  else { if (hwErr) hwErr.classList.add('hidden'); }

  if (!ok) {
    const firstErr = document.querySelector('.form-input.error, .error-msg:not(.hidden)');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return ok;
}

function collectFormData() {
  const ts = new Date().toLocaleString('en-IN', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });

  const sw = [...document.querySelectorAll('input[name="software"]:checked')].map(cb => {
    if (cb.value === 'Other') {
      const v = document.getElementById('softwareOtherText')?.value?.trim();
      return v ? `Other: ${v}` : 'Other';
    }
    return cb.value;
  });

  const pt = [...document.querySelectorAll('input[name="projectType"]:checked')].map(cb => {
    if (cb.value === 'Others') {
      const v = document.getElementById('projectTypeOtherText')?.value?.trim();
      return v ? `Others: ${v}` : 'Others';
    }
    return cb.value;
  });

  const hwIssues = [...document.querySelectorAll('input[name="hwIssue"]:checked')].map(cb => cb.value);
  const hwOther  = document.getElementById('hardwareIssueOther')?.value?.trim();
  if (hwOther) hwIssues.push(`Other: ${hwOther}`);

  return {
    timestamp:       ts,
    employeeName:    document.getElementById('employeeName').value.trim(),
    role:            document.getElementById('role').value.trim(),
    software:        sw.join(', '),
    projectTypes:    pt.join(', '),
    currentProject:  getChips('currentProject'),
    futureProjects:  getChips('futureProject'),
    hardwareHandles: document.querySelector('input[name="hardwareHandles"]:checked')?.value || '',
    hardwareIssues:  hwIssues.join(', '),
    additionalNotes: document.getElementById('additionalNotes').value.trim()
  };
}

async function sendData(data) {
  if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    // Demo mode — simulate a 1.2 s network delay
    await new Promise(r => setTimeout(r, 1200));
    console.log('[Demo] Form data:', data);
    return;
  }
  await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    mode: 'no-cors'
    // no Content-Type header — 'application/json' is blocked in no-cors mode
    // Apps Script reads e.postData.contents regardless of content type
  });
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function setLoading(on) {
  const btn     = document.getElementById('submitBtn');
  const spinner = document.getElementById('submitSpinner');
  const icon    = document.getElementById('submitIcon');
  const text    = document.getElementById('submitBtnText');

  btn.disabled = on;
  spinner.classList.toggle('hidden', !on);
  icon.classList.toggle('hidden', on);
  text.textContent = on ? 'Submitting…' : 'Submit Audit Form';
}

function showModal(id)  { document.getElementById(id)?.classList.add('show'); }
function hideModal(id)  { document.getElementById(id)?.classList.remove('show'); }
window.hideModal = hideModal;  // called from HTML onclick

function showToast(msg) {
  const toast   = document.getElementById('errorToast');
  const toastMsg = document.getElementById('errorToastMsg');
  if (!toast) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5000);
}

function resetUIState() {
  document.querySelectorAll('.custom-checkbox').forEach(l => l.classList.remove('checked'));
  document.querySelectorAll('.custom-radio').forEach(l => l.classList.remove('selected'));
  document.getElementById('hardwareIssuesSection')?.classList.remove('show');
  document.getElementById('softwareOtherContainer')?.classList.remove('show');
  document.getElementById('projectTypeOtherContainer')?.classList.remove('show');
  document.getElementById('currentProjectChips')?.replaceChildren();
  document.getElementById('futureProjectChips')?.replaceChildren();
  const counter = document.getElementById('notesCounter');
  if (counter) { counter.textContent = '0 / 1000'; counter.style.color = '#475569'; }
}
