'use strict';

/* ============================================================
   Storage model (multi-deck)
   localStorage["flashcards.data.v2"] = {
     decks: [{ id, name, cards: [{q,a}] }],
     activeId: "<deckId>"
   }
   Legacy v1 (single list under flashcards.cards.v1) is migrated.
============================================================ */
const STORE_KEY = 'flashcards.data.v2';
const LEGACY_KEY = 'flashcards.cards.v1';
const SAMPLES_FLAG = 'flashcards.samplesSeeded';

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
let order = [];
let pos = 0;

/* ---------- Persistence ---------- */
function uid() { return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
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

function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function activeDeck() { return state.decks.find(d => d.id === state.activeId) || state.decks[0]; }

// Seed the built-in sample decks a single time (skips any that already exist by name).
function ensureSamples() {
  if (localStorage.getItem(SAMPLES_FLAG) === '1') return;
  const existing = new Set(state.decks.map(d => d.name.toLowerCase()));
  for (const s of SAMPLE_DECKS) {
    if (!existing.has(s.name.toLowerCase())) {
      state.decks.push({ id: uid(), name: s.name, cards: s.cards.map(c => ({ q: c.q, a: c.a })) });
    }
  }
  localStorage.setItem(SAMPLES_FLAG, '1');
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

function isHeaderPair(p) {
  const q = p.q.toLowerCase(), a = p.a.toLowerCase();
  const qh = /^(question|word|word or phrase|term|front|q)$/.test(q);
  const ah = /^(answer|definition|one-sentence definition|meaning|back|a)$/.test(a);
  return qh && ah;
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
  const tableCards = [];
  const lines = [];

  const walkBody = (parent) => {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType !== 1) continue;
      if (node.tagName === 'w:tbl') {
        for (const row of Array.from(node.getElementsByTagName('w:tr'))) {
          const cells = Array.from(row.getElementsByTagName('w:tc'));
          if (cells.length >= 2) {
            const q = nodeText(cells[0]).replace(/\s+/g, ' ').trim();
            const a = nodeText(cells[1]).replace(/\s+/g, ' ').trim();
            const pair = { q, a };
            if (q && a && !isHeaderPair(pair)) tableCards.push(pair);
          }
        }
      } else if (node.tagName === 'w:p') {
        const txt = nodeText(node).replace(/[ \t]+/g, ' ').trim();
        if (txt) lines.push(txt);
      }
    }
  };
  walkBody(body);
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

function showView(name) {
  document.getElementById('settings-view').classList.remove('active');
  Object.entries(views).forEach(([k, el]) => el.classList.toggle('active', k === name));
  tabs.forEach(t => t.classList.toggle('active', t.dataset.view === name));
  if (name !== 'study') stopTimer();
  if (name === 'study') openDeckPicker();
  if (name === 'edit') { renderDeckOptions(); document.getElementById('bulk-input').value = cardsToText(activeDeck().cards); updateCount(); }
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
    opt.textContent = `${d.name} (${d.cards.length})`;
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

function openDeckPicker() {
  studyArea.classList.add('hidden');
  deckPicker.classList.remove('hidden');
  stopTimer();
  timerEl.classList.add('hidden');
  const ss = document.getElementById('search-status');
  if (ss) ss.textContent = '';
  renderDeckList();
}

function renderDeckList() {
  const anyCards = state.decks.some(d => d.cards.length > 0);
  document.getElementById('picker-empty').classList.toggle('hidden', anyCards);
  document.getElementById('picker-controls').classList.toggle('hidden', !anyCards);
  deckListEl.classList.toggle('hidden', !anyCards);

  deckListEl.innerHTML = '';
  const preselect = studyDeckIds.length ? studyDeckIds : [state.activeId];
  for (const d of state.decks) {
    const flagged = d.cards.filter(c => c.flagged).length;
    const li = document.createElement('li');
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
    li.appendChild(label);
    deckListEl.appendChild(li);
  }
  updateFlaggedTotal();
}

function updateFlaggedTotal() {
  const total = state.decks.reduce((n, d) => n + d.cards.filter(c => c.flagged).length, 0);
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
});

document.getElementById('start-study-btn').addEventListener('click', () => {
  const ids = [...deckListEl.querySelectorAll('input[type=checkbox]:checked')].map(b => b.value);
  if (ids.length === 0) { alert('Select at least one deck to study.'); return; }
  const onlyFlagged = document.getElementById('only-flagged').checked;
  startStudy(ids, onlyFlagged);
});

document.getElementById('back-to-decks').addEventListener('click', openDeckPicker);

// Search every deck's questions AND answers, then study the matches as a custom set.
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const term = document.getElementById('search-input').value.trim();
  const statusEl = document.getElementById('search-status');
  if (!term) { statusEl.textContent = ''; return; }
  const needle = term.toLowerCase();
  const matches = [];
  for (const d of state.decks) {
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
  questionEl.textContent = reverseMode ? card.a : card.q;
  answerEl.textContent = reverseMode ? card.q : card.a;
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
  sound: 'flashcards.pref.sound',
  timer: 'flashcards.pref.timer',
  font: 'flashcards.pref.font',
};
function prefBool(key, def) { const v = localStorage.getItem(key); return v === null ? def : v === '1'; }

/* ---- Sound: a soft two-tone "ding" via Web Audio (no asset, offline) ---- */
let audioCtx = null;
function playDing() {
  if (!prefBool(PREF.sound, false)) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    gain.connect(audioCtx.destination);
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);       // A5
    osc.frequency.setValueAtTime(1318.5, now + 0.09); // E6
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.36);
  } catch (e) { /* ignore audio errors */ }
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
   Help Center (FAQ) + Privacy Policy content
============================================================ */
const FAQ = [
  ['Where is my data stored?',
   'Everything lives on your device in the browser\u2019s local storage. Your decks, cards, flags, and settings never leave your phone.'],
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
   'Turn on \u201cReverse\u201d in the Study picker to see the answer first and guess the question instead.'],
  ['How does search work?',
   'The search box on the Study tab scans every card\u2019s question and answer across all decks, and studies the matches as a custom set.'],
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
      <li><strong>Files are processed on-device.</strong> When you import a .docx, .csv, or .json, it is read entirely within the app on your phone. The file\u2019s contents are not sent anywhere.</li>
      <li><strong>No servers, no cookies.</strong> The app is a static page served over HTTPS and then cached for offline use. It makes no background network calls with your data.</li>
      <li><strong>You are in control.</strong> Delete a card, clear a deck, or remove the app to erase your data at any time. Uninstalling or clearing your browser storage permanently deletes everything.</li>
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

document.getElementById('export-btn').addEventListener('click', () => {
  const d = activeDeck();
  const blob = new Blob([JSON.stringify({ name: d.name, cards: d.cards }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${d.name.replace(/[^\w.-]+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

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
const THEME_KEY = 'flashcards.theme';
const ACCENT_KEY = 'flashcards.accent';

function getTheme() { return localStorage.getItem(THEME_KEY) || 'system'; }
function getAccent() { return localStorage.getItem(ACCENT_KEY) || 'indigo'; }

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
  b.addEventListener('click', () => { localStorage.setItem(THEME_KEY, b.dataset.mode); applyTheme(); }));
document.querySelectorAll('#accent-swatches .swatch').forEach(b =>
  b.addEventListener('click', () => { localStorage.setItem(ACCENT_KEY, b.dataset.accent); applyTheme(); }));

// React to OS light/dark changes while on "System".
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getTheme() === 'system') applyTheme();
});

/* ---------- Boot ---------- */
load();
ensureSamples();
save();
applyTheme();
initPrefs();
renderFaq();
renderPrivacy();
renderDeckOptions();
updateCount();
showView('home');
maybeShowInstallBanner();

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
