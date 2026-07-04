import { PGlite } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js';
import { SEED_SQL, SCHEMA_INFO } from './seed.js';
import { TOPICS, ALL_CHALLENGES, LEVEL_NAMES } from './challenges.js';

// ---------- State ----------
let db = null;
let current = ALL_CHALLENGES[0];
const PROGRESS_KEY = 'pg_master_progress_v1';
let progress = loadProgress();

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch { return {}; }
}
function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// ---------- Database ----------
async function initDb() {
  db = new PGlite();
  await db.exec(SEED_SQL);
}
async function resetDb() {
  await db.exec(SEED_SQL);
}

// Run arbitrary SQL, return {rows, fields} of the LAST statement (array row mode).
async function runSql(sql) {
  const results = await db.exec(sql, { rowMode: 'array' });
  return results[results.length - 1];
}

// Normalize a value for comparison (numbers, dates, json all -> canonical string)
function norm(v) {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'number') {
    // trim floating noise
    return (Math.round(v * 1e6) / 1e6).toString();
  }
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v).trim();
  // numeric-looking strings -> canonical number
  if (/^-?\d+(\.\d+)?$/.test(s)) return (Math.round(parseFloat(s) * 1e6) / 1e6).toString();
  return s;
}

function rowKey(row) { return row.map(norm).join('§'); }

function compareResults(userRes, refRes, ordered) {
  const u = userRes?.rows || [];
  const r = refRes?.rows || [];
  if (u.length !== r.length) {
    return { ok: false, reason: `Expected ${r.length} row(s), your query returned ${u.length}.` };
  }
  const uCols = (u[0] || []).length;
  const rCols = (r[0] || []).length;
  if (u.length > 0 && uCols !== rCols) {
    return { ok: false, reason: `Expected ${rCols} column(s), your query returned ${uCols}.` };
  }
  if (ordered) {
    for (let i = 0; i < r.length; i++) {
      if (rowKey(u[i]) !== rowKey(r[i])) {
        return { ok: false, reason: `Row ${i + 1} differs. Order matters for this challenge.` };
      }
    }
  } else {
    const ub = {}, rb = {};
    for (const row of u) { const k = rowKey(row); ub[k] = (ub[k] || 0) + 1; }
    for (const row of r) { const k = rowKey(row); rb[k] = (rb[k] || 0) + 1; }
    for (const k of Object.keys(rb)) {
      if (ub[k] !== rb[k]) return { ok: false, reason: 'The set of rows does not match the expected answer.' };
    }
    for (const k of Object.keys(ub)) {
      if (rb[k] === undefined) return { ok: false, reason: 'Your result contains unexpected rows.' };
    }
  }
  return { ok: true };
}

// ---------- Grading ----------
async function gradeQuery(userSql, ch) {
  // Query challenges: run user + reference on the same (current) db state.
  await resetDb();
  const refRes = await runSql(ch.solution);
  await resetDb();
  let userRes;
  try { userRes = await runSql(userSql); }
  catch (e) { return { ok: false, reason: 'SQL error: ' + e.message, userRes: null }; }
  const cmp = compareResults(userRes, refRes, ch.ordered);
  return { ...cmp, userRes };
}

async function gradeMutation(userSql, ch) {
  // Mutation: apply on fresh db, run the check; compare to reference check.
  await resetDb();
  let refCheck;
  try {
    await db.exec(ch.solution);
    refCheck = await runSql(ch.check);
  } catch (e) {
    return { ok: false, reason: 'Reference error (report this): ' + e.message, userRes: null };
  }
  await resetDb();
  let userCheck;
  try {
    await db.exec(userSql);
    userCheck = await runSql(ch.check);
  } catch (e) {
    return { ok: false, reason: 'SQL error: ' + e.message, userRes: null };
  }
  const cmp = compareResults(userCheck, refCheck, false);
  return { ...cmp, userRes: userCheck, isCheck: true };
}

// ---------- Rendering ----------
function renderSidebar() {
  const nav = $('#topics');
  nav.innerHTML = '';
  for (const topic of TOPICS) {
    const done = topic.challenges.filter(c => progress[c.id]).length;
    const total = topic.challenges.length;

    const wrap = el('div', 'topic');
    const head = el('button', 'topic-head');
    head.innerHTML = `<span class="topic-name">${topic.name}</span>
      <span class="topic-count ${done === total ? 'complete' : ''}">${done}/${total}</span>`;
    const list = el('div', 'topic-list');
    if (topic.id !== current.topicId) list.style.display = 'none';

    head.onclick = () => {
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    };

    for (const ch of topic.challenges) {
      const item = el('button', 'ch-item' + (ch.id === current.id ? ' active' : ''));
      const solved = progress[ch.id];
      item.innerHTML = `<span class="ch-dot ${solved ? 'solved' : ''}">${solved ? '✓' : ''}</span>
        <span class="ch-title">${ch.title}</span>
        <span class="ch-lvl lvl-${ch.level}">${'●'.repeat(ch.level)}</span>`;
      item.onclick = () => selectChallenge(ch.id);
      list.appendChild(item);
    }
    wrap.appendChild(head);
    wrap.appendChild(list);
    nav.appendChild(wrap);
  }
  const solvedCount = Object.keys(progress).length;
  $('#overall').textContent = `${solvedCount} / ${ALL_CHALLENGES.length} solved`;
  $('#overall-bar').style.width = `${(solvedCount / ALL_CHALLENGES.length) * 100}%`;
}

let learnOpen = localStorage.getItem('pg_learn_open') !== '0';

function renderLearn() {
  const box = $('#learn-card');
  box.innerHTML = '';
  const topic = TOPICS.find(t => t.id === current.topicId);
  if (!topic || !topic.learn) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  const learn = topic.learn;

  const head = el('button', 'learn-head');
  head.innerHTML = `<span class="learn-title">📚 Concepts to learn · <b>${topic.name.replace(/^\d+ · /, '')}</b></span>
    <span class="learn-toggle">${learnOpen ? 'Hide ▲' : `Show ${learn.concepts.length} ideas ▼`}</span>`;
  head.onclick = () => {
    learnOpen = !learnOpen;
    localStorage.setItem('pg_learn_open', learnOpen ? '1' : '0');
    renderLearn();
  };
  box.appendChild(head);

  const body = el('div', 'learn-body');
  body.style.display = learnOpen ? 'block' : 'none';
  if (learn.summary) body.appendChild(el('p', 'learn-summary', learn.summary));
  const grid = el('div', 'concept-grid');
  for (const c of learn.concepts) {
    const card = el('div', 'concept');
    card.appendChild(el('div', 'concept-name', c.name));
    card.appendChild(el('div', 'concept-detail', c.detail));
    if (c.example) card.appendChild(el('code', 'concept-ex', c.example));
    grid.appendChild(card);
  }
  body.appendChild(grid);
  box.appendChild(body);
}

function renderChallenge() {
  const ch = current;
  renderLearn();
  $('#ch-topic').textContent = ch.topicName;
  $('#ch-title').textContent = ch.title;
  $('#ch-level').textContent = `${LEVEL_NAMES[ch.level]} ${'●'.repeat(ch.level)}${'○'.repeat(5 - ch.level)}`;
  $('#ch-level').className = `badge lvl-${ch.level}`;
  $('#ch-prompt').textContent = ch.prompt;
  $('#ch-solved').style.display = progress[ch.id] ? 'inline-flex' : 'none';
  $('#hint').style.display = 'none';
  $('#hint').textContent = '💡 ' + ch.hint;
  $('#solution').style.display = 'none';
  $('#solution').textContent = ch.solution;
  $('#result').innerHTML = '';
  $('#editor').value = progress[ch.id]?.sql || '';
  $('#editor').focus();
}

function selectChallenge(id) {
  current = ALL_CHALLENGES.find(c => c.id === id);
  renderSidebar();
  renderChallenge();
  closeNav(); // collapse the drawer on small screens after picking
}

function openNav() { $('#app').classList.add('nav-open'); }
function closeNav() { $('#app').classList.remove('nav-open'); }
function toggleNav() { $('#app').classList.toggle('nav-open'); }

function renderTable(res, title) {
  if (!res || !res.rows) return el('div', 'muted', 'No rows.');
  const box = el('div', 'table-box');
  if (title) box.appendChild(el('div', 'table-title', title));
  if (res.rows.length === 0) {
    box.appendChild(el('div', 'muted', '(0 rows returned)'));
    return box;
  }
  const table = el('table');
  const thead = el('thead');
  const htr = el('tr');
  for (const f of res.fields) htr.appendChild(el('th', null, f.name));
  thead.appendChild(htr);
  table.appendChild(thead);
  const tbody = el('tbody');
  for (const row of res.rows.slice(0, 100)) {
    const tr = el('tr');
    for (const cell of row) {
      const td = el('td');
      td.textContent = cell === null ? 'NULL' : (typeof cell === 'object' ? JSON.stringify(cell) : cell);
      if (cell === null) td.className = 'null-cell';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  box.appendChild(table);
  if (res.rows.length > 100) box.appendChild(el('div', 'muted', `Showing first 100 of ${res.rows.length} rows.`));
  return box;
}

function showResult(node) {
  const r = $('#result');
  r.innerHTML = '';
  r.appendChild(node);
}

// ---------- Actions ----------
async function onRun() {
  const sql = $('#editor').value.trim();
  if (!sql) return;
  setBusy(true);
  await resetDb();
  try {
    const res = await runSql(sql);
    showResult(renderTable(res, 'Result'));
  } catch (e) {
    showResult(el('div', 'banner error', 'SQL error: ' + e.message));
  } finally {
    setBusy(false);
  }
}

async function onCheck() {
  const sql = $('#editor').value.trim();
  if (!sql) return;
  setBusy(true);
  const ch = current;
  try {
    const res = ch.type === 'mutation' ? await gradeMutation(sql, ch) : await gradeQuery(sql, ch);
    const wrap = el('div');
    if (res.ok) {
      progress[ch.id] = { sql, at: Date.now() };
      saveProgress();
      wrap.appendChild(el('div', 'banner success', '✓ Correct! Challenge solved.'));
      renderSidebar();
      $('#ch-solved').style.display = 'inline-flex';
    } else {
      wrap.appendChild(el('div', 'banner error', '✗ Not quite — ' + res.reason));
    }
    if (res.userRes) wrap.appendChild(renderTable(res.userRes, res.isCheck ? 'Verification query result' : 'Your result'));
    showResult(wrap);
  } catch (e) {
    showResult(el('div', 'banner error', 'Error: ' + e.message));
  } finally {
    setBusy(false);
  }
}

function setBusy(b) {
  $('#run').disabled = b;
  $('#check').disabled = b;
  $('#run').textContent = b ? '…' : 'Run ▶';
}

function goRelative(delta) {
  const idx = ALL_CHALLENGES.findIndex(c => c.id === current.id);
  const next = ALL_CHALLENGES[idx + delta];
  if (next) selectChallenge(next.id);
}

function renderSchema() {
  const box = $('#schema-content');
  box.innerHTML = '';
  for (const t of SCHEMA_INFO) {
    const d = el('div', 'schema-table');
    d.appendChild(el('div', 'schema-name', t.table));
    d.appendChild(el('div', 'schema-cols', t.columns.join(', ')));
    box.appendChild(d);
  }
}

// ---------- Boot ----------
async function boot() {
  renderSchema();
  try {
    await initDb();
    $('#loading').style.display = 'none';
    $('#app').style.display = 'flex';
    renderSidebar();
    renderChallenge();
  } catch (e) {
    $('#loading').innerHTML = `<div class="banner error">Failed to load PostgreSQL engine: ${e.message}<br>Check your internet connection (PGlite loads from a CDN) and reload.</div>`;
    return;
  }

  $('#menu-toggle').onclick = toggleNav;
  $('#overlay').onclick = closeNav;
  $('#run').onclick = onRun;
  $('#check').onclick = onCheck;
  $('#btn-hint').onclick = () => {
    const h = $('#hint');
    h.style.display = h.style.display === 'none' ? 'block' : 'none';
  };
  $('#btn-solution').onclick = () => {
    const s = $('#solution');
    s.style.display = s.style.display === 'none' ? 'block' : 'none';
  };
  $('#btn-reset').onclick = () => { $('#editor').value = ''; $('#editor').focus(); };
  $('#prev').onclick = () => goRelative(-1);
  $('#next').onclick = () => goRelative(1);
  $('#toggle-schema').onclick = () => {
    const p = $('#schema-panel');
    p.classList.toggle('open');
  };
  $('#reset-progress').onclick = () => {
    if (confirm('Reset all progress? This clears every solved challenge.')) {
      progress = {}; saveProgress(); renderSidebar(); renderChallenge();
    }
  };

  // Keyboard: Ctrl/Cmd+Enter runs, Shift+Enter checks; Tab inserts spaces.
  const editor = $('#editor');
  editor.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onRun(); }
    else if (e.shiftKey && e.key === 'Enter') { e.preventDefault(); onCheck(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart, en = editor.selectionEnd;
      editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(en);
      editor.selectionStart = editor.selectionEnd = s + 2;
    }
  });
}

boot();
