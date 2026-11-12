'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const GP_BASE = 'https://gradepoints.mendolag.ch';

// Inverted from src/lib/semesters.ts KSH_SUBJECT_NAMES
const SUBJECT_MAP = {
  'Deutsch':                          'German',
  'Französisch':                      'French',
  'Englisch':                         'English',
  'Mathematik':                       'Math',
  'Wirtschaft und Recht':             'WR',
  'Finanz- und Rechnungswesen':       'FrW',
  'Finanz und Rechnungswesen':        'FrW',
  'Geschichte und Politik':           'GuP',
  'Technik und Umwelt':               'TuU',
  'Interdisziplinäres Arbeiten':      'IDAF',
  'Interdisziplinäre Projektarbeit':  'IDPA',
  'Projekt Wirtschaft':               'PrWr',
};

// Display names for GradePoints subject keys (from KSH_SUBJECT_NAMES)
const KSH_SUBJECT_NAMES = {
  German:  'Deutsch',
  French:  'Französisch',
  English: 'Englisch',
  Math:    'Mathematik',
  WR:      'Wirtschaft und Recht',
  FrW:     'Finanz und Rechnungswesen',
  GuP:     'Geschichte und Politik',
  TuU:     'Technik und Umwelt',
  IDAF:    'Interdisziplinäres Arbeiten in den Fächern',
  IDPA:    'Interdisziplinäre Projektarbeit',
  PrWr:    'Projekt Wirtschaft',
};

// ── DOM scraper (injected into school page via executeScript) ─────────────────
// Must be self-contained — no references to any variable outside this function.
// Targets the Kendo UI TreeGrid used by intranet.tam.ch/ksh/gradebook.

function scrapePageGrades() {
  function parseDate(str) {
    const m = (str || '').trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
  }

  function parseNum(str) {
    return parseFloat((str || '').toString().replace(',', '.'));
  }

  function cellText(row, field) {
    const el = row.querySelector(`[data-field="${field}"]`);
    return el ? el.textContent.trim() : '';
  }

  const stripArrows = (t) => t.replace(/[◄►◀▶]/g, '').trim();

  // Semester label: lives in the grid header bar above the outer grid
  function findSemesterLabel() {
    const headerBar = document.querySelector('.gb-grid-header, .functions-header');
    if (headerBar) {
      const text = stripArrows(headerBar.textContent);
      if (/semester/i.test(text) && text.length < 80) return text;
    }
    // Fallback: scan all text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent.trim();
      if (/semester/i.test(t) && t.length > 5 && t.length < 80) return stripArrows(t);
    }
    return null;
  }

  // Classifies one grade row: a dated, weighted grade, a Bonus/Malus line, or nothing
  // (Schnitt etc. rows without date+weight are skipped).
  function parseGradeRow(row) {
    const title     = cellText(row, 'title');
    const value     = parseNum(cellText(row, 'value'));
    const weightStr = cellText(row, 'gradeWeight');
    const isoDate   = parseDate(cellText(row, 'date'));
    const weightN   = parseNum(weightStr);
    const hasDate   = isoDate !== null;
    const hasWeight = weightStr !== '' && !isNaN(weightN);

    if (hasDate && hasWeight) {
      return !isNaN(value) && value >= 1 && value <= 6
        ? { grade: { title, value, date: isoDate, weight: weightN } }
        : null;
    }
    if (!hasDate && !hasWeight && /bonus|malus/i.test(title) && !isNaN(value)) {
      return { bonus: { title, value } };
    }
    return null;
  }

  // Each subject is a k-master-row; its grades live in the immediately following k-detail-row.
  function parseSubject(masterRow) {
    const subjectRaw = cellText(masterRow, 'courseName');
    const detailRow = masterRow.nextElementSibling;
    if (!subjectRaw || !detailRow || !detailRow.classList.contains('k-detail-row')) return null;

    // Grade rows are tr[data-uid] inside the nested grid within the detail row
    const parsed = Array.from(detailRow.querySelectorAll('tr[data-uid]'), parseGradeRow).filter(Boolean);
    const grades  = parsed.filter(r => r.grade).map(r => r.grade);
    const bonuses = parsed.filter(r => r.bonus).map(r => r.bonus);
    return grades.length > 0 || bonuses.length > 0 ? { subjectRaw, grades, bonuses } : null;
  }

  const semesterLabel = findSemesterLabel();
  const masterRows = document.querySelectorAll('tr.k-master-row');
  const subjects = Array.from(masterRows, parseSubject).filter(Boolean);

  if (subjects.length === 0) {
    return {
      semesterLabel,
      subjects: [],
      error: masterRows.length === 0
        ? 'No subject rows found. Make sure you are on the Notenbuch page.'
        : 'Subjects found but no grades detected. Try expanding all subjects first.',
    };
  }

  return { semesterLabel, subjects };
}

// ── Subject resolution ───────────────────────────────────────────────────────

function resolveSubject(raw) {
  // Any subject whose name starts with "IDAF" maps to "IDAF"
  if (/^idaf/i.test(raw)) return 'IDAF';
  // Match by prefix against SUBJECT_MAP keys (longest match wins)
  const keys = Object.keys(SUBJECT_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (raw.toLowerCase().startsWith(key.toLowerCase())) return SUBJECT_MAP[key];
  }
  return null;
}

// ── State ────────────────────────────────────────────────────────────────────

let processedSubjects = [];
let selectedSemester  = null;

// ── UI helpers ───────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

function showState(name) {
  document.querySelectorAll('[data-state]').forEach(el => { el.hidden = true; });
  const el = document.querySelector(`[data-state="${name}"]`);
  if (el) el.hidden = false;
}

function setLoading(msg) {
  $('loading-msg').textContent = msg || 'Loading…';
  showState('loading');
}

function showError(msg) {
  $('error-msg').textContent = msg;
  showState('error');
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  setLoading('Checking connection…');

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    showError('Could not read the current tab.');
    return;
  }

  if (!tab.url || !tab.url.includes('intranet.tam.ch')) {
    showState('wrong-page');
    return;
  }

  // Check GradePoints session
  try {
    const res = await fetch(`${GP_BASE}/api/grades?semester=1`, {
      credentials: 'include',
    });
    if (res.status === 401) {
      showState('not-logged-in');
      return;
    }
  } catch {
    // Network error — still allow capture attempt; import will fail with a clear message
  }

  showState('ready');
}

// ── Capture ──────────────────────────────────────────────────────────────────

async function captureGrades() {
  setLoading('Reading grades from page…');

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    showError('Could not access the current tab.');
    return;
  }

  let result;
  try {
    const [injectionResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapePageGrades,
    });
    result = injectionResult?.result;
  } catch {
    showError('Could not read the page. Make sure you are on the Notenbuch page and try again.');
    return;
  }

  if (!result || result.error) {
    showError(result?.error || 'Failed to find grade data on this page.');
    return;
  }

  if (!result.subjects || result.subjects.length === 0) {
    showError('No grades found. Make sure at least one subject is expanded on the page.');
    return;
  }

  buildPreview(result);
}

// ── Build preview ────────────────────────────────────────────────────────────

function buildPreview(data) {
  processedSubjects = [];

  // Show school semester label
  if (data.semesterLabel) {
    $('semester-label').textContent = data.semesterLabel;
    $('semester-label-row').hidden = false;
  } else {
    $('semester-label-row').hidden = true;
  }

  // Merge subjects that resolve to the same GradePoints key (e.g. IDAF TuU + IDAF WR → IDAF)
  const keyMap = new Map();

  for (const s of data.subjects) {
    const gpKey   = resolveSubject(s.subjectRaw);
    const mapKey  = gpKey || s.subjectRaw;

    if (keyMap.has(mapKey)) {
      const existing = keyMap.get(mapKey);
      existing.grades.push(...s.grades);
      existing.bonuses.push(...s.bonuses);
      existing.sourceNames.push(s.subjectRaw);
    } else {
      const entry = {
        subjectRaw:  s.subjectRaw,
        sourceNames: [s.subjectRaw],
        gpKey,
        grades:  [...s.grades],
        bonuses: [...s.bonuses],
        imported: false,
      };
      keyMap.set(mapKey, entry);
      processedSubjects.push(entry);
    }
  }

  renderSubjectCards();
  updateImportButtons();
  showState('preview');
}

// ── Render ───────────────────────────────────────────────────────────────────

function renderSubjectCards() {
  const container = $('subjects-list');
  container.innerHTML = '';

  for (const subject of processedSubjects) {
    container.appendChild(makeSubjectCard(subject));
  }
}

// Creates an element with an optional class and text content.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function subjectSelect(subject) {
  const sel = el('select', 'subject-select');
  const blankOpt = el('option', '', '— choose subject —');
  blankOpt.value = '';
  sel.appendChild(blankOpt);
  for (const [k, v] of Object.entries(KSH_SUBJECT_NAMES)) {
    const opt = el('option', '', `${k} – ${v}`);
    opt.value = k;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', e => {
    subject.gpKey = e.target.value || null;
    updateImportButtons();
  });
  return sel;
}

function nameColumn(subject) {
  const nameCol = el('div', 'subject-name-col');

  if (!subject.gpKey) {
    // No auto-match — show raw name + manual dropdown
    const rawSpan = el('span', 'raw-name', subject.subjectRaw);
    rawSpan.title = subject.subjectRaw;
    nameCol.append(rawSpan, subjectSelect(subject));
    return nameCol;
  }

  nameCol.append(
    el('span', 'gp-key', subject.gpKey),
    el('span', 'gp-display', KSH_SUBJECT_NAMES[subject.gpKey] || ''),
  );
  if (subject.sourceNames.length > 1) {
    nameCol.appendChild(el('span', 'merged-note', `merged: ${subject.sourceNames.join(', ')}`));
  }
  return nameCol;
}

function importButton(subject) {
  const hasBonus = subject.bonuses.length > 0;
  const btn = el('button', 'btn-import', `Import ${subject.grades.length}${hasBonus ? '+adj' : ''}`);
  btn.disabled = true;
  btn.addEventListener('click', () => importSubject(subject, btn));
  subject._btn = btn; // keep reference for status updates
  return btn;
}

function gradeRow(rowClass, title, value, weight, date) {
  const row = el('div', rowClass);
  const titleSpan = el('span', 'grade-title', title || '—');
  titleSpan.title = title;
  row.append(titleSpan, el('span', 'grade-value', value), el('span', 'grade-weight', weight), el('span', 'grade-date', date));
  return row;
}

function gradesList(subject) {
  const list = el('div', 'grades-list');
  for (const g of subject.grades) {
    list.appendChild(gradeRow('grade-row', g.title, g.value, `×${g.weight}`, g.date));
  }
  for (const b of subject.bonuses) {
    list.appendChild(gradeRow('grade-row bonus-row', b.title, `${b.value >= 0 ? '+' : ''}${b.value}`, 'adj'));
  }
  return list;
}

function makeSubjectCard(subject) {
  const card = el('div', 'subject-card');
  const header = el('div', 'subject-header');
  header.append(nameColumn(subject), importButton(subject));
  card.appendChild(header);

  if (subject.grades.length > 0 || subject.bonuses.length > 0) {
    card.appendChild(gradesList(subject));
  }
  return card;
}

function updateImportButtons() {
  const anyPending = processedSubjects.some(s => s.gpKey && !s.imported);
  $('import-all-btn').disabled = !selectedSemester || !anyPending;

  for (const subject of processedSubjects) {
    if (!subject._btn) continue;
    subject._btn.disabled = !selectedSemester || !subject.gpKey || subject.imported;
  }
}

async function importAll() {
  const btn = $('import-all-btn');
  btn.disabled = true;

  const pending = processedSubjects.filter(s => s.gpKey && !s.imported);
  for (let i = 0; i < pending.length; i++) {
    btn.textContent = `Importing ${i + 1} / ${pending.length}…`;
    await importSubject(pending[i], pending[i]._btn);
  }

  btn.textContent = '✓ All imported';
}

// ── Import ───────────────────────────────────────────────────────────────────

async function postWithRetry(url, options, btn) {
  const res = await fetch(url, options);
  if (res.status === 429) {
    const wait = parseInt(res.headers.get('Retry-After') || '60', 10);
    if (btn) btn.textContent = `Rate limited — retrying in ${wait}s…`;
    await new Promise(r => setTimeout(r, wait * 1000));
    return fetch(url, options);
  }
  return res;
}

// POSTs JSON to a GradePoints API path; throws with the API's error message on failure.
async function postToGp(path, payload, btn, errPrefix = '') {
  const res = await postWithRetry(`${GP_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  }, btn);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `${errPrefix}HTTP ${res.status}`);
  }
  return res;
}

async function importSubject(subject, btn) {
  if (!selectedSemester || !subject.gpKey) return;

  const sem = parseInt(selectedSemester, 10);
  btn.disabled = true;
  btn.textContent = '…';

  try {
    for (const grade of subject.grades) {
      await postToGp('/api/grades', {
        value:       grade.value,
        weight:      grade.weight,
        description: grade.title,
        date:        grade.date,
        semester:    sem,
        subject:     subject.gpKey,
        school:      'KSH',
      }, btn);
    }

    // Import bonus/malus as an adjustment (summed)
    const totalAdj = subject.bonuses.reduce((sum, b) => sum + b.value, 0);
    if (totalAdj !== 0) {
      await postToGp('/api/adjustments', {
        value:    totalAdj,
        semester: sem,
        subject:  subject.gpKey,
        school:   'KSH',
      }, btn, 'Adjustment failed: ');
    }

    subject.imported = true;
    btn.textContent = '✓ Done';
    btn.className = 'btn-import done';

    // Show "Open GradePoints" once every subject with a resolved key is imported
    const importable = processedSubjects.filter(s => s.gpKey);
    if (importable.length > 0 && importable.every(s => s.imported)) {
      $('all-done-bar').hidden = false;
    }

  } catch (err) {
    btn.textContent = '✗ Error';
    btn.className = 'btn-import error-state';
    btn.disabled = false;
    btn.title = err.message;
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  init();

  $('capture-btn').addEventListener('click', captureGrades);
  $('import-all-btn').addEventListener('click', importAll);

  $('semester-select').addEventListener('change', e => {
    selectedSemester = e.target.value || null;
    updateImportButtons();
  });

  $('open-gp-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${GP_BASE}/dashboard` });
  });

  $('retry-btn').addEventListener('click', () => init());
});
