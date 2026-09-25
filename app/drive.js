/* Drive: shared HTML files with a fixed link and a version history.

   Files and versions live in Supabase (two tables, drive/setup.sql), reached
   straight from the browser with the project's public key - no server, no
   accounts. The key only lets anyone read and add rows, never change or
   delete them, so the history cannot be lost from here.

     drive/config.json       the Supabase project URL and public key
     drive/?<id>             the fixed link: the latest version, as a page
     drive/?<id>&v=<n>       one specific version

     #/s/drive     the file list (a section, like any other shelf)
     #/d/:fileId   one file - open, download, upload, history, restore      */

import { inline, escapeHtml } from './mdlite.js?v=20260925121640';
import * as Theme from './theme.js?v=20260925121640';
import { BACK_ICON, GO_ICON, vtName } from './ui.js?v=20260925121640';

const NAME_KEY = 'educarlos:drive-name';
const MAX_BYTES = 5 * 1024 * 1024;
const ACCENTS = ['#3a8ef0', '#46c08a', '#f0a13a', '#c46fe0', '#e8695f'];

let config = null;

/* ------------------------------------------------------------ storage */

/* Only the uploader's name is remembered, and only as a convenience. */
function myName() { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } }
function rememberName(v) { try { localStorage.setItem(NAME_KEY, v); } catch {} }

/* ----------------------------------------------------------- Supabase */

export async function getDrive() {
  if (!config) {
    const r = await fetch('drive/config.json', { cache: 'no-cache' });
    config = r.ok ? await r.json() : {};
  }
  return config;
}

const ready = (c) => !!(c.supabaseUrl && c.supabaseKey);

async function db(path, { method = 'GET', body } = {}) {
  const c = await getDrive();
  if (!ready(c)) throw new Error('El Drive todavía no está conectado (falta rellenar drive/config.json).');
  const headers = { apikey: c.supabaseKey };
  // Legacy anon keys are JWTs and go in Authorization too; the newer
  // publishable keys must not.
  if (c.supabaseKey.startsWith('eyJ')) headers.Authorization = 'Bearer ' + c.supabaseKey;
  if (body) { headers['Content-Type'] = 'application/json'; headers.Prefer = 'return=minimal'; }
  let r;
  try {
    r = await fetch(c.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/' + path, {
      method, headers, cache: 'no-store', body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('No se ha podido conectar. Comprueba la conexión.');
  }
  if (!r.ok) {
    const err = new Error('El Drive ha respondido ' + r.status + '. '
      + (await r.text().catch(() => '')).slice(0, 160));
    err.status = r.status;
    throw err;
  }
  return r.status === 201 || r.status === 204 ? null : r.json();
}

export async function getFiles() {
  if (!ready(await getDrive())) return [];
  return db('drive_files?select=*&order=created_at');
}

async function getFile(id) {
  const rows = await db('drive_files?select=*&id=eq.' + encodeURIComponent(id));
  if (!rows.length) throw new Error('No hay ningún archivo "' + id + '" en el drive.');
  return rows[0];
}

const META = 'file_id,n,by,note,bytes,restored_from,created_at';

async function getVersions(id) {
  return db('drive_versions?select=' + META + '&file_id=eq.' + encodeURIComponent(id) + '&order=n.desc');
}

async function getHtml(id, n) {
  const rows = await db('drive_versions?select=html&file_id=eq.' + encodeURIComponent(id)
    + (n ? '&n=eq.' + n : '&order=n.desc&limit=1'));
  return rows.length ? rows[0].html : '';
}

/* The next version of a file. Two uploads at once can pick the same number;
   the table refuses the second, and it simply takes the next one. */
async function addVersion(id, html, by, note, restoredFrom = null) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await db('drive_versions?select=n&file_id=eq.' + encodeURIComponent(id) + '&order=n.desc&limit=1');
    const n = (last[0]?.n || 0) + 1;
    try {
      await db('drive_versions', {
        method: 'POST',
        body: { file_id: id, n, by: by || 'Anónimo', note: note || '', html,
                bytes: new Blob([html]).size, restored_from: restoredFrom }
      });
      return n;
    } catch (e) {
      if (e.status !== 409) throw e;
    }
  }
  throw new Error('Hay demasiadas subidas a la vez. Vuelve a intentarlo.');
}

async function createFile(title, html, by, note) {
  const id = slug(title);
  if (!id) throw new Error('Ponle un nombre al archivo.');
  const count = (await getFiles()).length;
  try {
    await db('drive_files', {
      method: 'POST', body: { id, title, accent: ACCENTS[count % ACCENTS.length] }
    });
  } catch (e) {
    throw e.status === 409 ? new Error('Ya hay un archivo que se llama así.') : e;
  }
  await addVersion(id, html, by, note || 'Primera versión');
  return id;
}

function slug(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

/* ------------------------------------------------------------ format */

const fixedUrl = (id, n) => 'drive/?' + encodeURIComponent(id) + (n ? '&v=' + n : '');
const absolute = (rel) => new URL(rel, location.href.split('#')[0]).href;

function when(iso) {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}

function size(bytes) {
  if (!bytes && bytes !== 0) return '';
  return bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + ' KB';
}

/* A version is a row in the database, not a file on the site, so a
   download is made here from its text. */
function download(html, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ------------------------------------------------------------- cards */

function fileCard(file, i, v) {
  return '<a class="course-card" href="#/d/' + encodeURIComponent(file.id) + '"'
    + ' data-rise style="--i:' + i + ';--accent:' + escapeHtml(file.accent || '#3a8ef0') + '">'
    + '<div class="meta"><h2 style="view-transition-name:' + vtName('file', file.id) + '">'
    + inline(file.title) + '</h2>'
    + (file.subtitle ? '<div class="desc">' + inline(file.subtitle) + '</div>' : '')
    + '<span class="tag">' + (v
        ? 'v' + v.n + ' &middot; ' + escapeHtml(v.by) + ' &middot; ' + escapeHtml(when(v.created_at))
        : 'HTML') + '</span></div>'
    + '<span class="go">' + GO_ICON + '</span></a>';
}

/* --------------------------------------------------------- the list */

/* The section page for the drive: every file, then a way to add a new one.
   Called from main.js in place of the generic section. */
export async function viewList(app, sec) {
  const on = ready(await getDrive());
  const files = on ? await getFiles() : [];
  // One small query for every file's latest version, for the cards.
  const latest = new Map();
  if (files.length)
    for (const v of await db('drive_versions?select=' + META + '&order=n.desc'))
      if (!latest.has(v.file_id)) latest.set(v.file_id, v);

  document.documentElement.lang = 'es';
  document.title = sec.title + ' · Educarlos';

  app.innerHTML = '<div class="topbar"><div class="row">'
    + '<a class="back" href="#/" aria-label="Educarlos">' + BACK_ICON + '</a>'
    + '<div class="crumb">Educarlos</div>'
    + '<div class="count">' + files.length + '</div>'
    + Theme.button('es')
    + '</div></div>'
    + '<div class="page has-bar"><div class="wrap">'
    + '<div class="map-head sec-hero">'
    + '<span class="badge" style="view-transition-name:' + vtName('shelf', sec.id) + '">'
    + escapeHtml(sec.badge || '·') + '</span>'
    + '<h1>' + inline(sec.title) + '</h1>'
    + (sec.subtitle ? '<div class="desc">' + inline(sec.subtitle) + '</div>' : '') + '</div>'
    + (on ? '' : '<div class="drv-pending">El Drive todavía no está conectado a su base de datos. '
        + 'En cuanto se rellene <code>drive/config.json</code>, aparecerán aquí los archivos.</div>')
    + '<div class="card-list">'
    + (files.map((f, i) => fileCard(f, i, latest.get(f.id))).join('')
        || (on ? '<div class="empty">Todavía no hay archivos.</div>' : ''))
    + '</div>'
    + (on
        ? '<details class="drv-box drv-new" data-rise>'
          + '<summary>+ Añadir un archivo nuevo</summary>'
          + '<form id="newf" class="drv-form">'
          + '<label>Nombre del archivo<input name="title" required maxlength="60" placeholder="Ej.: Presupuesto 2027"></label>'
          + uploadFields()
          + '<button class="cta" type="submit">Crear archivo</button>'
          + '<div class="drv-msg" role="status"></div>'
          + '</form></details>'
        : '')
    + '</div></div>';

  const form = app.querySelector('#newf');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = form.querySelector('.drv-msg');
    const got = await readForm(form, msg);
    if (!got) return;
    const title = form.title.value.trim();
    busy(form, true);
    say(msg, 'Creando «' + title + '»…');
    try {
      location.hash = '#/d/' + encodeURIComponent(await createFile(title, got.html, got.by, got.note));
    } catch (err) {
      say(msg, err.message || String(err), 'bad');
      busy(form, false);
    }
  });
}

/* --------------------------------------------------------- one file */

export async function viewFile(app, id) {
  const file = await getFile(id);
  const versions = await getVersions(id);
  const cur = versions[0] || null;

  document.documentElement.lang = 'es';
  document.title = file.title + ' · Drive';
  app.style.setProperty('--accent', file.accent || '#3a8ef0');

  const url = absolute(fixedUrl(id));
  const dlName = slug(file.title) || id;

  const rows = versions.map(v => {
    const isCur = v.n === cur.n;
    const meta = [escapeHtml(when(v.created_at)), size(v.bytes)].filter(Boolean).join(' · ');
    const note = v.restored_from
      ? 'Recupera la versión ' + v.restored_from + (v.note ? ' — ' + escapeHtml(v.note) : '')
      : escapeHtml(v.note || '');
    return '<li class="drv-ver' + (isCur ? ' cur' : '') + '">'
      + '<div class="drv-vhead"><span class="drv-n">v' + v.n + '</span>'
      + '<span class="drv-by">' + escapeHtml(v.by || 'Anónimo') + '</span>'
      + (isCur ? '<span class="drv-cur">Actual</span>' : '') + '</div>'
      + '<div class="drv-meta">' + meta + '</div>'
      + (note ? '<div class="drv-note">' + note + '</div>' : '')
      + '<div class="drv-acts">'
      + '<a href="' + escapeHtml(fixedUrl(id, v.n)) + '" target="_blank" rel="noopener">Ver</a>'
      + '<button type="button" data-dl="' + v.n + '">Descargar</button>'
      + (isCur ? '' : '<button type="button" data-restore="' + v.n + '">Recuperar esta</button>')
      + '</div></li>';
  }).join('');

  app.innerHTML = '<div class="topbar"><div class="row">'
    + '<a class="back" href="#/s/drive" aria-label="Todos los archivos">' + BACK_ICON + '</a>'
    + '<div class="crumb">Drive HTML</div>'
    + '<div class="count">' + (cur ? 'v' + cur.n : '') + '</div>'
    + Theme.button('es')
    + '</div></div>'
    + '<div class="page has-bar"><div class="wrap">'
    + '<div class="map-head"><h1 style="view-transition-name:' + vtName('file', id) + '">'
    + inline(file.title) + '</h1>'
    + (cur ? '<div class="facts"><span class="fact">Versión ' + cur.n + '</span>'
        + '<span class="fact">' + escapeHtml(cur.by) + '</span>'
        + '<span class="fact">' + escapeHtml(when(cur.created_at)) + '</span></div>' : '')
    + (file.subtitle ? '<div class="desc">' + inline(file.subtitle) + '</div>' : '') + '</div>'

    + '<div class="pat-block" data-rise><h2>Enlace fijo</h2>'
    + '<div class="drv-url"><code id="u">' + escapeHtml(url) + '</code>'
    + '<button type="button" id="copy">Copiar</button></div>'
    + '<div class="drv-btns">'
    + '<a class="cta" href="' + escapeHtml(fixedUrl(id)) + '" target="_blank" rel="noopener">Abrir</a>'
    + (cur ? '<button class="cta ghost" type="button" data-dl="' + cur.n + '">Descargar</button>' : '')
    + '</div></div>'

    + '<div class="pat-block" data-rise><h2>Vista previa</h2>'
    // Sandboxed without same-origin: an uploaded page runs its scripts, but
    // cannot reach this origin.
    + '<iframe class="drv-frame" id="pv" sandbox="allow-scripts allow-popups allow-forms" title="Vista previa de ' + escapeHtml(file.title) + '"></iframe></div>'

    + '<div class="pat-block" data-rise><h2>Subir una versión nueva</h2>'
    + '<form id="up" class="drv-form drv-box">'
    + uploadFields()
    + '<button class="cta" type="submit">Subir versión</button>'
    + '<div class="drv-msg" role="status"></div>'
    + '</form></div>'

    + '<div class="pat-block" data-rise><h2>Historial</h2>'
    + (rows ? '<ol class="drv-hist">' + rows + '</ol>' : '<div class="empty">Sin versiones todavía.</div>')
    + '<div class="drv-msg" id="hmsg" role="status"></div></div>'
    + '</div></div>';

  if (cur) getHtml(id).then(h => { app.querySelector('#pv').srcdoc = h; }).catch(() => {});

  app.querySelector('#copy').addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(url); e.target.textContent = 'Copiado'; }
    catch { getSelection().selectAllChildren(app.querySelector('#u')); }
  });

  const hmsg = app.querySelector('#hmsg');
  app.querySelectorAll('[data-dl]').forEach(btn => btn.addEventListener('click', async () => {
    const n = Number(btn.dataset.dl);
    try { download(await getHtml(id, n), dlName + (n === cur.n ? '' : '-v' + n) + '.html'); }
    catch (err) { say(hmsg, err.message || String(err), 'bad'); }
  }));

  const form = app.querySelector('#up');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = form.querySelector('.drv-msg');
    const got = await readForm(form, msg);
    if (!got) return;
    busy(form, true);
    say(msg, 'Subiendo…');
    try {
      await addVersion(id, got.html, got.by, got.note);
      viewFile(app, id);
    } catch (err) {
      say(msg, err.message || String(err), 'bad');
      busy(form, false);
    }
  });

  app.querySelectorAll('[data-restore]').forEach(btn => btn.addEventListener('click', async () => {
    const n = Number(btn.dataset.restore);
    const v = versions.find(x => x.n === n);
    if (!confirm('¿Recuperar la versión ' + n + ' de ' + (v.by || 'Anónimo') + '?\n\n'
      + 'Se publicará como versión nueva. No se borra nada: la actual sigue en el historial.')) return;
    btn.disabled = true;
    say(hmsg, 'Recuperando la versión ' + n + '…');
    try {
      await addVersion(id, await getHtml(id, n), myName(), '', n);
      viewFile(app, id);
    } catch (err) {
      say(hmsg, err.message || String(err), 'bad');
      btn.disabled = false;
    }
  }));
}

/* ------------------------------------------------------- form pieces */

function uploadFields() {
  return '<label>Archivo HTML<input name="file" type="file" accept=".html,.htm,text/html" required></label>'
    + '<label><span>Tu nombre <span class="opt">(opcional)</span></span><input name="by" maxlength="40" autocomplete="name" value="' + escapeHtml(myName()) + '" placeholder="Saldrá en el historial"></label>'
    + '<label><span>Qué has cambiado <span class="opt">(opcional)</span></span><input name="note" maxlength="200" placeholder="Ej.: añadidas las fechas de octubre"></label>';
}

async function readForm(form, msg) {
  const f = form.file.files[0];
  if (!f) { say(msg, 'Elige un archivo .html.', 'bad'); return null; }
  if (!/\.html?$/i.test(f.name)) { say(msg, 'Tiene que ser un archivo .html.', 'bad'); return null; }
  if (f.size > MAX_BYTES) { say(msg, 'El archivo pesa más de 5 MB.', 'bad'); return null; }
  const by = form.by.value.trim();
  if (by) rememberName(by);
  return { html: await f.text(), by, note: form.note.value.trim() };
}

function say(el, text, kind = '') {
  el.textContent = text;
  el.className = 'drv-msg' + (kind ? ' ' + kind : '');
}

function busy(form, on) {
  form.querySelectorAll('button, input').forEach(x => { x.disabled = on; });
}
