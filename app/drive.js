/* Drive: shared HTML files with a fixed URL and a version history.

   Every file lives in its own folder of this repo, served as-is by GitHub
   Pages:

     drive/<id>/index.html          the current version - the fixed URL
     drive/<id>/versions/vNNNN.html every version ever uploaded, never edited
     drive/<id>/history.json        who uploaded which version, when, and why

   Reading needs nothing: it is all static. Writing goes through a small
   Cloudflare Worker (worker/drive-worker.js) that holds the GitHub key and
   makes one commit per version, so nobody uploading ever needs a key - only
   the team word, if one is set. Its URL is "worker" in drive/index.json.

     #/s/drive     the file list (a section, like any other shelf)
     #/d/:fileId   one file - open, download, upload, history, restore      */

import { inline, escapeHtml } from './mdlite.js?v=20260925113705';
import * as Theme from './theme.js?v=20260925113705';
import { BACK_ICON, GO_ICON, vtName } from './ui.js?v=20260925113705';

const ROOT = 'drive/';
const WORD_KEY = 'educarlos:drive-word';
const NAME_KEY = 'educarlos:drive-name';
const FRESH_KEY = 'educarlos:drive-fresh:';
const MAX_BYTES = 5 * 1024 * 1024;

let index = null;

/* ------------------------------------------------------------ storage */

/* Storage can be missing or throw (private windows, blocked site data); the
   drive must still read fine without it, and only uploads need it. */
function load(store, k) { try { return store.getItem(k) || ''; } catch { return ''; } }
function save(store, k, v) {
  try { v ? store.setItem(k, v) : store.removeItem(k); } catch {}
}
const word = () => load(localStorage, WORD_KEY);
const myName = () => load(localStorage, NAME_KEY);

/* ---------------------------------------------------------- reading */

async function getJSON(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  return r.json();
}

export async function getDrive() {
  if (!index) index = await getJSON(ROOT + 'index.json');
  return index;
}

export async function getFiles() {
  return (await getDrive()).files || [];
}

async function getFile(id) {
  const f = (await getFiles()).find(x => x.id === id);
  if (!f) throw new Error('No hay ningún archivo "' + id + '" en el drive.');
  return f;
}

/* The site copy of history.json lags a commit by the minute or two Pages takes
   to rebuild. The uploader has just seen the fresh one, so it is kept for the
   tab and preferred while it is ahead. */
async function getHistory(id) {
  let site = { versions: [] };
  try { site = await getJSON(ROOT + id + '/history.json'); } catch {}
  let fresh = null;
  try { fresh = JSON.parse(load(sessionStorage, FRESH_KEY + id) || 'null'); } catch {}
  const n = h => (h?.versions || []).length;
  return fresh && n(fresh) > n(site) ? { ...fresh, pending: true } : site;
}

const fileUrl = (id) => ROOT + encodeURIComponent(id) + '/';
const versionUrl = (id, v) => ROOT + encodeURIComponent(id) + '/' + v.file;
const absolute = (rel) => new URL(rel, location.href.split('#')[0]).href;

/* ------------------------------------------------------- the Worker */

/* One call to the upload Worker. It answers { error } with a status on
   anything it refuses; a wrong word also forgets the remembered one, so the
   next try asks again instead of failing the same way. */
async function api(action, payload) {
  const { worker } = await getDrive();
  if (!worker) throw new Error('Las subidas todavía no están activadas: falta configurar el Worker (docs/DRIVE.md).');
  let r;
  try {
    r = await fetch(worker.replace(/\/+$/, '') + '/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error('No se ha podido conectar con el servidor de subidas. Comprueba la conexión.');
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) save(localStorage, WORD_KEY, '');
    throw new Error(data.error || 'El servidor de subidas ha respondido ' + r.status + '.');
  }
  return data;
}

/* The site's copies lag the commit by the minute or two Pages takes to
   rebuild, so what the Worker hands back is kept for this tab. */
function remember(id, history, html) {
  save(sessionStorage, FRESH_KEY + id, JSON.stringify(history));
  save(sessionStorage, FRESH_KEY + id + ':html', html && html.length < 2e6 ? html : '');
}

function slug(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

/* ------------------------------------------------------------ format */

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

function latest(hist) {
  const vs = hist.versions || [];
  return vs.length ? vs[vs.length - 1] : null;
}

/* ------------------------------------------------------------- cards */

export function fileCard(file, i = 0, hist = null) {
  const v = hist && latest(hist);
  return '<a class="course-card" href="#/d/' + encodeURIComponent(file.id) + '"'
    + ' data-rise style="--i:' + i + ';--accent:' + escapeHtml(file.accent || '#3a8ef0') + '">'
    + '<div class="meta"><h2 style="view-transition-name:' + vtName('file', file.id) + '">'
    + inline(file.title) + '</h2>'
    + (file.subtitle ? '<div class="desc">' + inline(file.subtitle) + '</div>' : '')
    + '<span class="tag">' + (v
        ? 'v' + v.n + ' &middot; ' + escapeHtml(v.by) + ' &middot; ' + escapeHtml(when(v.at))
        : 'HTML') + '</span></div>'
    + '<span class="go">' + GO_ICON + '</span></a>';
}

/* --------------------------------------------------------- the list */

/* The section page for the drive: every file, then a way to add a new one. Called from main.js in place of the generic section. */
export async function viewList(app, sec) {
  let files = await getFiles();
  try {
    const fresh = JSON.parse(load(sessionStorage, FRESH_KEY + '_index') || 'null');
    if (fresh && (fresh.files || []).length > files.length) files = fresh.files;
  } catch {}
  const hists = await Promise.all(files.map(f => getHistory(f.id)));

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
    + '<div class="card-list">'
    + (files.map((f, i) => fileCard(f, i, hists[i])).join('') || '<div class="empty">Todavía no hay archivos.</div>')
    + '</div>'
    + '<details class="drv-box drv-new" data-rise>'
    + '<summary>+ Añadir un archivo nuevo</summary>'
    + '<form id="newf" class="drv-form">'
    + (await offNote())
    + '<label>Nombre del archivo<input name="title" required maxlength="60" placeholder="Ej.: Presupuesto 2027"></label>'
    + uploadFields()
    + '<button class="cta" type="submit">Crear archivo</button>'
    + '<div class="drv-msg" role="status"></div>'
    + '</form></details>'
    + '</div></div>';

  const form = app.querySelector('#newf');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = form.querySelector('.drv-msg');
    const got = await readForm(form, msg);
    if (!got) return;
    const title = form.title.value.trim();
    busy(form, true);
    say(msg, 'Creando «' + title + '»…');
    try {
      const r = await api('create', { word: got.word, title, html: got.html, by: got.by, note: got.note });
      index = r.index;
      save(sessionStorage, FRESH_KEY + '_index', JSON.stringify(r.index));
      remember(r.id, r.history, got.html);
      const id = r.id;
      location.hash = '#/d/' + encodeURIComponent(id);
    } catch (err) {
      say(msg, err.message || String(err), 'bad');
    } finally { busy(form, false); }
  });
}

/* --------------------------------------------------------- one file */

export async function viewFile(app, id) {
  let file;
  try { file = await getFile(id); }
  catch (e) {
    // Just created in this tab: the site's index.json has not caught up yet.
    const fresh = JSON.parse(load(sessionStorage, FRESH_KEY + '_index') || 'null');
    file = fresh?.files?.find(f => f.id === id);
    if (!file) throw e;
  }
  const hist = await getHistory(id);
  const cur = latest(hist);

  document.documentElement.lang = 'es';
  document.title = file.title + ' · Drive';
  app.style.setProperty('--accent', file.accent || '#3a8ef0');

  const url = absolute(fileUrl(id));
  const dlName = slug(file.title) || id;

  const rows = (hist.versions || []).slice().reverse().map(v => {
    const isCur = cur && v.n === cur.n;
    const meta = [escapeHtml(when(v.at)), size(v.bytes)].filter(Boolean).join(' · ');
    const note = v.restoredFrom
      ? 'Recupera la versión ' + v.restoredFrom + (v.note ? ' — ' + escapeHtml(v.note) : '')
      : escapeHtml(v.note || '');
    return '<li class="drv-ver' + (isCur ? ' cur' : '') + '">'
      + '<div class="drv-vhead"><span class="drv-n">v' + v.n + '</span>'
      + '<span class="drv-by">' + escapeHtml(v.by || '—') + '</span>'
      + (isCur ? '<span class="drv-cur">Actual</span>' : '') + '</div>'
      + '<div class="drv-meta">' + meta + '</div>'
      + (note ? '<div class="drv-note">' + note + '</div>' : '')
      + '<div class="drv-acts">'
      + '<a href="' + escapeHtml(versionUrl(id, v)) + '" target="_blank" rel="noopener">Ver</a>'
      + '<a href="' + escapeHtml(versionUrl(id, v)) + '" download="' + escapeHtml(dlName + '-v' + v.n + '.html') + '">Descargar</a>'
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
        + '<span class="fact">' + escapeHtml(when(cur.at)) + '</span></div>' : '')
    + (file.subtitle ? '<div class="desc">' + inline(file.subtitle) + '</div>' : '') + '</div>'

    + (hist.pending ? '<div class="drv-pending">Acabas de subir una versión nueva. La web pública '
        + 'tarda uno o dos minutos en actualizarse; hasta entonces el enlace enseña la anterior.</div>' : '')

    + '<div class="pat-block" data-rise><h2>Enlace fijo</h2>'
    + '<div class="drv-url"><code id="u">' + escapeHtml(url) + '</code>'
    + '<button type="button" id="copy">Copiar</button></div>'
    + '<div class="drv-btns">'
    + '<a class="cta" href="' + escapeHtml(fileUrl(id)) + '" target="_blank" rel="noopener">Abrir</a>'
    + '<a class="cta ghost" href="' + escapeHtml(fileUrl(id) + 'index.html') + '" download="' + escapeHtml(dlName + '.html') + '">Descargar</a>'
    + '</div></div>'

    + '<div class="pat-block" data-rise><h2>Vista previa</h2>'
    // Sandboxed without same-origin: an uploaded page runs its scripts, but
    // cannot reach this origin's storage.
    + '<iframe class="drv-frame" id="pv" sandbox="allow-scripts allow-popups allow-forms" title="Vista previa de ' + escapeHtml(file.title) + '"></iframe></div>'

    + '<div class="pat-block" data-rise><h2>Subir una versión nueva</h2>'
    + '<form id="up" class="drv-form drv-box">'
    + (await offNote())
    + uploadFields()
    + '<button class="cta" type="submit">Subir versión</button>'
    + '<div class="drv-msg" role="status"></div>'
    + '</form></div>'

    + '<div class="pat-block" data-rise><h2>Historial</h2>'
    + (rows ? '<ol class="drv-hist">' + rows + '</ol>' : '<div class="empty">Sin versiones todavía.</div>')
    + '<div class="drv-msg" id="hmsg" role="status"></div></div>'
    + '</div></div>';

  // The preview: straight from the site, unless this tab holds a newer
  // version than the site has built yet.
  const pv = app.querySelector('#pv');
  const pendingHtml = load(sessionStorage, FRESH_KEY + id + ':html');
  if (hist.pending && pendingHtml) pv.srcdoc = pendingHtml;
  else fetch(fileUrl(id) + 'index.html', { cache: 'no-cache' })
    .then(r => r.ok ? r.text() : '')
    .then(t => { pv.srcdoc = t || '<p style="font-family:sans-serif;color:#888">Sin contenido.</p>'; })
    .catch(() => {});

  app.querySelector('#copy').addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(url); e.target.textContent = 'Copiado'; }
    catch { getSelection().selectAllChildren(app.querySelector('#u')); }
  });

  const form = app.querySelector('#up');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = form.querySelector('.drv-msg');
    const got = await readForm(form, msg);
    if (!got) return;
    busy(form, true);
    say(msg, 'Subiendo…');
    try {
      const r = await api('upload', { word: got.word, id, html: got.html, by: got.by, note: got.note });
      remember(id, r.history, got.html);
      viewFile(app, id);
    } catch (err) {
      say(msg, err.message || String(err), 'bad');
      busy(form, false);
    }
  });

  const hmsg = app.querySelector('#hmsg');
  app.querySelectorAll('[data-restore]').forEach(btn => btn.addEventListener('click', async () => {
    const n = Number(btn.dataset.restore);
    const v = hist.versions.find(x => x.n === n);
    if (!confirm('¿Recuperar la versión ' + n + ' de ' + (v.by || '—') + '?\n\n'
      + 'Se publicará como versión nueva. No se borra nada: la actual sigue en el historial.')) return;
    const by = myName() || (prompt('¿Tu nombre? Saldrá en el historial (puedes dejarlo vacío).') || '').trim();
    if (by) save(localStorage, NAME_KEY, by);
    const w = word() || (prompt('Palabra del equipo:') || '').trim();
    btn.disabled = true;
    say(hmsg, 'Recuperando la versión ' + n + '…');
    try {
      const r = await api('restore', { word: w, id, n, by });
      if (w) save(localStorage, WORD_KEY, w);
      // The restored page is already on the site, as its own version file.
      const html = await fetch(versionUrl(id, v)).then(x => x.ok ? x.text() : '').catch(() => '');
      remember(id, r.history, html);
      viewFile(app, id);
    } catch (err) {
      say(hmsg, err.message || String(err), 'bad');
      btn.disabled = false;
    }
  }));
}

/* ------------------------------------------------------- form pieces */

/* Until the Worker exists, say so up front rather than on the first try. */
async function offNote() {
  return (await getDrive()).worker ? ''
    : '<div class="drv-pending">Las subidas todavía no están activadas: falta poner en marcha '
      + 'el servidor de subidas (el Worker). Ver y descargar ya funciona.</div>';
}

function uploadFields() {
  return '<label>Archivo HTML<input name="file" type="file" accept=".html,.htm,text/html" required></label>'
    + '<label><span>Tu nombre <span class="opt">(opcional)</span></span><input name="by" maxlength="40" autocomplete="name" value="' + escapeHtml(myName()) + '" placeholder="Saldrá en el historial"></label>'
    + '<label><span>Qué has cambiado <span class="opt">(opcional)</span></span><input name="note" maxlength="200" placeholder="Ej.: añadidas las fechas de octubre"></label>'
    // Remembered after the first upload that gets it right, so it is asked
    // once per browser; the field stays so it can be changed.
    + '<label>Palabra del equipo<input name="word" type="password" autocomplete="off" spellcheck="false" value="' + escapeHtml(word()) + '" placeholder="La que os hayáis dado"></label>';
}

async function readForm(form, msg) {
  const f = form.file.files[0];
  const by = form.by.value.trim();
  if (!f) { say(msg, 'Elige un archivo .html.', 'bad'); return null; }
  if (!/\.html?$/i.test(f.name)) { say(msg, 'Tiene que ser un archivo .html.', 'bad'); return null; }
  if (f.size > MAX_BYTES) { say(msg, 'El archivo pesa más de 5 MB.', 'bad'); return null; }
  if (by) save(localStorage, NAME_KEY, by);
  const w = form.word.value.trim();
  // Saved before the call; a wrong word is forgotten again when the Worker
  // refuses it.
  if (w) save(localStorage, WORD_KEY, w);
  return { html: await f.text(), by, note: form.note.value.trim(), word: w };
}

function say(el, text, kind = '') {
  el.textContent = text;
  el.className = 'drv-msg' + (kind ? ' ' + kind : '');
}

function busy(form, on) {
  form.querySelectorAll('button, input').forEach(x => { x.disabled = on; });
}
