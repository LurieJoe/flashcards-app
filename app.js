'use strict';

/* App version — keep in sync with the service-worker CACHE name.
   Shown at the bottom of Settings so you can confirm which build is running. */
const APP_VERSION = 'v42';

/* ============================================================
   Storage model (multi-deck)
   localStorage["flashcards.data.v2"] = {
     decks: [{ id, name, cards: [{q,a}] }],
     activeId: "<deckId>"
   }
   Legacy v1 (single list under flashcards.cards.v1) is migrated.
============================================================ */
const LEGACY_KEY = 'flashcards.cards.v1';

// Built-in sample decks, seeded once so new (and existing) users have something to try.
const SAMPLE_DECKS = [
  {
    name: 'SAMPLE-Capitals',
    cards: [
      { q: 'What is the capital of France?', a: 'Paris' },
      { q: 'What is the capital of Japan?', a: 'Tokyo' },
      { q: 'What is the capital of Canada?', a: 'Ottawa' },
      { q: 'What is the capital of Australia?', a: 'Canberra' },
      { q: 'What is the capital of Brazil?', a: 'Brasília' },
    ],
  },
  {
    name: 'SAMPLE-Math',
    cards: [
      { q: 'What is 7 × 8?', a: '56' },
      { q: 'What is 12 + 15?', a: '27' },
      { q: 'What is 81 ÷ 9?', a: '9' },
      { q: 'What is 15 − 6?', a: '9' },
      { q: 'What is the square root of 144?', a: '12' },
    ],
  },
];

let state = { decks: [], activeId: null };
let studyDeckIds = [];   // decks chosen in the picker (multi-select)
let studyCards = [];     // flattened cards for the current study session
let reverseMode = false; // when true, show the answer and guess the question
let matchRounds = [];    // conflict-free groups for the matching-pairs game
let matchRoundIndex = 0;
let matchFirstTile = null;
let matchLocked = false;
let matchRoundMatched = 0;
let matchSessionToken = 0;
let studyMode = 'flashcards';
let choiceQuestions = [];
let choiceQuestionIndex = 0;
let choiceScore = 0;
let choiceMissedCards = [];
let choiceSourceCards = [];
let choiceSourceDeck = null;
let choiceCurrentQuestionCards = [];
let choiceAnswered = false;
let editOpenedOnce = false; // default Import tab to "My cards" on first open per session
let order = [];
let pos = 0;

/* ---------- Persistence ---------- */
function uid() { return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/* ---------- Profiles (local, no login) ----------
   Each profile namespaces its own storage under flashcards.p.<id>.<suffix>, so a
   parent can hand the iPad to different kids and each keeps their own decks, theme,
   font size, and settings — all on-device. A registry lists profiles + the active
   one. Legacy (pre-profile) data is migrated into a default profile on first run. */
const PROFILES_KEY = 'flashcards.profiles.v1';
const PROFILE_SUFFIXES = ['data.v2', 'pref.sound', 'pref.timer', 'pref.font', 'theme', 'accent', 'samplesSeeded'];
const LEGACY_GLOBAL = {
  'data.v2': 'flashcards.data.v2',
  'pref.sound': 'flashcards.pref.sound',
  'pref.timer': 'flashcards.pref.timer',
  'pref.font': 'flashcards.pref.font',
  'theme': 'flashcards.theme',
  'accent': 'flashcards.accent',
  'samplesSeeded': 'flashcards.samplesSeeded',
};
const PROFILE_COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#14b8a6'];

let profiles = { profiles: [], activeId: null };

function profileKey(pid, suffix) { return 'flashcards.p.' + pid + '.' + suffix; }
function K(suffix) { return profileKey(profiles.activeId, suffix); }
function saveProfiles() { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); }

function loadProfiles() {
  let p = null;
  try { p = JSON.parse(localStorage.getItem(PROFILES_KEY)); } catch { p = null; }
  if (p && Array.isArray(p.profiles) && p.profiles.length) {
    profiles = p;
  } else {
    // First run with profiles: create a default and migrate any legacy data into it.
    const pid = uid();
    profiles = { profiles: [{ id: pid, name: 'Me', color: PROFILE_COLORS[0] }], activeId: pid };
    for (const suf of PROFILE_SUFFIXES) {
      const legacy = localStorage.getItem(LEGACY_GLOBAL[suf]);
      if (legacy !== null) {
        localStorage.setItem(profileKey(pid, suf), legacy);
        localStorage.removeItem(LEGACY_GLOBAL[suf]);
      }
    }
    saveProfiles();
  }
  if (!profiles.profiles.some(pr => pr.id === profiles.activeId)) {
    profiles.activeId = profiles.profiles[0].id;
  }
}
function activeProfile() { return profiles.profiles.find(p => p.id === profiles.activeId) || profiles.profiles[0]; }
function nextProfileColor() {
  const used = new Set(profiles.profiles.map(p => p.color));
  return PROFILE_COLORS.find(c => !used.has(c)) || PROFILE_COLORS[profiles.profiles.length % PROFILE_COLORS.length];
}
function deleteProfileData(pid) { PROFILE_SUFFIXES.forEach(s => localStorage.removeItem(profileKey(pid, s))); }

function load() {
  try {
    const raw = localStorage.getItem(K('data.v2'));
    if (raw) {
      state = JSON.parse(raw);
    } else {
      const legacy = localStorage.getItem(LEGACY_KEY);
      const cards = legacy ? JSON.parse(legacy) : [];
      state = { decks: [{ id: uid(), name: 'My cards', cards: Array.isArray(cards) ? cards : [] }], activeId: null };
      state.activeId = state.decks[0].id;
    }
  } catch {
    state = { decks: [], activeId: null };
  }
  if (!Array.isArray(state.decks)) state.decks = [];
  if (state.decks.length === 0) {
    const d = { id: uid(), name: 'My cards', cards: [] };
    state.decks.push(d);
    state.activeId = d.id;
  }
  if (!state.decks.some(d => d.id === state.activeId)) state.activeId = state.decks[0].id;
}

function save() { localStorage.setItem(K('data.v2'), JSON.stringify(state)); }
function activeDeck() { return state.decks.find(d => d.id === state.activeId) || state.decks[0]; }

// Seed the built-in sample decks a single time (skips any that already exist by name).
function ensureSamples() {
  if (localStorage.getItem(K('samplesSeeded')) === '1') return;
  const existing = new Set(state.decks.map(d => d.name.toLowerCase()));
  for (const s of SAMPLE_DECKS) {
    if (!existing.has(s.name.toLowerCase())) {
      state.decks.push({ id: uid(), name: s.name, cards: s.cards.map(c => ({ q: c.q, a: c.a })) });
    }
  }
  localStorage.setItem(K('samplesSeeded'), '1');
}

function uniqueName(base) {
  let name = base, n = 2;
  const names = new Set(state.decks.map(d => d.name.toLowerCase()));
  while (names.has(name.toLowerCase())) { name = `${base} (${n++})`; }
  return name;
}

/* ============================================================
   Text / CSV parsing
============================================================ */
function parseInput(text) {
  const result = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const pair = splitPair(line);
    if (pair) result.push(pair);
  }
  return result;
}

function splitPair(line) {
  let sep = -1, sepLen = 1;
  const pipe = line.indexOf('|');
  const tab = line.indexOf('\t');
  const dash = line.indexOf(' - ');
  if (pipe !== -1) { sep = pipe; sepLen = 1; }
  else if (tab !== -1) { sep = tab; sepLen = 1; }
  else if (dash !== -1) { sep = dash; sepLen = 3; }
  else { return splitCsv(line); }
  const q = line.slice(0, sep).trim();
  const a = line.slice(sep + sepLen).trim();
  return q && a ? { q, a } : null;
}

function splitCsv(line) {
  const m = line.match(/^\s*(?:"((?:[^"]|"")*)"|([^,]*))\s*,\s*(?:"((?:[^"]|"")*)"|(.*))\s*$/);
  if (!m) return null;
  const q = (m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2]).trim();
  const a = (m[3] !== undefined ? m[3].replace(/""/g, '"') : m[4]).trim();
  return q && a ? { q, a } : null;
}

function normLabel(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').replace(/[.:]+$/, '').trim();
}
// Question-side header labels (e.g. "Word or name", "Term", "Vocabulary", "Front").
const Q_LABELS = /^(q|questions?|words?|word or .+|phrases?|terms?|vocabulary|vocab|front|prompts?|names?)$/;
// Answer-side header labels (e.g. "One-sentence definition", "Definition", "Meaning").
const A_LABELS = /^(a|answers?|back|meanings?|descriptions?|(one[- ](word|sentence|line|phrase) )?definitions?)$/;
// "Strong" answer labels — used on the first row of a table without needing the
// question cell to also look like a header. Excludes the bare "a" to stay safe.
const A_STRONG = /^(answers?|back|meanings?|descriptions?|(one[- ](word|sentence|line|phrase) )?definitions?)$/;
// Definitional header answers (e.g. "One-sentence definition", "Definition", "Meaning").
// Safe to treat as a header at ANY row position when the same value repeats — real
// answers are unique sentences, never an identical definitional label.
const A_DEFN = /^(meanings?|descriptions?|(one[- ](word|sentence|line|phrase) )?definitions?)$/;

function isHeaderQuestionLabel(q) { return Q_LABELS.test(normLabel(q)); }
function isHeaderAnswerLabel(a) { return A_LABELS.test(normLabel(a)); }
function isStrongHeaderAnswer(a) { return A_STRONG.test(normLabel(a)); }
function isDefnHeaderAnswer(a) { return A_DEFN.test(normLabel(a)); }

// A pair that looks like a header on BOTH sides (position-independent, so safe to use
// everywhere — text/JSON import and the existing-deck cleanup).
function isHeaderPair(p) {
  return isHeaderQuestionLabel(p.q) && isHeaderAnswerLabel(p.a);
}

// Remove any column-header rows (e.g. "Word or phrase" | "One-sentence definition")
// that slipped into existing decks from older imports. Returns how many were removed.
function cleanupHeaderCards() {
  let removed = 0;
  for (const d of state.decks) {
    if (!Array.isArray(d.cards)) continue;
    const answerCount = {};
    for (const c of d.cards) {
      const k = normLabel(c.a);
      answerCount[k] = (answerCount[k] || 0) + 1;
    }
    const before = d.cards.length;
    d.cards = d.cards.filter(c =>
      !(isHeaderPair(c) || (isDefnHeaderAnswer(c.a) && answerCount[normLabel(c.a)] >= 2)));
    removed += before - d.cards.length;
  }
  return removed;
}

function cardsToText(cards) { return cards.map(c => `${c.q} | ${c.a}`).join('\n'); }

function cardsFromLines(lines) {
  lines = lines.filter(l => l && l.trim()).map(l => l.trim());
  if (lines.length === 0) return { cards: [], method: 'empty' };

  const labelQ = /^(q|question)\s*[:.\)\-]/i;
  const labelA = /^(a|answer)\s*[:.\)\-]/i;
  if (lines.some(l => labelQ.test(l)) && lines.some(l => labelA.test(l))) {
    return { cards: parseLabeled(lines, labelQ, labelA), method: 'labeled Q/A' };
  }

  const sepLines = lines.filter(l => /\||\t| - /.test(l));
  if (sepLines.length >= Math.max(1, Math.ceil(lines.length * 0.5))) {
    const cards = [];
    for (const l of sepLines) { const p = splitPair(l); if (p && !isHeaderPair(p)) cards.push(p); }
    return { cards, method: 'separator' };
  }

  const cards = [];
  for (let i = 0; i + 1 < lines.length; i += 2) cards.push({ q: lines[i], a: lines[i + 1] });
  return { cards, method: 'alternating lines' };
}

function parseLabeled(lines, labelQ, labelA) {
  const out = [];
  let q = null, a = null;
  const stripQ = l => l.replace(/^(q|question)\s*[:.\)\-]\s*/i, '').trim();
  const stripA = l => l.replace(/^(a|answer)\s*[:.\)\-]\s*/i, '').trim();
  const flush = () => { if (q && a) out.push({ q, a }); };
  for (const l of lines) {
    if (labelQ.test(l)) { flush(); q = stripQ(l); a = null; }
    else if (labelA.test(l)) { a = (a ? a + ' ' : '') + stripA(l); }
    else if (a !== null) a += ' ' + l;
    else if (q !== null) q += ' ' + l;
  }
  flush();
  return out;
}

/* ============================================================
   .docx importer (offline, no libraries)
============================================================ */
async function importDocx(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const xml = await extractDocumentXml(buf);
  const { tableCards, lines } = extractFromDocxXml(xml);
  if (tableCards.length) return { cards: tableCards, method: 'table' };
  return cardsFromLines(lines);
}

async function extractDocumentXml(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('Not a valid .docx (ZIP directory not found).');
  const cdOffset = view.getUint32(eocd + 16, true);
  const cdCount = view.getUint16(eocd + 10, true);
  let p = cdOffset, target = null;
  const dec = new TextDecoder();
  for (let n = 0; n < cdCount; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOff = view.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nameLen));
    if (name === 'word/document.xml') target = { method, compSize, localOff };
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (!target) throw new Error('Could not find document text inside the .docx.');

  const lo = target.localOff;
  if (view.getUint32(lo, true) !== 0x04034b50) throw new Error('Corrupt .docx (bad local header).');
  const nameLen = view.getUint16(lo + 26, true);
  const extraLen = view.getUint16(lo + 28, true);
  const dataStart = lo + 30 + nameLen + extraLen;
  const data = buf.subarray(dataStart, dataStart + target.compSize);

  if (target.method === 0) return new TextDecoder('utf-8').decode(data);
  if (target.method !== 8) throw new Error('Unsupported .docx compression.');
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser can’t unzip .docx. Update iOS/Safari, or paste the text instead.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Response(data).body.pipeThrough(ds);
  const out = new Uint8Array(await new Response(stream).arrayBuffer());
  return new TextDecoder('utf-8').decode(out);
}

function nodeText(node) {
  let s = '';
  const walk = (n) => {
    for (const c of n.childNodes) {
      if (c.nodeType !== 1) continue;
      const t = c.tagName;
      if (t === 'w:t') s += c.textContent;
      else if (t === 'w:tab') s += '\t';
      else if (t === 'w:br' || t === 'w:cr') s += '\n';
      else walk(c);
    }
  };
  walk(node);
  return s;
}

function extractFromDocxXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Could not read the document XML.');
  const body = doc.getElementsByTagName('w:body')[0] || doc.documentElement;
  const tables = [];   // one entry per table: array of {q,a} rows
  const lines = [];

  const walkBody = (parent) => {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType !== 1) continue;
      if (node.tagName === 'w:tbl') {
        const rows = [];
        for (const row of Array.from(node.getElementsByTagName('w:tr'))) {
          const cells = Array.from(row.getElementsByTagName('w:tc'));
          if (cells.length >= 2) {
            const q = nodeText(cells[0]).replace(/\s+/g, ' ').trim();
            const a = nodeText(cells[1]).replace(/\s+/g, ' ').trim();
            if (q && a) rows.push({ q, a });
          }
        }
        if (rows.length) tables.push(rows);
      } else if (node.tagName === 'w:p') {
        const txt = nodeText(node).replace(/[ \t]+/g, ' ').trim();
        if (txt) lines.push(txt);
      }
    }
  };
  walkBody(body);

  // Structural header detection. Real answers are unique sentences; repeated column
  // headers show up as the same answer value on several rows (e.g. every section starts
  // with "One-sentence definition"). Count identical answers across the whole document.
  const answerCount = {};
  for (const rows of tables) {
    for (const r of rows) {
      const k = normLabel(r.a);
      answerCount[k] = (answerCount[k] || 0) + 1;
    }
  }

  const tableCards = [];
  for (const rows of tables) {
    rows.forEach((row, idx) => {
      const isFirst = idx === 0;
      const header =
        isHeaderPair(row) ||                                              // both cells look like headers
        (isFirst && isStrongHeaderAnswer(row.a)) ||                       // first row, answer is a header label
        (isDefnHeaderAnswer(row.a) && answerCount[normLabel(row.a)] >= 2); // repeated definitional label, any row
      if (!header) tableCards.push(row);
    });
  }
  return { tableCards, lines };
}

/* ============================================================
   File dispatch
============================================================ */
async function importFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) return importDocx(file);
  if (name.endsWith('.json')) {
    const data = JSON.parse(await file.text());
    let cards = [];
    const arr = Array.isArray(data) ? data : data.cards;
    if (Array.isArray(arr)) {
      cards = arr.map(x => Array.isArray(x) ? { q: String(x[0]), a: String(x[1]) }
                                            : { q: String(x.q ?? x.question ?? ''), a: String(x.a ?? x.answer ?? '') })
                 .filter(c => c.q && c.a);
    }
    return { cards, method: 'json', suggestedName: data.name };
  }
  const text = await file.text();
  const parsed = parseInput(text);
  if (parsed.length) return { cards: parsed.filter(p => !isHeaderPair(p)), method: 'text' };
  return cardsFromLines(text.split(/\r?\n/));
}

function baseName(fileName) { return fileName.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim(); }

/* ============================================================
   Views
============================================================ */
const views = {
  home: document.getElementById('home-view'),
  study: document.getElementById('study-view'),
  edit: document.getElementById('edit-view'),
};
const tabs = document.querySelectorAll('.tab');
const deckSelect = document.getElementById('deck-select');
const status = document.getElementById('edit-status');

function setStatus(msg, ok = true) {
  status.style.color = ok ? '#4ade80' : 'var(--danger)';
  status.textContent = msg;
  if (msg) setTimeout(() => { if (status.textContent === msg) status.textContent = ''; }, 4000);
}

let toastTimer = null;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}

function showView(name) {
  document.getElementById('settings-view').classList.remove('active');
  Object.entries(views).forEach(([k, el]) => el.classList.toggle('active', k === name));
  tabs.forEach(t => t.classList.toggle('active', t.dataset.view === name));
  if (name !== 'study') stopTimer();
  if (name === 'study') openDeckPicker();
  if (name === 'edit') {
    if (!editOpenedOnce) {
      editOpenedOnce = true;
      const myCards = state.decks.find(d => d.name === 'My cards');
      if (myCards) state.activeId = myCards.id;
    }
    renderDeckOptions();
    document.getElementById('bulk-input').value = cardsToText(activeDeck().cards);
    updateCount();
  }
  maybeNavTip(name);
}

tabs.forEach(t => t.addEventListener('click', () => showView(t.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => showView(b.dataset.goto)));

/* ---------- Settings screen ---------- */
function openSettings() {
  stopTimer();
  Object.values(views).forEach(el => el.classList.remove('active'));
  tabs.forEach(t => t.classList.remove('active'));
  document.getElementById('settings-view').classList.add('active');
  window.scrollTo(0, 0);
}
document.getElementById('settings-btn').addEventListener('click', openSettings);
document.getElementById('settings-back').addEventListener('click', () => showView('home'));

/* ---------- Import/Create: deck management ---------- */
function renderDeckOptions() {
  deckSelect.innerHTML = '';
  for (const d of state.decks) {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.name} (${d.cards.length})` + (d.hidden ? ' — hidden' : '');
    if (d.id === state.activeId) opt.selected = true;
    deckSelect.appendChild(opt);
  }
}

deckSelect.addEventListener('change', () => {
  state.activeId = deckSelect.value;
  save();
  document.getElementById('bulk-input').value = cardsToText(activeDeck().cards);
  updateCount();
});

document.getElementById('new-deck-btn').addEventListener('click', () => {
  const name = prompt('Name for the new deck:', uniqueName('New deck'));
  if (!name) return;
  const d = { id: uid(), name: uniqueName(name.trim()), cards: [] };
  state.decks.push(d);
  state.activeId = d.id;
  save();
  renderDeckOptions();
  document.getElementById('bulk-input').value = '';
  updateCount();
});

document.getElementById('rename-deck-btn').addEventListener('click', () => {
  const d = activeDeck();
  const name = prompt('Rename deck:', d.name);
  if (!name || !name.trim()) return;
  d.name = name.trim();
  save();
  renderDeckOptions();
});

document.getElementById('delete-deck-btn').addEventListener('click', () => {
  const d = activeDeck();
  if (!confirm(`Delete deck "${d.name}" and its ${d.cards.length} cards?`)) return;
  state.decks = state.decks.filter(x => x.id !== d.id);
  studyDeckIds = studyDeckIds.filter(id => id !== d.id);
  if (state.decks.length === 0) state.decks.push({ id: uid(), name: 'My cards', cards: [] });
  state.activeId = state.decks[0].id;
  save();
  renderDeckOptions();
  document.getElementById('bulk-input').value = cardsToText(activeDeck().cards);
  updateCount();
});

/* ---------- Study: deck picker (multi-select) ---------- */
const deckPicker = document.getElementById('deck-picker');
const deckListEl = document.getElementById('deck-list');
const studyArea = document.getElementById('study-area');
const matchArea = document.getElementById('match-area');
const choiceArea = document.getElementById('choice-area');
const startModeBtn = document.getElementById('start-mode-btn');
const modeEligibility = document.getElementById('mode-eligibility');

function openDeckPicker() {
  matchSessionToken++;
  studyArea.classList.add('hidden');
  matchArea.classList.add('hidden');
  choiceArea.classList.add('hidden');
  deckPicker.classList.remove('hidden');
  stopTimer();
  timerEl.classList.add('hidden');
  const ss = document.getElementById('search-status');
  if (ss) ss.textContent = '';
  renderDeckList();
}

function setStudyMode(mode) {
  if (!['flashcards', 'matching', 'multiple-choice'].includes(mode)) return;
  studyMode = mode;
  document.querySelectorAll('.study-mode-option').forEach(button => {
    const active = button.dataset.studyMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
  });

  const flashcards = mode === 'flashcards';
  document.getElementById('search-form').classList.toggle('hidden', !flashcards);
  document.getElementById('search-status').classList.toggle('hidden', !flashcards);
  document.getElementById('select-all-btn').classList.toggle('hidden', !flashcards);
  document.getElementById('reverse-row').classList.toggle('hidden', !flashcards);
  document.getElementById('deck-selection-help').textContent = flashcards
    ? 'Select one or more decks. Multiple decks are studied together.'
    : 'Select one deck for this study mode.';

  if (!flashcards) {
    const checked = [...deckListEl.querySelectorAll('input[type=checkbox]:checked')];
    checked.slice(1).forEach(box => { box.checked = false; });
  }
  startModeBtn.textContent = mode === 'flashcards'
    ? 'Start Flashcards'
    : mode === 'matching'
      ? 'Start Matching Pairs'
      : 'Start Multiple Choice';
  updateStudyEligibility();
}

document.querySelectorAll('.study-mode-option').forEach(button =>
  button.addEventListener('click', () => setStudyMode(button.dataset.studyMode)));

function setDeckHidden(id, hidden) {
  const d = state.decks.find(x => x.id === id);
  if (!d) return;
  d.hidden = hidden;
  save();
  renderDeckList();
}

function renderDeckList() {
  const visibleDecks = state.decks.filter(d => !d.hidden);
  const hiddenDecks = state.decks.filter(d => d.hidden);
  const anyVisibleCards = visibleDecks.some(d => d.cards.length > 0);
  const anyCardsAtAll = state.decks.some(d => d.cards.length > 0);

  document.getElementById('picker-empty').classList.toggle('hidden', anyCardsAtAll);
  document.getElementById('picker-controls').classList.toggle('hidden', !anyVisibleCards);
  deckListEl.classList.toggle('hidden', !anyVisibleCards);

  deckListEl.innerHTML = '';
  const preselect = studyDeckIds.length ? studyDeckIds : [state.activeId];
  for (const d of visibleDecks) {
    const flagged = d.cards.filter(c => c.flagged).length;
    const li = document.createElement('li');
    li.className = 'deck-row';

    // Actions revealed behind the row (swipe-left on touch, hover on desktop).
    const actions = document.createElement('div');
    actions.className = 'deck-actions';

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'deck-share-btn';
    shareBtn.textContent = 'Share';
    shareBtn.setAttribute('aria-label', `Share ${d.name}`);
    shareBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); shareDeck(d); });

    const hideBtn = document.createElement('button');
    hideBtn.type = 'button';
    hideBtn.className = 'deck-hide-btn';
    hideBtn.textContent = 'Hide';
    hideBtn.setAttribute('aria-label', `Hide ${d.name} from Study`);
    hideBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setDeckHidden(d.id, true); });

    actions.appendChild(shareBtn);
    actions.appendChild(hideBtn);

    const swipe = document.createElement('div');
    swipe.className = 'deck-swipe';

    const label = document.createElement('label');
    label.className = 'deck-item' + (d.cards.length === 0 ? ' disabled' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = d.id;
    cb.checked = d.cards.length > 0 && preselect.includes(d.id);
    cb.disabled = d.cards.length === 0;

    const text = document.createElement('span');
    text.className = 'deck-item-name';
    text.textContent = d.name;

    const count = document.createElement('span');
    count.className = 'deck-item-count';
    count.textContent = d.cards.length === 0 ? 'empty' : `${d.cards.length}`;

    label.appendChild(cb);
    label.appendChild(text);
    if (flagged > 0) {
      const flag = document.createElement('span');
      flag.className = 'deck-item-flag';
      flag.textContent = `⚑ ${flagged}`;
      label.appendChild(flag);
    }
    label.appendChild(count);
    swipe.appendChild(label);
    li.appendChild(actions);
    li.appendChild(swipe);
    attachSwipeToHide(li, swipe, label, cb);
    deckListEl.appendChild(li);
  }

  renderHiddenDecks(hiddenDecks);
  updateFlaggedTotal();
  setStudyMode(studyMode);
}

// Touch swipe-left reveals the Hide button; tapping a revealed row closes it.
function attachSwipeToHide(row, swipe, label, cb) {
  const OPEN = 176; // px of reveal, matches .deck-actions width (Share + Hide)
  let startX = null, base = 0, moved = false;

  const close = () => { row.classList.remove('revealed'); swipe.style.transform = ''; };
  const open = () => { row.classList.add('revealed'); swipe.style.transform = `translateX(-${OPEN}px)`; };

  swipe.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    base = row.classList.contains('revealed') ? -OPEN : 0;
    moved = false;
  }, { passive: true });

  swipe.addEventListener('touchmove', (e) => {
    if (startX === null) return;
    const dx = e.touches[0].clientX - startX;
    if (Math.abs(dx) > 6) moved = true;
    let t = Math.max(-OPEN, Math.min(0, base + dx));
    swipe.style.transform = `translateX(${t}px)`;
  }, { passive: true });

  swipe.addEventListener('touchend', () => {
    if (startX === null) return;
    const current = new DOMMatrix(getComputedStyle(swipe).transform).m41;
    if (current <= -OPEN / 2) open(); else close();
    startX = null;
  });

  // If revealed, a tap closes instead of toggling the checkbox.
  label.addEventListener('click', (e) => {
    if (row.classList.contains('revealed')) { e.preventDefault(); close(); }
  });
  // Close any other open row when this one is interacted with.
  swipe.addEventListener('touchstart', () => {
    deckListEl.querySelectorAll('.deck-row.revealed').forEach(r => {
      if (r !== row) { r.classList.remove('revealed'); const s = r.querySelector('.deck-swipe'); if (s) s.style.transform = ''; }
    });
  }, { passive: true });
}

function renderHiddenDecks(hiddenDecks) {
  const wrap = document.getElementById('hidden-decks');
  wrap.innerHTML = '';
  if (!hiddenDecks.length) return;

  const details = document.createElement('details');
  details.className = 'hidden-decks-box';
  const summary = document.createElement('summary');
  summary.textContent = `Hidden decks (${hiddenDecks.length})`;
  details.appendChild(summary);

  for (const d of hiddenDecks) {
    const row = document.createElement('div');
    row.className = 'hidden-deck-row';
    const name = document.createElement('span');
    name.className = 'hidden-deck-name';
    name.textContent = `${d.name} (${d.cards.length})`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn small';
    btn.textContent = 'Unhide';
    btn.addEventListener('click', () => setDeckHidden(d.id, false));
    row.appendChild(name);
    row.appendChild(btn);
    details.appendChild(row);
  }
  wrap.appendChild(details);
}

function updateFlaggedTotal() {
  const total = state.decks.filter(d => !d.hidden).reduce((n, d) => n + d.cards.filter(c => c.flagged).length, 0);
  const badge = document.getElementById('flagged-total');
  badge.textContent = total ? `${total}` : '';
  const row = document.getElementById('only-flagged-row');
  const box = document.getElementById('only-flagged');
  if (total === 0) { box.checked = false; row.classList.add('disabled'); box.disabled = true; }
  else { row.classList.remove('disabled'); box.disabled = false; }
}

document.getElementById('select-all-btn').addEventListener('click', () => {
  const boxes = deckListEl.querySelectorAll('input[type=checkbox]:not(:disabled)');
  const allChecked = [...boxes].every(b => b.checked);
  boxes.forEach(b => { b.checked = !allChecked; });
  updateStudyEligibility();
});

deckListEl.addEventListener('change', event => {
  if (studyMode !== 'flashcards' && event.target.matches('input[type=checkbox]') && event.target.checked) {
    deckListEl.querySelectorAll('input[type=checkbox]:checked').forEach(box => {
      if (box !== event.target) box.checked = false;
    });
  }
  updateStudyEligibility();
});
document.getElementById('only-flagged').addEventListener('change', updateStudyEligibility);

startModeBtn.addEventListener('click', () => {
  if (studyMode === 'matching') {
    startMatchGame();
    return;
  }
  if (studyMode === 'multiple-choice') {
    startChoiceGame();
    return;
  }
  const ids = [...deckListEl.querySelectorAll('input[type=checkbox]:checked')].map(b => b.value);
  if (ids.length === 0) { alert('Select at least one deck to study.'); return; }
  const onlyFlagged = document.getElementById('only-flagged').checked;
  startStudy(ids, onlyFlagged);
});

document.getElementById('back-to-decks').addEventListener('click', openDeckPicker);
document.getElementById('match-back-to-decks').addEventListener('click', openDeckPicker);
document.getElementById('choice-back-to-decks').addEventListener('click', openDeckPicker);

// Search every deck's questions AND answers, then study the matches as a custom set.
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const term = document.getElementById('search-input').value.trim();
  const statusEl = document.getElementById('search-status');
  if (!term) { statusEl.textContent = ''; return; }
  const needle = term.toLowerCase();
  const matches = [];
  for (const d of state.decks) {
    if (d.hidden) continue;
    for (const c of d.cards) {
      if (c.q.toLowerCase().includes(needle) || c.a.toLowerCase().includes(needle)) matches.push(c);
    }
  }
  if (matches.length === 0) {
    statusEl.textContent = `No cards match “${term}”.`;
    return;
  }
  statusEl.textContent = '';
  studyDeckIds = [];
  const reverse = document.getElementById('reverse-mode').checked;
  beginSession(matches, `Search “${term}” · ${matches.length} card${matches.length === 1 ? '' : 's'}`, reverse);
});

function startStudy(ids, onlyFlagged) {
  studyDeckIds = ids;
  const selected = state.decks.filter(d => ids.includes(d.id));
  let cards = selected.flatMap(d => d.cards);
  if (onlyFlagged) cards = cards.filter(c => c.flagged);

  if (cards.length === 0) {
    alert(onlyFlagged
      ? 'No flagged cards in the selected deck(s). Flag some cards while studying first.'
      : 'The selected deck(s) have no cards.');
    return;
  }

  const scope = onlyFlagged ? 'flagged · ' : '';
  const label = selected.length === 1
    ? `${selected[0].name} · ${scope}${cards.length} cards`
    : `${selected.length} decks · ${scope}${cards.length} cards`;
  const reverse = document.getElementById('reverse-mode').checked;
  beginSession(cards, label, reverse);
}

// Shared entry point for deck-based, flagged, and search sessions.
function beginSession(cards, label, reverse) {
  studyCards = cards;
  reverseMode = !!reverse;
  document.getElementById('study-deck-label').textContent =
    (reverseMode ? '↔ ' : '') + label;
  document.getElementById('front-label').textContent = reverseMode ? 'Answer' : 'Question';
  document.getElementById('back-label').textContent = reverseMode ? 'Question' : 'Answer';
  buildOrder(false);
  deckPicker.classList.add('hidden');
  studyArea.classList.remove('hidden');
  startTimer();
  showCard();
}

/* ---------- Study: card engine ---------- */
const cardEl = document.getElementById('card');
const questionEl = document.getElementById('card-question');
const answerEl = document.getElementById('card-answer');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const flagCheck = document.getElementById('flag-check');

/* ---------- Rich card renderer (safe subset: bold/italic/colors/shapes) ---------- */
const NAMED_COLORS = {
  red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e',
  blue: '#3b82f6', indigo: '#4f46e5', purple: '#8b5cf6', violet: '#8b5cf6',
  pink: '#ec4899', magenta: '#d946ef', brown: '#92400e', black: '#111111',
  white: '#f8fafc', gray: '#6b7280', grey: '#6b7280', cyan: '#06b6d4',
  teal: '#14b8a6', lime: '#84cc16', gold: '#d4af37', silver: '#c0c0c0',
  maroon: '#7f1d1d', navy: '#1e3a8a',
};
function safeColor(c) {
  if (!c) return null;
  c = String(c).trim().toLowerCase();
  if (/^#[0-9a-f]{3}$|^#[0-9a-f]{4}$|^#[0-9a-f]{6}$|^#[0-9a-f]{8}$/.test(c)) return c;
  if (NAMED_COLORS[c]) return NAMED_COLORS[c];
  return null;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
const SHAPE_PATHS = {
  circle: '<circle cx="50" cy="50" r="45"/>',
  square: '<rect x="7" y="7" width="86" height="86" rx="6"/>',
  rectangle: '<rect x="4" y="24" width="92" height="52" rx="6"/>',
  oval: '<ellipse cx="50" cy="50" rx="46" ry="32"/>',
  triangle: '<polygon points="50,8 92,90 8,90"/>',
  diamond: '<polygon points="50,5 92,50 50,95 8,50"/>',
  pentagon: '<polygon points="50,6 94,39 77,92 23,92 6,39"/>',
  hexagon: '<polygon points="27,8 73,8 96,50 73,92 27,92 4,50"/>',
  star: '<polygon points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"/>',
  heart: '<path d="M50 84 C 10 54 12 22 34 22 C 45 22 50 31 50 31 C 50 31 55 22 66 22 C 88 22 90 54 50 84 Z"/>',
};
function shapeSVG(kind, color, size) {
  const body = SHAPE_PATHS[String(kind).trim().toLowerCase()] || SHAPE_PATHS.circle;
  const s = Math.max(12, Math.min(400, Number(size) || 96));
  const fill = safeColor(color) || 'currentColor';
  return `<svg class="card-shape" viewBox="0 0 100 100" width="${s}" height="${s}" ` +
    `fill="${fill}" stroke="rgba(120,120,120,0.35)" stroke-width="1" aria-hidden="true">${body}</svg>`;
}
function inlineMd(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
function renderToken(inner) {
  const segs = inner.split('|');
  const head = segs[0].split(':');
  const type = head[0].trim().toLowerCase();
  if (type === 'shape') {
    return shapeSVG(head[1] || 'circle', segs[1] || '', segs[2] || '');
  }
  if (type === 'c' || type === 'color') {
    const color = safeColor(head[1] || '');
    const txt = inlineMd(escapeHtml(segs.slice(1).join('|')));
    return color ? `<span style="color:${color}">${txt}</span>` : txt;
  }
  return escapeHtml('{{' + inner + '}}');
}
function renderInline(raw) {
  let out = '';
  for (const part of raw.split(/(\{\{[^}]*\}\})/g)) {
    const m = part.match(/^\{\{([^}]*)\}\}$/);
    out += m ? renderToken(m[1]) : inlineMd(escapeHtml(part));
  }
  return out;
}
// Split on top-level ';' used as a list separator. Semicolons inside {{...}}
// tokens are ignored, and '\;' is an escape for a literal semicolon (handy for
// grammar/punctuation cards, which are about the only place a semicolon appears).
function splitListItems(s) {
  const parts = [];
  let buf = '', depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\' && s[i + 1] === ';') { buf += ';'; i++; continue; }
    if (ch === '{' && s[i + 1] === '{') { depth++; buf += '{{'; i++; continue; }
    if (ch === '}' && s[i + 1] === '}') { if (depth > 0) depth--; buf += '}}'; i++; continue; }
    if (ch === ';' && depth === 0) { parts.push(buf); buf = ''; continue; }
    buf += ch;
  }
  parts.push(buf);
  return parts;
}
function renderRich(el, text) {
  const raw = text == null ? '' : String(text);
  if (!/[*\n;\\]|\{\{/.test(raw)) { el.textContent = raw; return; }
  const items = splitListItems(raw).map(s => s.trim()).filter(s => s.length);
  if (items.length > 1) {
    el.innerHTML = '<span class="card-list">' +
      items.map(it => '<span class="card-li">' + renderInline(it) + '</span>').join('') +
      '</span>';
    return;
  }
  el.innerHTML = renderInline(items.length ? items[0] : raw);
}

/* ---------- Study: matching-pairs game ---------- */
const MATCH_SIZE = 5;
const matchBoard = document.getElementById('match-board');
const matchStatus = document.getElementById('match-status');
const matchProgress = document.getElementById('match-progress');
let matchMeasureEl = null;

function shuffled(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalizeMatchValue(value) {
  return String(value ?? '')
    .replace(/\{\{(?:c|color):[^|}]+\|([^}]*)\}\}/gi, '$1')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\\;/g, ';')
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ');
}

function getMatchMeasureEl() {
  if (matchMeasureEl) return matchMeasureEl;
  matchMeasureEl = document.createElement('button');
  matchMeasureEl.type = 'button';
  matchMeasureEl.className = 'match-tile match-measurer';
  matchMeasureEl.setAttribute('aria-hidden', 'true');
  matchMeasureEl.tabIndex = -1;
  document.body.appendChild(matchMeasureEl);
  return matchMeasureEl;
}

function matchSideFits(text) {
  const el = getMatchMeasureEl();
  const contentWidth = Math.min(window.innerWidth || 320, 640);
  el.style.width = `${Math.max(120, (contentWidth - 41) / 2)}px`;
  renderRich(el, text);
  return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;
}

function getMatchEligibleCards(cards) {
  return cards.filter(card =>
    normalizeMatchValue(card.q) &&
    normalizeMatchValue(card.a) &&
    matchSideFits(card.q) &&
    matchSideFits(card.a));
}

function wrapMatchCards(cards) {
  return cards.map((card, index) => ({
    card,
    id: `pair-${index}-${Math.random().toString(36).slice(2, 8)}`,
    qKey: normalizeMatchValue(card.q),
    aKey: normalizeMatchValue(card.a),
  }));
}

// A round is a matching in a question-to-answer bipartite graph: no two
// selected cards may share a visible question or answer.
function pickConflictFreeGroup(cards, limit = MATCH_SIZE) {
  const byQuestion = new Map();
  for (const item of shuffled(cards)) {
    if (!byQuestion.has(item.qKey)) byQuestion.set(item.qKey, []);
    byQuestion.get(item.qKey).push(item);
  }

  const matchByAnswer = new Map();
  const tryQuestion = (qKey, seenAnswers) => {
    for (const item of shuffled(byQuestion.get(qKey) || [])) {
      if (seenAnswers.has(item.aKey)) continue;
      seenAnswers.add(item.aKey);
      const current = matchByAnswer.get(item.aKey);
      if (!current || tryQuestion(current.qKey, seenAnswers)) {
        matchByAnswer.set(item.aKey, item);
        return true;
      }
    }
    return false;
  };

  for (const qKey of shuffled([...byQuestion.keys()])) {
    tryQuestion(qKey, new Set());
    if (matchByAnswer.size >= limit) break;
  }
  return shuffled([...matchByAnswer.values()]).slice(0, limit);
}

function buildMatchRounds(cards) {
  let remaining = wrapMatchCards(cards);
  const rounds = [];
  while (remaining.length >= MATCH_SIZE) {
    const round = pickConflictFreeGroup(remaining);
    if (round.length < MATCH_SIZE) break;
    rounds.push(round);
    const used = new Set(round.map(item => item.id));
    remaining = remaining.filter(item => !used.has(item.id));
  }
  return rounds;
}

function selectedMatchSource() {
  const ids = [...deckListEl.querySelectorAll('input[type=checkbox]:checked')].map(b => b.value);
  if (ids.length !== 1) return { ids, deck: null, cards: [] };
  const deck = state.decks.find(d => d.id === ids[0]);
  if (!deck) return { ids, deck: null, cards: [] };
  const onlyFlagged = document.getElementById('only-flagged').checked;
  const cards = onlyFlagged ? deck.cards.filter(card => card.flagged) : deck.cards;
  return { ids, deck, cards, onlyFlagged };
}

function getMatchAvailability() {
  const source = selectedMatchSource();
  if (!source.deck) return { source, eligible: [], rounds: [] };
  const eligible = getMatchEligibleCards(source.cards);
  const rounds = buildMatchRounds(eligible);
  return { source, eligible, rounds };
}

function updateStudyEligibility() {
  startModeBtn.disabled = false;
  modeEligibility.classList.toggle('hidden', studyMode === 'flashcards');
  if (studyMode === 'flashcards') return;

  const source = selectedMatchSource();
  startModeBtn.disabled = true;
  if (source.ids.length === 0) {
    modeEligibility.textContent = `Select one deck to see which cards are applicable for ${
      studyMode === 'matching' ? 'Matching Pairs' : 'Multiple Choice'}.`;
    return;
  }
  if (source.ids.length > 1) {
    modeEligibility.textContent = 'Choose exactly one deck for this study mode.';
    return;
  }

  const label = source.onlyFlagged ? 'flagged cards' : 'cards';
  if (studyMode === 'matching') {
    const { eligible, rounds } = getMatchAvailability();
    modeEligibility.textContent =
      `${eligible.length} of ${source.cards.length} ${label} are applicable for Matching Pairs.`;
    if (eligible.length < MATCH_SIZE) {
      modeEligibility.textContent += ' At least 5 are needed.';
      return;
    }
    if (!rounds.length) {
      modeEligibility.textContent +=
        ' Repeated questions or answers prevent a complete 5-pair round.';
      return;
    }
    startModeBtn.disabled = false;
    modeEligibility.textContent += ' Complete groups of 5 are used.';
    return;
  }

  const available = getChoiceAvailability(source.cards);
  modeEligibility.textContent =
    `${available.questions.length} of ${source.cards.length} ${label} are applicable for Multiple Choice.`;
  if (!available.questions.length) {
    modeEligibility.textContent += ' More unique, fitting answer choices are needed.';
    return;
  }
  startModeBtn.disabled = false;
  modeEligibility.textContent += ' Choices are generated when the game starts.';
}

function startMatchGame() {
  const { source, eligible, rounds } = getMatchAvailability();
  if (eligible.length < MATCH_SIZE || !rounds.length) {
    updateStudyEligibility();
    return;
  }

  const playableCount = rounds.length * MATCH_SIZE;
  studyDeckIds = source.ids;
  matchRounds = rounds;
  matchRoundIndex = 0;
  matchSessionToken++;
  deckPicker.classList.add('hidden');
  studyArea.classList.add('hidden');
  matchArea.classList.remove('hidden');
  choiceArea.classList.add('hidden');
  stopTimer();
  timerEl.classList.add('hidden');
  document.getElementById('match-deck-label').textContent =
    `${source.deck.name} · ${playableCount} applicable cards`;
  renderMatchRound();
}

function renderMatchRound() {
  const round = matchRounds[matchRoundIndex];
  matchFirstTile = null;
  matchLocked = false;
  matchRoundMatched = 0;
  matchBoard.innerHTML = '';
  matchStatus.textContent = 'Match each question with its answer.';
  matchProgress.textContent = `Round ${matchRoundIndex + 1} of ${matchRounds.length} · 0 / ${round.length}`;

  const questionTiles = shuffled(round.map(item => ({ item, side: 'q', text: item.card.q })));
  const answerTiles = shuffled(round.map(item => ({ item, side: 'a', text: item.card.a })));
  const questionHead = document.createElement('div');
  questionHead.className = 'match-column-head';
  questionHead.textContent = 'Question';
  const answerHead = document.createElement('div');
  answerHead.className = 'match-column-head';
  answerHead.textContent = 'Answer';
  matchBoard.appendChild(questionHead);
  matchBoard.appendChild(answerHead);

  for (let i = 0; i < round.length; i++) {
    for (const tile of [questionTiles[i], answerTiles[i]]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'match-tile';
      button.dataset.pairId = tile.item.id;
      button.dataset.side = tile.side;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `${tile.side === 'q' ? 'Question' : 'Answer'}: ${normalizeMatchValue(tile.text)}`);
      renderRich(button, tile.text);
      button.addEventListener('click', () => chooseMatchTile(button));
      matchBoard.appendChild(button);
    }
  }
}

function chooseMatchTile(tile) {
  if (matchLocked || tile.classList.contains('matched')) return;
  if (matchFirstTile === tile) {
    tile.classList.remove('selected');
    tile.setAttribute('aria-pressed', 'false');
    matchFirstTile = null;
    return;
  }

  tile.classList.add('selected');
  tile.setAttribute('aria-pressed', 'true');
  if (!matchFirstTile) {
    matchFirstTile = tile;
    return;
  }

  const first = matchFirstTile;
  matchFirstTile = null;
  matchLocked = true;
  const token = matchSessionToken;
  const correct = first.dataset.pairId === tile.dataset.pairId &&
    first.dataset.side !== tile.dataset.side;

  if (correct) {
    playCorrectMatch();
    matchRoundMatched++;
    matchStatus.textContent = 'Correct pair!';
    matchProgress.textContent =
      `Round ${matchRoundIndex + 1} of ${matchRounds.length} · ${matchRoundMatched} / ${matchRounds[matchRoundIndex].length}`;
    first.classList.remove('selected');
    tile.classList.remove('selected');
    first.classList.add('matched');
    tile.classList.add('matched');
    first.disabled = true;
    tile.disabled = true;

    const roundComplete = matchRoundMatched === matchRounds[matchRoundIndex].length;
    setTimeout(() => {
      if (token !== matchSessionToken) return;
      if (roundComplete) {
        matchRoundIndex++;
        if (matchRoundIndex < matchRounds.length) renderMatchRound();
        else renderMatchComplete();
      } else {
        matchLocked = false;
        matchStatus.textContent = 'Keep going!';
      }
    }, roundComplete ? 700 : 350);
    return;
  }

  playIncorrectMatch();
  matchStatus.textContent = 'Not a match. Try again.';
  first.classList.add('wrong');
  tile.classList.add('wrong');
  setTimeout(() => {
    if (token !== matchSessionToken) return;
    for (const item of [first, tile]) {
      item.classList.remove('selected', 'wrong');
      item.setAttribute('aria-pressed', 'false');
    }
    matchLocked = false;
  }, 650);
}

function renderMatchComplete() {
  matchStatus.textContent = '';
  matchProgress.textContent = 'Complete';
  matchBoard.innerHTML = '';
  const complete = document.createElement('div');
  complete.className = 'match-complete';
  complete.innerHTML =
    `<h3>All pairs matched!</h3>` +
    `<p>You completed ${matchRounds.reduce((total, round) => total + round.length, 0)} cards.</p>`;
  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'btn primary';
  again.textContent = 'Play again';
  again.addEventListener('click', startMatchGame);
  complete.appendChild(again);
  matchBoard.appendChild(complete);
}

let matchResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(matchResizeTimer);
  matchResizeTimer = setTimeout(() => {
    if (!deckPicker.classList.contains('hidden')) {
      updateStudyEligibility();
      return;
    }
    if (!choiceArea.classList.contains('hidden')) {
      const remaining = choiceQuestions.slice(choiceQuestionIndex);
      const stillFits = remaining.every(question =>
        choiceQuestionFits(question.card.q) &&
        question.options.every(option => choiceOptionFits(option.text)));
      if (stillFits) return;
      const questionCards = remaining.map(question => question.card);
      const available = getChoiceAvailability(questionCards, choiceSourceCards);
      if (available.questions.length) {
        startChoiceGame(questionCards);
        toast('Multiple Choice restarted to fit the new screen size.');
      } else {
        openDeckPicker();
        toast('No remaining questions are applicable at this screen size.');
      }
      return;
    }
    if (matchArea.classList.contains('hidden')) return;
    if (matchRoundIndex >= matchRounds.length) return;
    const stillFits = matchRounds.slice(matchRoundIndex).every(round =>
      round.every(item => matchSideFits(item.card.q) && matchSideFits(item.card.a)));
    if (stillFits) return;

    const source = selectedMatchSource();
    const eligible = source.deck ? getMatchEligibleCards(source.cards) : [];
    if (buildMatchRounds(eligible).length) {
      startMatchGame();
      toast('Matching Pairs restarted to fit the new screen size.');
    } else {
      openDeckPicker();
      toast('Fewer than 5 cards are applicable at this screen size.');
    }
  }, 150);
});

/* ---------- Study: multiple-choice game ---------- */
const CHOICE_SINGLE_DISTRACTORS = 3;
const CHOICE_MULTI_DISTRACTORS = 2;
const choiceQuestionEl = document.getElementById('choice-question');
const choiceOptionsEl = document.getElementById('choice-options');
const choiceInstruction = document.getElementById('choice-instruction');
const choiceProgress = document.getElementById('choice-progress');
const choiceStatus = document.getElementById('choice-status');
const choiceCheckBtn = document.getElementById('choice-check-btn');
const choiceNextBtn = document.getElementById('choice-next-btn');
let choiceQuestionMeasureEl = null;
let choiceOptionMeasureEl = null;

function getChoiceQuestionMeasureEl() {
  if (choiceQuestionMeasureEl) return choiceQuestionMeasureEl;
  choiceQuestionMeasureEl = document.createElement('div');
  choiceQuestionMeasureEl.className = 'choice-question choice-measurer';
  choiceQuestionMeasureEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(choiceQuestionMeasureEl);
  return choiceQuestionMeasureEl;
}

function getChoiceOptionMeasureEl() {
  if (choiceOptionMeasureEl) return choiceOptionMeasureEl;
  choiceOptionMeasureEl = document.createElement('button');
  choiceOptionMeasureEl.type = 'button';
  choiceOptionMeasureEl.className = 'choice-option choice-measurer';
  choiceOptionMeasureEl.setAttribute('aria-hidden', 'true');
  choiceOptionMeasureEl.tabIndex = -1;
  document.body.appendChild(choiceOptionMeasureEl);
  return choiceOptionMeasureEl;
}

function choiceQuestionFits(text) {
  const el = getChoiceQuestionMeasureEl();
  el.style.width = `${Math.max(240, Math.min(window.innerWidth || 320, 640) - 32)}px`;
  el.style.height = '160px';
  renderRich(el, text);
  return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;
}

function choiceOptionFits(text) {
  const el = getChoiceOptionMeasureEl();
  el.style.width = `${Math.max(240, Math.min(window.innerWidth || 320, 640) - 32)}px`;
  el.style.height = '76px';
  renderRich(el, text);
  return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;
}

function choiceAnswerItems(card) {
  const items = splitListItems(String(card.a ?? '')).map(item => item.trim()).filter(Boolean);
  const unique = new Map();
  for (const text of items) {
    const key = normalizeMatchValue(text);
    if (key && !unique.has(key)) unique.set(key, { text, key });
  }
  return [...unique.values()];
}

function accessibleRichText(text) {
  return String(text ?? '')
    .replace(/\{\{shape:([^|}]+)\|([^|}]+)(?:\|[^}]*)?\}\}/gi, (_, shape, color) =>
      `${color} ${shape}`)
    .replace(/\{\{(?:c|color):[^|}]+\|([^}]*)\}\}/gi, '$1')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\\;/g, ';')
    .replace(/;/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function choiceCardData(card, requireQuestionFit) {
  const qKey = normalizeMatchValue(card.q);
  const correctItems = choiceAnswerItems(card);
  if (!qKey || correctItems.length < 1 || correctItems.length > 4) return null;
  if (requireQuestionFit && !choiceQuestionFits(card.q)) return null;
  if (!correctItems.every(item => choiceOptionFits(item.text))) return null;
  return { card, qKey, correctItems };
}

function getChoiceAvailability(questionCards, poolCards = questionCards) {
  const questionMap = new Map();
  for (const card of questionCards) {
    const data = choiceCardData(card, true);
    if (data && !questionMap.has(data.qKey)) questionMap.set(data.qKey, data);
  }

  const pool = [];
  for (const card of poolCards) {
    const data = choiceCardData(card, false);
    if (!data) continue;
    for (const item of data.correctItems) pool.push({ ...item, card });
  }

  const questions = [];
  for (const data of questionMap.values()) {
    const correctKeys = new Set(data.correctItems.map(item => item.key));
    const distractorMap = new Map();
    for (const item of pool) {
      if (item.card === data.card || correctKeys.has(item.key) || distractorMap.has(item.key)) continue;
      distractorMap.set(item.key, item);
    }
    const required = data.correctItems.length > 1
      ? CHOICE_MULTI_DISTRACTORS
      : CHOICE_SINGLE_DISTRACTORS;
    if (distractorMap.size >= required) {
      questions.push({ ...data, distractors: [...distractorMap.values()] });
    }
  }
  return { questions };
}

function buildChoiceQuestions(questionCards, poolCards = questionCards) {
  return shuffled(getChoiceAvailability(questionCards, poolCards).questions).map(data => {
    const multi = data.correctItems.length > 1;
    const distractorCount = multi ? CHOICE_MULTI_DISTRACTORS : CHOICE_SINGLE_DISTRACTORS;
    const correctOptions = data.correctItems.map(item => ({ ...item, correct: true }));
    const distractors = shuffled(data.distractors).slice(0, distractorCount)
      .map(item => ({ text: item.text, key: item.key, correct: false }));
    return {
      card: data.card,
      multi,
      options: shuffled([...correctOptions, ...distractors]),
    };
  });
}

function startChoiceGame(questionCards = null) {
  let sourceCards;
  let sourceDeck;
  if (questionCards) {
    sourceCards = choiceSourceCards;
    sourceDeck = choiceSourceDeck;
  } else {
    const source = selectedMatchSource();
    if (!source.deck) return;
    sourceCards = source.cards;
    sourceDeck = source.deck;
    questionCards = source.cards;
  }

  const questions = buildChoiceQuestions(questionCards, sourceCards);
  if (!questions.length) {
    updateStudyEligibility();
    return;
  }

  choiceSourceCards = sourceCards;
  choiceSourceDeck = sourceDeck;
  choiceQuestions = questions;
  choiceCurrentQuestionCards = questions.map(question => question.card);
  choiceQuestionIndex = 0;
  choiceScore = 0;
  choiceMissedCards = [];
  choiceAnswered = false;
  studyDeckIds = [sourceDeck.id];
  deckPicker.classList.add('hidden');
  studyArea.classList.add('hidden');
  matchArea.classList.add('hidden');
  choiceArea.classList.remove('hidden');
  stopTimer();
  timerEl.classList.add('hidden');
  document.getElementById('choice-deck-label').textContent =
    `${sourceDeck.name} · ${questions.length} applicable question${questions.length === 1 ? '' : 's'}`;
  renderChoiceQuestion();
}

function renderChoiceQuestion() {
  const question = choiceQuestions[choiceQuestionIndex];
  choiceAnswered = false;
  choiceQuestionEl.classList.remove('hidden');
  choiceInstruction.classList.remove('hidden');
  choiceStatus.classList.remove('success', 'error', 'hidden');
  choiceStatus.textContent = '';
  choiceOptionsEl.innerHTML = '';
  choiceProgress.textContent =
    `Question ${choiceQuestionIndex + 1} of ${choiceQuestions.length} · Score ${choiceScore}`;
  choiceInstruction.textContent = question.multi
    ? 'Choose every correct answer.'
    : 'Choose one answer.';
  renderRich(choiceQuestionEl, question.card.q);
  choiceQuestionEl.setAttribute('aria-label', `Question: ${accessibleRichText(question.card.q)}`);

  for (const option of question.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-option';
    button.dataset.key = option.key;
    button.dataset.correct = String(option.correct);
    button.dataset.label = accessibleRichText(option.text);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', button.dataset.label);
    renderRich(button, option.text);
    button.addEventListener('click', () => chooseChoiceOption(button, question.multi));
    choiceOptionsEl.appendChild(button);
  }

  choiceCheckBtn.disabled = true;
  choiceCheckBtn.classList.remove('hidden');
  choiceNextBtn.classList.add('hidden');
}

function chooseChoiceOption(button, multi) {
  if (choiceAnswered) return;
  if (!multi) {
    choiceOptionsEl.querySelectorAll('.choice-option.selected').forEach(option => {
      if (option !== button) {
        option.classList.remove('selected');
        option.setAttribute('aria-pressed', 'false');
      }
    });
  }
  const selected = button.classList.toggle('selected');
  button.setAttribute('aria-pressed', String(selected));
  choiceCheckBtn.disabled = !choiceOptionsEl.querySelector('.choice-option.selected');
}

function checkChoiceAnswer() {
  if (choiceAnswered) return;
  const buttons = [...choiceOptionsEl.querySelectorAll('.choice-option')];
  const selected = buttons.filter(button => button.classList.contains('selected'));
  if (!selected.length) return;

  choiceAnswered = true;
  const exact = buttons.every(button =>
    (button.dataset.correct === 'true') === button.classList.contains('selected'));
  if (exact) {
    choiceScore++;
    playCorrectMatch();
    choiceStatus.textContent = 'Correct!';
    choiceStatus.classList.add('success');
  } else {
    choiceMissedCards.push(choiceQuestions[choiceQuestionIndex].card);
    playIncorrectMatch();
    choiceStatus.textContent = 'Not quite. The correct choice or choices are highlighted.';
    choiceStatus.classList.add('error');
  }

  for (const button of buttons) {
    const correct = button.dataset.correct === 'true';
    const picked = button.classList.contains('selected');
    button.disabled = true;
    if (correct && picked) {
      button.classList.add('correct');
      button.setAttribute('aria-label', `${button.dataset.label}, correct answer, selected`);
    } else if (correct) {
      button.classList.add('missed');
      button.setAttribute('aria-label', `${button.dataset.label}, correct answer, not selected`);
    } else if (picked) {
      button.classList.add('incorrect');
      button.setAttribute('aria-label', `${button.dataset.label}, incorrect answer, selected`);
    }
  }
  choiceProgress.textContent =
    `Question ${choiceQuestionIndex + 1} of ${choiceQuestions.length} · Score ${choiceScore}`;
  choiceCheckBtn.classList.add('hidden');
  choiceNextBtn.textContent =
    choiceQuestionIndex === choiceQuestions.length - 1 ? 'See results' : 'Next question';
  choiceNextBtn.classList.remove('hidden');
}

function nextChoiceQuestion() {
  if (!choiceAnswered) return;
  choiceQuestionIndex++;
  if (choiceQuestionIndex >= choiceQuestions.length) renderChoiceComplete();
  else renderChoiceQuestion();
}

function renderChoiceComplete() {
  const total = choiceQuestions.length;
  const percent = Math.round((choiceScore / total) * 100);
  choiceQuestionEl.classList.add('hidden');
  choiceInstruction.classList.add('hidden');
  choiceStatus.classList.add('hidden');
  choiceCheckBtn.classList.add('hidden');
  choiceNextBtn.classList.add('hidden');
  choiceProgress.textContent = 'Complete';
  choiceOptionsEl.innerHTML = '';

  const complete = document.createElement('div');
  complete.className = 'choice-complete';
  complete.innerHTML =
    '<h3>Quiz complete!</h3>' +
    `<div class="choice-score">${percent}%</div>` +
    `<p>${choiceScore} of ${total} correct</p>`;
  const actions = document.createElement('div');
  actions.className = 'choice-complete-actions';
  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'btn primary';
  again.textContent = 'Play again';
  again.addEventListener('click', () => startChoiceGame(choiceCurrentQuestionCards.slice()));
  actions.appendChild(again);
  if (choiceMissedCards.length) {
    const review = document.createElement('button');
    review.type = 'button';
    review.className = 'btn';
    review.textContent = `Review ${choiceMissedCards.length} missed`;
    review.addEventListener('click', () => startChoiceGame(choiceMissedCards.slice()));
    actions.appendChild(review);
  }
  complete.appendChild(actions);
  choiceOptionsEl.appendChild(complete);
}

choiceCheckBtn.addEventListener('click', checkChoiceAnswer);
choiceNextBtn.addEventListener('click', nextChoiceQuestion);

function buildOrder(shuffle) {
  order = studyCards.map((_, i) => i);
  if (shuffle) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  pos = 0;
}

function showCard() {
  if (studyCards.length === 0) return;
  if (pos >= order.length) pos = 0;
  const card = studyCards[order[pos]];
  cardEl.classList.remove('flipped');
  renderRich(questionEl, reverseMode ? card.a : card.q);
  renderRich(answerEl, reverseMode ? card.q : card.a);
  flagCheck.checked = !!card.flagged;
  progressText.textContent = `${pos + 1} / ${order.length}`;
  progressFill.style.width = `${((pos + 1) / order.length) * 100}%`;
}

flagCheck.addEventListener('change', () => {
  if (studyCards.length === 0) return;
  studyCards[order[pos]].flagged = flagCheck.checked;
  save();
});

function flip() { cardEl.classList.toggle('flipped'); playDing(); }
function next() { pos = (pos + 1) % order.length; showCard(); }
function prev() { pos = (pos - 1 + order.length) % order.length; showCard(); }

cardEl.addEventListener('click', flip);
cardEl.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
document.getElementById('next-btn').addEventListener('click', next);
document.getElementById('prev-btn').addEventListener('click', prev);
document.getElementById('shuffle-btn').addEventListener('click', () => { buildOrder(true); showCard(); });

let touchStartX = null;
cardEl.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
cardEl.addEventListener('touchend', e => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 60) { dx < 0 ? next() : prev(); }
  touchStartX = null;
});
document.addEventListener('keydown', e => {
  if (!views.study.classList.contains('active') || studyArea.classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
});

/* ============================================================
   Preferences: sound, timer, font size
============================================================ */
const PREF = {
  get sound() { return K('pref.sound'); },
  get timer() { return K('pref.timer'); },
  get font() { return K('pref.font'); },
  get tipsStartup() { return K('pref.tipsStartup'); },
  get tipsNavigate() { return K('pref.tipsNavigate'); },
  get tipIndex() { return K('pref.tipIndex'); },
};
function prefBool(key, def) { const v = localStorage.getItem(key); return v === null ? def : v === '1'; }

/* ---- Sound: synthesized cues via Web Audio (no assets, works offline) ---- */
let audioCtx = null;
function playNotes(notes, type = 'sine', volume = 0.25) {
  if (!prefBool(PREF.sound, false)) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const lastNote = notes[notes.length - 1];
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + lastNote.at + 0.24);
    gain.connect(audioCtx.destination);
    const osc = audioCtx.createOscillator();
    osc.type = type;
    for (const note of notes) osc.frequency.setValueAtTime(note.frequency, now + note.at);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + lastNote.at + 0.25);
  } catch (e) { /* ignore audio errors */ }
}
function playDing() {
  playNotes([{ frequency: 880, at: 0 }, { frequency: 1318.5, at: 0.09 }]);
}
function playCorrectMatch() {
  playNotes([
    { frequency: 659.25, at: 0 },
    { frequency: 783.99, at: 0.08 },
    { frequency: 1046.5, at: 0.16 },
  ], 'sine', 0.24);
}
function playIncorrectMatch() {
  playNotes([
    { frequency: 246.94, at: 0 },
    { frequency: 174.61, at: 0.14 },
  ], 'triangle', 0.16);
}

/* ---- Timer: stopwatch during study, tap to pause/resume ---- */
const timerEl = document.getElementById('timer');
let timerInt = null, timerAcc = 0, timerLast = 0, timerRunning = false;

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
function renderTimer() { timerEl.textContent = fmtTime(timerAcc); }
function timerTick() {
  if (!timerRunning) return;
  const now = Date.now();
  timerAcc += now - timerLast;
  timerLast = now;
  renderTimer();
}
function startTimer() {
  stopTimer();
  timerAcc = 0;
  if (!prefBool(PREF.timer, false)) { timerEl.classList.add('hidden'); return; }
  timerEl.classList.remove('hidden', 'paused');
  timerRunning = true;
  timerLast = Date.now();
  renderTimer();
  timerInt = setInterval(timerTick, 250);
}
function stopTimer() {
  if (timerInt) { clearInterval(timerInt); timerInt = null; }
  timerRunning = false;
}
function toggleTimer() {
  if (!prefBool(PREF.timer, false) || !timerInt) return;
  if (timerRunning) {
    timerTick();               // capture the final slice
    timerRunning = false;
    timerEl.classList.add('paused');
  } else {
    timerRunning = true;
    timerLast = Date.now();    // resume without a jump
    timerEl.classList.remove('paused');
  }
}
timerEl.addEventListener('click', toggleTimer);

/* ---- Font size ---- */
function applyFont() {
  const size = localStorage.getItem(PREF.font) || 'default';
  document.documentElement.setAttribute('data-font', size);
  document.querySelectorAll('#font-size .seg').forEach(b =>
    b.classList.toggle('active', b.dataset.font === size));
}

/* ---- Wire preference controls ---- */
function initPrefs() {
  const sound = document.getElementById('pref-sound');
  const timer = document.getElementById('pref-timer');
  sound.checked = prefBool(PREF.sound, false);
  timer.checked = prefBool(PREF.timer, false);
  sound.addEventListener('change', () => {
    localStorage.setItem(PREF.sound, sound.checked ? '1' : '0');
    if (sound.checked) playDing();
  });
  timer.addEventListener('change', () => {
    localStorage.setItem(PREF.timer, timer.checked ? '1' : '0');
    const studying = !studyArea.classList.contains('hidden') &&
      views.study.classList.contains('active');
    if (timer.checked && studying) startTimer();
    else if (!timer.checked) { stopTimer(); timerEl.classList.add('hidden'); }
  });
  document.querySelectorAll('#font-size .seg').forEach(b =>
    b.addEventListener('click', () => { localStorage.setItem(PREF.font, b.dataset.font); applyFont(); }));
  applyFont();
}

/* ============================================================
   Tips: lightbulb popup + startup + navigate toasts
============================================================ */
const TIPS = [
  { ico: '👥', view: 'home',
    title: 'Switch between profiles',
    text: 'Tap the colored circle in the top-right to add a profile or switch users. Each profile keeps its own decks, theme, and font size — perfect for sharing one device.' },
  { ico: '📄', view: 'edit',
    title: 'Import a file to create a deck',
    text: 'On the Import tab, tap “Import file…” to load a Word .docx, a .csv/.txt list, or a .json deck. Each file becomes its own deck.' },
  { ico: '👆', view: 'study',
    title: 'Tap a card to reveal the answer',
    text: 'While studying, tap the card to flip it and show the answer. Tap again to flip back to the question.' },
  { ico: '👉', view: 'study',
    title: 'Swipe to move between cards',
    text: 'Swipe left for the next card and swipe right for the previous one. On a computer, use the ← and → arrow keys.' },
  { ico: '🚩', view: 'study',
    title: 'Flag tricky cards, then drill them',
    text: 'Tick “Flag this card for review” while studying. Back on the Study picker, turn on “Only study flagged cards” to run just those.' },
  { ico: '🔄', view: 'study',
    title: 'Reverse mode',
    text: 'Choose Flashcards in the Study picker, then turn on “Reverse” to see the answer first and guess the question instead. Reverse does not apply to the game modes.' },
  { ico: '🧩', view: 'study',
    title: 'Play Matching Pairs',
    text: 'Choose Matching pairs on the Study tab and select one deck. Questions appear on the left and shuffled answers on the right. At least five applicable cards are needed; tap one from each column to make a pair.' },
  { ico: '✅', view: 'study',
    title: 'Try Multiple Choice',
    text: 'Choose Multiple choice and select one deck. Flashcard Flipper creates fresh answer choices from that deck each time. Bulleted answers become “Choose every correct answer” questions when enough choices are applicable.' },
  { ico: '🔍', view: 'study',
    title: 'Study across decks',
    text: 'Check multiple decks to study them together, or use the search box to study every matching card from all your decks at once.' },
  { ico: '📤', view: 'study',
    title: 'Share a deck',
    text: 'On the Study tab, swipe a deck left (or hover it on a computer) to reveal Share, then tap Share to send it via AirDrop, Messages, or email — or save it as a .json file.' },
  { ico: '⏱️', view: 'study',
    title: 'Add a timer',
    text: 'Turn on “Show a timer while studying” in ⚙ Settings to time your session. Tap the timer to pause or resume it.' },
  { ico: '🙈', view: 'study',
    title: 'Hide a deck',
    text: 'On the Study tab, swipe a deck left (or hover it on a computer) and tap Hide to remove it from your Study list without deleting it. Hidden decks appear at the bottom, ready to bring back.' },
  { ico: '📝', view: 'edit',
    title: 'Bulleted answers',
    text: 'Separate answer items with a semicolon to show them as a bulleted list — e.g. “Name a primary color | Red; Blue; Yellow”.' },
  { ico: '🎨', view: 'home',
    title: 'Make it yours',
    text: 'Open ⚙ Settings to change the theme, accent color, font size, and sound — each profile has its own.' },
];

function tipItemHTML(t) {
  return '<span class="tip-ico" aria-hidden="true">' + t.ico + '</span>' +
    '<div class="tip-body">' +
      '<p class="tip-title">' + escapeHtml(t.title) + '</p>' +
      '<p class="tip-text">' + escapeHtml(t.text) + '</p>' +
    '</div>';
}

function renderTips() {
  const ul = document.getElementById('tips-list');
  if (!ul) return;
  ul.innerHTML = '';
  for (const t of TIPS) {
    const li = document.createElement('li');
    li.className = 'tip-item';
    li.innerHTML = tipItemHTML(t);
    ul.appendChild(li);
  }
}

function openTips() { document.getElementById('tips-modal').classList.remove('hidden'); }
function closeTips() { document.getElementById('tips-modal').classList.add('hidden'); }

/* Single rotating tip shown at startup (a different one each launch) */
function pickStartupTip() {
  const idx = parseInt(localStorage.getItem(PREF.tipIndex) || '0', 10) || 0;
  const tip = TIPS[idx % TIPS.length];
  localStorage.setItem(PREF.tipIndex, String((idx + 1) % TIPS.length));
  return tip;
}
function openStartupTip() {
  const ul = document.getElementById('startup-tip-body');
  const li = document.createElement('li');
  li.className = 'tip-item';
  li.innerHTML = tipItemHTML(pickStartupTip());
  ul.innerHTML = '';
  ul.appendChild(li);
  syncTipsStartupChecks();
  document.getElementById('startup-tip-modal').classList.remove('hidden');
}
function closeStartupTip() { document.getElementById('startup-tip-modal').classList.add('hidden'); }

function syncTipsStartupChecks() {
  const on = prefBool(PREF.tipsStartup, true);
  document.querySelectorAll('.tips-startup-check').forEach(c => { c.checked = on; });
}
function setTipsStartup(on) {
  localStorage.setItem(PREF.tipsStartup, on ? '1' : '0');
  syncTipsStartupChecks();
}

/* Contextual toast shown while navigating, if enabled */
let tipToastEl = null, tipToastTimer = null;
const navTipShown = new Set();
function hideTipToast() {
  if (!tipToastEl) return;
  tipToastEl.classList.remove('show');
  if (tipToastTimer) { clearTimeout(tipToastTimer); tipToastTimer = null; }
}
function showTipToast(tip) {
  if (!tipToastEl) {
    tipToastEl = document.createElement('div');
    tipToastEl.className = 'tip-toast';
    tipToastEl.setAttribute('role', 'status');
    document.body.appendChild(tipToastEl);
  }
  tipToastEl.innerHTML =
    '<span class="tip-ico" aria-hidden="true">' + tip.ico + '</span>' +
    '<span class="tip-toast-text">' + escapeHtml(tip.text) + '</span>' +
    '<button class="tip-toast-x" aria-label="Dismiss tip">&times;</button>';
  tipToastEl.querySelector('.tip-toast-x').addEventListener('click', hideTipToast);
  setTimeout(() => { if (tipToastEl) tipToastEl.classList.add('show'); }, 20);
  if (tipToastTimer) clearTimeout(tipToastTimer);
  tipToastTimer = setTimeout(hideTipToast, 6000);
}
function maybeNavTip(view) {
  if (!prefBool(PREF.tipsNavigate, false)) return;
  if (navTipShown.has(view)) return;
  const pool = TIPS.filter(t => t.view === view);
  if (!pool.length) return;
  navTipShown.add(view);
  showTipToast(pool[Math.floor(Math.random() * pool.length)]);
}

function initTips() {
  renderTips();
  syncTipsStartupChecks();
  document.getElementById('tips-btn').addEventListener('click', openTips);
  document.getElementById('home-tips-btn').addEventListener('click', openTips);
  document.getElementById('tips-close').addEventListener('click', closeTips);
  const modal = document.getElementById('tips-modal');
  modal.addEventListener('click', (e) => { if (e.target === modal) closeTips(); });
  document.getElementById('startup-tip-close').addEventListener('click', closeStartupTip);
  document.getElementById('see-all-tips-btn').addEventListener('click', () => { closeStartupTip(); openTips(); });
  const sModal = document.getElementById('startup-tip-modal');
  sModal.addEventListener('click', (e) => { if (e.target === sModal) closeStartupTip(); });
  document.querySelectorAll('.tips-startup-check').forEach(c =>
    c.addEventListener('change', () => setTipsStartup(c.checked)));
  const nav = document.getElementById('pref-tips-navigate');
  nav.checked = prefBool(PREF.tipsNavigate, false);
  nav.addEventListener('change', () => {
    localStorage.setItem(PREF.tipsNavigate, nav.checked ? '1' : '0');
    if (!nav.checked) hideTipToast();
  });
}

/* ============================================================
   Help Center (FAQ) + Privacy Policy content
============================================================ */
const FAQ = [
  ['Where is my data stored?',
   'Everything lives on your device in the browser\u2019s local storage. Your decks, cards, flags, and settings never leave your phone.'],
  ['How do profiles work?',
   'Tap the colored avatar in the top-right to add a profile or switch between them. Each profile has its own decks, theme, accent color, font size, and preferences \u2014 handy when several people share one device. Profiles live only on this device: there are no accounts, logins, or passwords, and switching never sends anything anywhere. Your existing cards automatically became the first profile, \u201cMe\u201d.'],
  ['How do tips work?',
   'Tap the lightbulb (next to the \u2699 gear) or \u201cView tips\u201d on the Home screen to see all the tips. When \u201cShow tips at startup\u201d is on, a single quick tip \u2014 a different one each time \u2014 pops up when you open the app; you can turn it off from that popup, the Home screen, or Settings. Turn on \u201cShow tips as you navigate\u201d in Settings for short, in-context reminders as you move between tabs.'],
  ['Does it work offline?',
   'Yes. Once installed to your home screen, the app runs fully offline. You only need a connection the first time you open it (and to fetch updates).'],
  ['How do I import questions?',
   'Go to the Import tab and tap \u201cImport file\u2026\u201d. You can load a Word .docx, a .csv/.txt list, or a deck .json exported from this app. You can also type or paste cards as \u201cquestion | answer\u201d, one per line.'],
  ['Why can\u2019t I import some PDFs or Word files?',
   'Scanned or image-only documents contain pictures of text, not real text, so nothing can be extracted without OCR. Convert them to a text-based .docx (open in Word) first, then import.'],
  ['How do decks work?',
   'Each imported file becomes its own deck. Manage decks on the Import tab (create, rename, delete) and pick which deck to edit from the dropdown.'],
  ['How do I study more than one deck at once?',
   'On the Study tab, check multiple decks in the list \u2014 they\u2019re studied together as one combined set.'],
  ['What does \u201cFlag for review\u201d do?',
   'While studying, tick \u201cFlag this card for review\u201d to mark tricky cards. Back on the Study picker, turn on \u201cOnly study flagged cards\u201d to drill just those.'],
  ['What is Reverse mode?',
   'Choose Flashcards in the Study picker, then turn on \u201cReverse\u201d to see the answer first and guess the question instead. Reverse applies only to Flashcards, not Matching Pairs or Multiple Choice.'],
  ['What is Tap matching pair?',
   'Matching Pairs is a game on the Study tab. Choose Matching pairs and select exactly one deck. Five questions appear in the left column and their shuffled answers appear in the right. Tap a question and its matching answer; correct pairs dim in green, while incorrect choices briefly change color and reset.'],
  ['Why are some cards applicable for Matching Pairs and others are not?',
   'Matching Pairs uses compact tiles. A card is applicable when both its question and answer fit comfortably inside those tiles at the current screen and font size. Repeated questions or answers may also prevent otherwise applicable cards from appearing together. Every card remains available in Flashcards mode.'],
  ['What is Multiple Choice?',
   'Multiple Choice is a game on the Study tab. Choose Multiple choice and select exactly one deck. Each question receives a correct answer and newly shuffled distractors from other cards in that deck. When an answer contains multiple semicolon-separated bullet items, the game can ask you to choose every correct answer. Results include a score, replay, and an option to review missed questions.'],
  ['Why are some cards applicable for Multiple Choice and others are not?',
   'A card is applicable when its question and answer choices fit comfortably on the screen and the deck contains enough unique, applicable answers to create distractors. For \u201cChoose every correct answer\u201d questions, each bullet item and the generated choices must fit. Every card remains available in Flashcards mode.'],
  ['How does search work?',
   'The search box on the Study tab scans every card\u2019s question and answer across all decks, and studies the matches as a custom set.'],
  ['Can I add colors, shapes, or formatting to cards?',
   'Yes. Card text supports a small, safe formatting syntax: **bold** with double asterisks, *italic* with single asterisks, and line breaks. For color text use {{c:red|your text}} (a color name or #hex). To draw a filled shape use {{shape:circle|#4f46e5|120}} \u2014 the parts are shape, color, and size in pixels. Shapes include circle, square, rectangle, oval, triangle, diamond, pentagon, hexagon, star, and heart. Tip: the Auto-create \u201cColors\u201d and \u201cShapes\u201d decks are built with this syntax, so generate one to see examples.'],
  ['How do I share a deck with a contact?',
   'On the Study tab, swipe a deck to the left (or hover it on a computer) to reveal Share, then tap Share. On iPhone or Android the share sheet opens so you can send the deck as a file via AirDrop, Messages, email, and more. On a computer the deck downloads as a .json file that you can then attach and send.'],
  ['How do I add a deck that was shared with me?',
   'Save the .json file you received, then open the app, go to the Import tab, tap \u201cImport file\u2026\u201d, and choose that file. The whole deck \u2014 its name and all cards \u2014 is added to your decks. On iPhone you can also open the file and choose to open it in Flashcards.'],
  ['How do I install it on my iPhone?',
   'Open the app in Safari, tap the Share button, then \u201cAdd to Home Screen\u201d.'],
  ['How do I get updates?',
   'Fully close the home-screen app and reopen it (once or twice). Your decks and settings are always preserved across updates.'],
];

function renderFaq() {
  const wrap = document.getElementById('faq');
  wrap.innerHTML = '';
  for (const [q, a] of FAQ) {
    const d = document.createElement('details');
    d.className = 'faq-item';
    const s = document.createElement('summary');
    s.textContent = q;
    const p = document.createElement('p');
    p.textContent = a;
    d.appendChild(s);
    d.appendChild(p);
    wrap.appendChild(d);
  }
}

function renderPrivacy() {
  const el = document.getElementById('privacy');
  el.innerHTML = `
    <p><strong>Your privacy is simple: nothing you enter leaves your device.</strong></p>
    <ul>
      <li><strong>No data collection.</strong> This app has no accounts, no sign-in, no analytics, and no tracking of any kind.</li>
      <li><strong>Your questions &amp; answers stay local.</strong> Every deck and card you create or import is stored only in your browser\u2019s local storage on this device. It is never uploaded, transmitted, or shared.</li>
      <li><strong>Profiles are local too.</strong> Adding a profile simply creates a separate space on this device. There are still no accounts, logins, or passwords, and each profile\u2019s decks and settings never leave your phone.</li>
      <li><strong>Files are processed on-device.</strong> When you import a .docx, .csv, or .json, it is read entirely within the app on your phone. The file\u2019s contents are not sent anywhere.</li>
      <li><strong>No servers, no cookies.</strong> The app is a static page served over HTTPS and then cached for offline use. It makes no background network calls with your data.</li>
      <li><strong>You are in control.</strong> Delete a card, clear a deck, or remove the app to erase your data at any time. Uninstalling or clearing your browser storage permanently deletes everything.</li>
      <li><strong>Sharing is user-initiated.</strong> Nothing is shared unless you tap <em>Share</em> on a deck. Then that deck (its name and cards) is handed to whatever destination <em>you</em> pick — AirDrop, Messages, email, or a saved file. The app has no access to where it goes, and it only leaves your device because you chose to send it.</li>
      <li><strong>Feedback is optional and separate.</strong> If you choose to send feedback, it opens GitHub in a new tab; only what you type there is shared, and only because you chose to send it.</li>
    </ul>
    <p class="privacy-foot">Because all data is stored locally, no one \u2014 including the developer \u2014 can see your decks or study activity.</p>
  `;
}


/* ---------- Import/Create: editing ---------- */
function updateCount() { document.getElementById('card-count').textContent = activeDeck().cards.length; }

document.getElementById('save-btn').addEventListener('click', () => {
  const parsed = parseInput(document.getElementById('bulk-input').value).filter(p => !isHeaderPair(p));
  activeDeck().cards = parsed;
  save();
  renderDeckOptions();
  updateCount();
  setStatus(`Saved ${parsed.length} card${parsed.length === 1 ? '' : 's'}.`);
});

/* ---------- Auto-generate a deck from a topic (offline packs) ---------- */
(function initGenerator() {
  const listEl = document.getElementById('gen-topic-list');
  if (listEl && window.TOPIC_PACKS) {
    listEl.textContent = window.TOPIC_PACKS.map(p => p.name).join(' · ');
  }
  const form = document.getElementById('gen-form');
  if (!form) return;
  const statusEl = document.getElementById('gen-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const topic = document.getElementById('gen-topic').value.trim();
    const count = parseInt(document.getElementById('gen-count').value, 10) || 0;
    if (!topic) { setGenStatus('Type a topic first (e.g. Animals).', false); return; }

    const pack = window.matchTopic(topic);
    if (!pack) {
      const names = window.TOPIC_PACKS.map(p => p.name).join(', ');
      setGenStatus(`No built-in pack for “${topic}”. Try one of: ${names}.`, false);
      return;
    }

    const cards = pack.cardsFor(count);
    const requested = count > 0 ? count : cards.length;
    const name = uniqueName(pack.name);
    const deck = { id: uid(), name, cards };
    state.decks.push(deck);
    state.activeId = deck.id;
    save();
    renderDeckOptions();
    document.getElementById('bulk-input').value = cardsToText(cards);
    updateCount();

    const capped = requested > cards.length
      ? ` (that pack only has ${cards.length})`
      : '';
    setGenStatus(`Created “${name}” with ${cards.length} card${cards.length === 1 ? '' : 's'}${capped}. Ready to study!`);
    document.getElementById('gen-topic').value = '';
  });

  function setGenStatus(msg, ok = true) {
    statusEl.style.color = ok ? '#4ade80' : 'var(--danger)';
    statusEl.textContent = msg;
    if (msg && ok) setTimeout(() => { if (statusEl.textContent === msg) statusEl.textContent = ''; }, 6000);
  }
})();

document.getElementById('clear-btn').addEventListener('click', () => {
  if (!confirm('Clear all cards in this deck?')) return;
  activeDeck().cards = [];
  save();
  renderDeckOptions();
  updateCount();
  document.getElementById('bulk-input').value = '';
  setStatus('Deck cleared.', false);
});

function deckFilename(d) { return `${d.name.replace(/[^\w.-]+/g, '_')}.json`; }
function deckJSON(d) { return JSON.stringify({ name: d.name, cards: d.cards }, null, 2); }

function downloadDeck(d) {
  const blob = new Blob([deckJSON(d)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = deckFilename(d);
  a.click();
  URL.revokeObjectURL(a.href);
}

// Share a deck as a .json file via the native share sheet (iOS/Android),
// falling back to a download on platforms without Web Share file support (desktop).
async function shareDeck(d) {
  const file = new File([deckJSON(d)], deckFilename(d), { type: 'application/json' });
  const shareData = { files: [file], title: d.name, text: `Flashcards deck: “${d.name}” (${d.cards.length} cards)` };
  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err && err.name !== 'AbortError') downloadDeck(d); // real failure -> fallback
    }
    return;
  }
  // No Web Share (file) support: download the .json so the user can attach/send it.
  downloadDeck(d);
  toast(`“${d.name}” saved as a file — attach it in your email or messaging app to share.`);
}

document.getElementById('export-btn').addEventListener('click', () => downloadDeck(activeDeck()));

/* ---------- File import ---------- */
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  setStatus(`Reading ${file.name}…`);
  try {
    const { cards, method, suggestedName } = await importFile(file);
    if (!cards || cards.length === 0) {
      setStatus(`No cards found in ${file.name}. If it's a scanned/image file, the text can't be read.`, false);
      fileInput.value = '';
      return;
    }
    const deckName = uniqueName((suggestedName && suggestedName.trim()) || baseName(file.name) || 'Imported');
    const d = { id: uid(), name: deckName, cards };
    state.decks.push(d);
    state.activeId = d.id;
    save();
    renderDeckOptions();
    document.getElementById('bulk-input').value = cardsToText(cards);
    updateCount();
    setStatus(`Imported ${cards.length} cards into “${deckName}” (${method}).`);
  } catch (err) {
    setStatus(err.message || 'Could not read that file.', false);
  }
  fileInput.value = '';
});

/* ---------- Install hint (iOS Safari) ---------- */
function maybeShowInstallBanner() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const dismissed = localStorage.getItem('flashcards.installDismissed') === '1';
  if (isIOS && !standalone && !dismissed) document.getElementById('install-banner').classList.remove('hidden');
}
document.getElementById('install-dismiss').addEventListener('click', () => {
  document.getElementById('install-banner').classList.add('hidden');
  localStorage.setItem('flashcards.installDismissed', '1');
});

/* ---------- Theme (mode + accent) ---------- */
function getTheme() { return localStorage.getItem(K('theme')) || 'system'; }
function getAccent() { return localStorage.getItem(K('accent')) || 'indigo'; }

function applyTheme() {
  const mode = getTheme();
  const accent = getAccent();
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.setAttribute('data-accent', accent);
  document.querySelectorAll('#theme-mode .seg').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === mode));
  document.querySelectorAll('#accent-swatches .swatch').forEach(b =>
    b.classList.toggle('active', b.dataset.accent === accent));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const dark = mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    meta.setAttribute('content', dark ? '#0f172a' : '#f8fafc');
  }
}

document.querySelectorAll('#theme-mode .seg').forEach(b =>
  b.addEventListener('click', () => { localStorage.setItem(K('theme'), b.dataset.mode); applyTheme(); }));
document.querySelectorAll('#accent-swatches .swatch').forEach(b =>
  b.addEventListener('click', () => { localStorage.setItem(K('accent'), b.dataset.accent); applyTheme(); }));

// React to OS light/dark changes while on "System".
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getTheme() === 'system') applyTheme();
});

/* ---------- Profiles UI ---------- */
function profileInitial(p) { return ((p.name || '').trim()[0] || '?').toUpperCase(); }

function renderProfileButton() {
  const p = activeProfile();
  const btn = document.getElementById('profile-btn');
  if (!btn || !p) return;
  btn.style.background = p.color;
  btn.textContent = profileInitial(p);
  btn.setAttribute('title', 'Profile: ' + p.name);
  btn.setAttribute('aria-label', 'Profile: ' + p.name + '. Tap to switch profiles.');
}

function renderProfileList() {
  const ul = document.getElementById('profile-list');
  if (!ul) return;
  const canDelete = profiles.profiles.length > 1;
  ul.innerHTML = '';
  for (const p of profiles.profiles) {
    const li = document.createElement('li');
    li.className = 'profile-row' + (p.id === profiles.activeId ? ' active' : '');
    li.innerHTML =
      '<button class="profile-pick" data-id="' + p.id + '">' +
        '<span class="avatar" style="background:' + p.color + '">' + escapeHtml(profileInitial(p)) + '</span>' +
        '<span class="pname">' + escapeHtml(p.name) + '</span>' +
        (p.id === profiles.activeId ? '<span class="active-check" aria-label="Active">\u2713</span>' : '') +
      '</button>' +
      '<button class="row-act color" data-id="' + p.id + '" style="color:' + p.color + '" title="Change color" aria-label="Change color">\u25CF</button>' +
      '<button class="row-act rename" data-id="' + p.id + '" title="Rename" aria-label="Rename">\u270E</button>' +
      (canDelete ? '<button class="row-act delete" data-id="' + p.id + '" title="Delete" aria-label="Delete">\u2715</button>' : '');
    ul.appendChild(li);
  }
}

function openProfiles() { renderProfileList(); document.getElementById('profiles-modal').classList.remove('hidden'); }
function closeProfiles() { document.getElementById('profiles-modal').classList.add('hidden'); }

function switchProfile(pid) {
  if (pid === profiles.activeId) { closeProfiles(); return; }
  profiles.activeId = pid;
  saveProfiles();
  location.reload(); // clean reload so the pre-paint theme + decks load for the new profile
}

function addProfile() {
  const name = prompt('Name for the new profile:');
  if (!name || !name.trim()) return;
  const pid = uid();
  profiles.profiles.push({ id: pid, name: name.trim().slice(0, 24), color: nextProfileColor() });
  profiles.activeId = pid;
  saveProfiles();
  location.reload();
}

function renameProfile(pid) {
  const p = profiles.profiles.find(x => x.id === pid);
  if (!p) return;
  const name = prompt('Rename profile:', p.name);
  if (!name || !name.trim()) return;
  p.name = name.trim().slice(0, 24);
  saveProfiles();
  renderProfileList();
  renderProfileButton();
}

function cycleProfileColor(pid) {
  const p = profiles.profiles.find(x => x.id === pid);
  if (!p) return;
  const i = PROFILE_COLORS.indexOf(p.color);
  p.color = PROFILE_COLORS[(i + 1) % PROFILE_COLORS.length];
  saveProfiles();
  renderProfileList();
  if (pid === profiles.activeId) renderProfileButton();
}

function deleteProfile(pid) {
  if (profiles.profiles.length <= 1) return;
  const p = profiles.profiles.find(x => x.id === pid);
  if (!p) return;
  if (!confirm('Delete profile \u201c' + p.name + '\u201d and all of its decks on this device? This cannot be undone.')) return;
  profiles.profiles = profiles.profiles.filter(x => x.id !== pid);
  deleteProfileData(pid);
  if (profiles.activeId === pid) {
    profiles.activeId = profiles.profiles[0].id;
    saveProfiles();
    location.reload();
    return;
  }
  saveProfiles();
  renderProfileList();
}

function initProfiles() {
  renderProfileButton();
  document.getElementById('profile-btn').addEventListener('click', openProfiles);
  document.getElementById('profiles-close').addEventListener('click', closeProfiles);
  document.getElementById('add-profile-btn').addEventListener('click', addProfile);
  const modal = document.getElementById('profiles-modal');
  modal.addEventListener('click', (e) => { if (e.target === modal) closeProfiles(); });
  document.getElementById('profile-list').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const id = b.dataset.id;
    if (b.classList.contains('profile-pick')) switchProfile(id);
    else if (b.classList.contains('color')) cycleProfileColor(id);
    else if (b.classList.contains('rename')) renameProfile(id);
    else if (b.classList.contains('delete')) deleteProfile(id);
  });
}

/* ---------- Boot ---------- */
loadProfiles();
load();
ensureSamples();
const _removedHeaders = cleanupHeaderCards();
save();
applyTheme();
initPrefs();
initProfiles();
initTips();
renderFaq();
renderPrivacy();
const _ver = document.querySelector('.settings-version');
if (_ver) _ver.textContent = 'Flashcard Flipper ' + APP_VERSION + ' \u00b7 offline PWA';
renderDeckOptions();
updateCount();
showView('home');
if (prefBool(PREF.tipsStartup, true)) openStartupTip();
maybeShowInstallBanner();
if (_removedHeaders) {
  setTimeout(() => toast(`Removed ${_removedHeaders} column-header row${_removedHeaders > 1 ? 's' : ''} from your decks.`), 900);
}

if ('serviceWorker' in navigator) {
  // Reload once when a new service worker takes control, so updates apply immediately.
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(reg => {
      // Check for a new version now and whenever the app regains focus.
      reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
      // If an updated worker is waiting, ask it to activate right away.
      function promote(w) {
        if (w && w.state === 'installed' && navigator.serviceWorker.controller) {
          w.postMessage('skipWaiting');
        }
      }
      if (reg.waiting) reg.waiting.postMessage('skipWaiting');
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (nw) nw.addEventListener('statechange', () => promote(nw));
      });
    }).catch(() => {});
  });
}
