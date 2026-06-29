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

// From src/lib/semesters.ts SEMESTER_SUBJECTS
const SEMESTER_SUBJECTS = {
  1: ['German', 'French', 'English', 'Math', 'WR', 'FrW', 'GuP'],
  2: ['German', 'French', 'English', 'Math', 'WR', 'FrW', 'GuP'],
  3: ['German', 'French', 'English', 'Math', 'WR', 'FrW', 'GuP', 'TuU', 'IDAF', 'PrWr'],
  4: ['German', 'French', 'English', 'Math', 'WR', 'FrW', 'GuP', 'TuU', 'IDAF', 'PrWr'],
  5: ['German', 'French', 'English', 'Math', 'WR', 'FrW', 'TuU'],
  6: ['German', 'French', 'English', 'Math', 'WR', 'FrW', 'TuU', 'IDPA'],
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

  // Semester label: lives in the grid header bar above the outer grid
  let semesterLabel = null;
  const headerBar = document.querySelector('.gb-grid-header, .functions-header');
  if (headerBar) {
    const text = headerBar.textContent.replace(/[◄►◀▶]/g, '').trim();
    if (/semester/i.test(text) && text.length < 80) semesterLabel = text;
  }
  if (!semesterLabel) {
    // Fallback: scan all text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent.trim();
      if (/semester/i.test(t) && t.length > 5 && t.length < 80) {
        semesterLabel = t.replace(/[◄►◀▶]/g, '').trim();
        break;
      }
    }
  }

  const subjects = [];

  // Each subject is a k-master-row; its grades live in the immediately following k-detail-row.
  const masterRows = document.querySelectorAll('tr.k-master-row');

  for (const masterRow of masterRows) {
    const subjectRaw = cellText(masterRow, 'courseName');
    if (!subjectRaw) continue;

    const detailRow = masterRow.nextElementSibling;
    if (!detailRow || !detailRow.classList.contains('k-detail-row')) continue;

    const grades  = [];
    const bonuses = [];

    // Grade rows are tr[data-uid] inside the nested grid within the detail row
    const gradeRows = detailRow.querySelectorAll('tr[data-uid]');

    for (const row of gradeRows) {
      const title     = cellText(row, 'title');
      const valueStr  = cellText(row, 'value');
      const dateStr   = cellText(row, 'date');
      const weightStr = cellText(row, 'gradeWeight');

      const isoDate  = parseDate(dateStr);
      const weightN  = parseNum(weightStr);
      const hasDate  = isoDate !== null;
      const hasWeight = weightStr !== '' && !isNaN(weightN);

      if (hasDate && hasWeight) {
        const value = parseNum(valueStr);
        if (!isNaN(value) && value >= 1 && value <= 6) {
          grades.push({ title, value, date: isoDate, weight: weightN });
        }
      } else if (!hasDate && !hasWeight && /bonus|malus/i.test(title)) {
        const value = parseNum(valueStr);
        if (!isNaN(value)) bonuses.push({ title, value });
      }
      // Rows without date+weight and no Bonus/Malus (Schnitt etc.) are skipped
    }

    if (grades.length > 0 || bonuses.length > 0) {
      subjects.push({ subjectRaw, grades, bonuses });
    }
  }

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
  } catch (err) {
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

function makeSubjectCard(subject) {
  const card = document.createElement('div');
  card.className = 'subject-card';

  // ─ Header row ─
  const header = document.createElement('div');
  header.className = 'subject-header';

  const nameCol = document.createElement('div');
  nameCol.className = 'subject-name-col';

  if (subject.gpKey) {
    const keySpan = document.createElement('span');
    keySpan.className = 'gp-key';
    keySpan.textContent = subject.gpKey;

    const displaySpan = document.createElement('span');
    displaySpan.className = 'gp-display';
    displaySpan.textContent = KSH_SUBJECT_NAMES[subject.gpKey] || '';

    nameCol.appendChild(keySpan);
    nameCol.appendChild(displaySpan);

    if (subject.sourceNames.length > 1) {
      const note = document.createElement('span');
      note.className = 'merged-note';
      note.textContent = `merged: ${subject.sourceNames.join(', ')}`;
      nameCol.appendChild(note);
    }
  } else {
    // No auto-match — show raw name + manual dropdown
    const rawSpan = document.createElement('span');
    rawSpan.className = 'raw-name';
    rawSpan.textContent = subject.subjectRaw;
    rawSpan.title = subject.subjectRaw;
    nameCol.appendChild(rawSpan);

    const sel = document.createElement('select');
    sel.className = 'subject-select';
    const blankOpt = document.createElement('option');
    blankOpt.value = '';
    blankOpt.textContent = '— choose subject —';
    sel.appendChild(blankOpt);
    for (const [k, v] of Object.entries(KSH_SUBJECT_NAMES)) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = `${k} – ${v}`;
      sel.appendChild(opt);
    }
    sel.addEventListener('change', e => {
      subject.gpKey = e.target.value || null;
      updateImportButtons();
    });
    nameCol.appendChild(sel);
  }

  // Import button for this subject
  const btn = document.createElement('button');
  btn.className = 'btn-import';
  const gradeCount = subject.grades.length;
  const hasBonus   = subject.bonuses.length > 0;
  btn.textContent  = `Import ${gradeCount}${hasBonus ? '+adj' : ''}`;
  btn.disabled     = true;
  btn.addEventListener('click', () => importSubject(subject, btn));
  subject._btn = btn; // keep reference for status updates

  header.appendChild(nameCol);
  header.appendChild(btn);
  card.appendChild(header);

  // ─ Grades list ─
  if (subject.grades.length > 0 || subject.bonuses.length > 0) {
    const list = document.createElement('div');
    list.className = 'grades-list';

    for (const g of subject.grades) {
      const row = document.createElement('div');
      row.className = 'grade-row';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'grade-title';
      titleSpan.title = g.title;
      titleSpan.textContent = g.title || '—';
      const valueSpan = document.createElement('span');
      valueSpan.className = 'grade-value';
      valueSpan.textContent = g.value;
      const weightSpan = document.createElement('span');
      weightSpan.className = 'grade-weight';
      weightSpan.textContent = `×${g.weight}`;
      const dateSpan = document.createElement('span');
      dateSpan.className = 'grade-date';
      dateSpan.textContent = g.date;
      row.append(titleSpan, valueSpan, weightSpan, dateSpan);
      list.appendChild(row);
    }

    for (const b of subject.bonuses) {
      const row = document.createElement('div');
      row.className = 'grade-row bonus-row';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'grade-title';
      titleSpan.title = b.title;
      titleSpan.textContent = b.title;
      const valueSpan = document.createElement('span');
      valueSpan.className = 'grade-value';
      valueSpan.textContent = `${b.value >= 0 ? '+' : ''}${b.value}`;
      const weightSpan = document.createElement('span');
      weightSpan.className = 'grade-weight';
      weightSpan.textContent = 'adj';
      const dateSpan = document.createElement('span');
      dateSpan.className = 'grade-date';
      row.append(titleSpan, valueSpan, weightSpan, dateSpan);
      list.appendChild(row);
    }

    card.appendChild(list);
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

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Import ───────────────────────────────────────────────────────────────────

async function importSubject(subject, btn) {
  if (!selectedSemester || !subject.gpKey) return;

  const sem = parseInt(selectedSemester, 10);
  btn.disabled = true;
  btn.textContent = '…';

  try {
    for (const grade of subject.grades) {
      const res = await fetch(`${GP_BASE}/api/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          value:       grade.value,
          weight:      grade.weight,
          description: grade.title,
          date:        grade.date,
          semester:    sem,
          subject:     subject.gpKey,
          school:      'KSH',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
    }

    // Import bonus/malus as an adjustment (summed)
    if (subject.bonuses.length > 0) {
      const totalAdj = subject.bonuses.reduce((sum, b) => sum + b.value, 0);
      if (totalAdj !== 0) {
        const res = await fetch(`${GP_BASE}/api/adjustments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            value:   totalAdj,
            semester: sem,
            subject: subject.gpKey,
            school:  'KSH',
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Adjustment failed: HTTP ${res.status}`);
        }
      }
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
