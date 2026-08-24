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

let state = { decks: [], activeId: null };
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
      // migrate legacy single deck if present
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

function uniqueName(base) {
  let name = base, n = 2;
  const names = new Set(state.decks.map(d => d.name.toLowerCase()));
  while (names.has(name.toLowerCase())) { name = `${base} (${n++})`; }
  return name;
}

/* ============================================================
   Text / CSV parsing
============================================================ */
// Accepts "q | a", "q - a", "q<TAB>a", or "q,a" (CSV-ish). Blank lines ignored.
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

// Minimal CSV: two columns, supports quoted fields with commas.
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

/* ---------- Layout auto-detection for plain lines ---------- */
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

  // Fallback: alternating question / answer lines
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
   .docx importer (fully offline, no libraries)
   A .docx is a ZIP; we read word/document.xml and inflate it
   with the browser's built-in DecompressionStream.
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
  // locate End Of Central Directory
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
    // Accept {name, cards:[{q,a}]} or [{q,a}] or [[q,a],...]
    let cards = [];
    const arr = Array.isArray(data) ? data : data.cards;
    if (Array.isArray(arr)) {
      cards = arr.map(x => Array.isArray(x) ? { q: String(x[0]), a: String(x[1]) }
                                            : { q: String(x.q ?? x.question ?? ''), a: String(x.a ?? x.answer ?? '') })
                 .filter(c => c.q && c.a);
    }
    return { cards, method: 'json', suggestedName: data.name };
  }
  // .txt / .csv / anything else: treat as text
  const text = await file.text();
  const parsed = parseInput(text);
  if (parsed.length) return { cards: parsed.filter(p => !isHeaderPair(p)), method: 'text' };
  return cardsFromLines(text.split(/\r?\n/));
}

function baseName(fileName) { return fileName.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim(); }

/* ============================================================
   Views + deck UI
============================================================ */
const views = { study: document.getElementById('study-view'), edit: document.getElementById('edit-view') };
const tabs = document.querySelectorAll('.tab');
const deckSelect = document.getElementById('deck-select');
const status = document.getElementById('edit-status');

function setStatus(msg, ok = true) {
  status.style.color = ok ? '#4ade80' : 'var(--danger)';
  status.textContent = msg;
  if (msg) setTimeout(() => { if (status.textContent === msg) status.textContent = ''; }, 4000);
}

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

function showView(name) {
  Object.entries(views).forEach(([k, el]) => el.classList.toggle('active', k === name));
  tabs.forEach(t => t.classList.toggle('active', t.dataset.view === name));
  if (name === 'study') renderStudy();
  if (name === 'edit') document.getElementById('bulk-input').value = cardsToText(activeDeck().cards);
}

tabs.forEach(t => t.addEventListener('click', () => showView(t.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => showView(b.dataset.goto)));

deckSelect.addEventListener('change', () => {
  state.activeId = deckSelect.value;
  save();
  order = [];
  updateCount();
  showView(views.edit.classList.contains('active') ? 'edit' : 'study');
});

document.getElementById('new-deck-btn').addEventListener('click', () => {
  const name = prompt('Name for the new deck:', uniqueName('New deck'));
  if (!name) return;
  const d = { id: uid(), name: uniqueName(name.trim()), cards: [] };
  state.decks.push(d);
  state.activeId = d.id;
  save();
  renderDeckOptions();
  order = [];
  updateCount();
  showView('edit');
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
  if (state.decks.length === 0) state.decks.push({ id: uid(), name: 'My cards', cards: [] });
  state.activeId = state.decks[0].id;
  save();
  renderDeckOptions();
  order = [];
  updateCount();
  showView('study');
});

/* ---------- Study ---------- */
const cardEl = document.getElementById('card');
const questionEl = document.getElementById('card-question');
const answerEl = document.getElementById('card-answer');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');

function buildOrder(shuffle) {
  const cards = activeDeck().cards;
  order = cards.map((_, i) => i);
  if (shuffle) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  pos = 0;
}

function renderStudy() {
  const cards = activeDeck().cards;
  const hasCards = cards.length > 0;
  document.getElementById('empty-state').classList.toggle('hidden', hasCards);
  document.getElementById('study-area').classList.toggle('hidden', !hasCards);
  if (!hasCards) return;
  if (order.length !== cards.length) buildOrder(false);
  if (pos >= order.length) pos = 0;
  showCard();
}

function showCard() {
  const cards = activeDeck().cards;
  const card = cards[order[pos]];
  cardEl.classList.remove('flipped');
  questionEl.textContent = card.q;
  answerEl.textContent = card.a;
  progressText.textContent = `${pos + 1} / ${order.length}`;
  progressFill.style.width = `${((pos + 1) / order.length) * 100}%`;
}

function flip() { cardEl.classList.toggle('flipped'); }
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
  if (!views.study.classList.contains('active')) return;
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
});

/* ---------- Edit ---------- */
function updateCount() { document.getElementById('card-count').textContent = activeDeck().cards.length; renderDeckOptions(); }

document.getElementById('save-btn').addEventListener('click', () => {
  const parsed = parseInput(document.getElementById('bulk-input').value).filter(p => !isHeaderPair(p));
  activeDeck().cards = parsed;
  save();
  buildOrder(false);
  updateCount();
  setStatus(`Saved ${parsed.length} card${parsed.length === 1 ? '' : 's'}.`);
});

document.getElementById('clear-btn').addEventListener('click', () => {
  if (!confirm('Clear all cards in this deck?')) return;
  activeDeck().cards = [];
  save();
  buildOrder(false);
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
      setStatus(`No cards found in ${file.name}. Try a different layout.`, false);
      fileInput.value = '';
      return;
    }
    // Import into a brand-new deck named after the file.
    const deckName = uniqueName((suggestedName && suggestedName.trim()) || baseName(file.name) || 'Imported');
    const d = { id: uid(), name: deckName, cards };
    state.decks.push(d);
    state.activeId = d.id;
    save();
    renderDeckOptions();
    order = [];
    updateCount();
    document.getElementById('bulk-input').value = cardsToText(cards);
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

/* ---------- Boot ---------- */
load();
save();
renderDeckOptions();
updateCount();
showView('study');
maybeShowInstallBanner();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
}
