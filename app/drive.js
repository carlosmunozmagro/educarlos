/* Drive: shared HTML files with a fixed URL and a version history.

   Every file lives in its own folder of this repo, served as-is by GitHub
   Pages:

     drive/<id>/index.html          the current version - the fixed URL
     drive/<id>/versions/vNNNN.html every version ever uploaded, never edited
     drive/<id>/history.json        who uploaded which version, when, and why

   There is no server. Uploading writes straight to the repo through the
   GitHub API, as one commit per version, with a token the uploader pastes
   once and this browser remembers. Reading needs nothing: it is all static.

     #/s/drive     the file list (a section, like any other shelf)
     #/d/:fileId   one file - open, download, upload, history, restore      */

import { inline, escapeHtml } from './mdlite.js?v=20260925105859';
import * as Theme from './theme.js?v=20260925105859';
import { BACK_ICON, GO_ICON, vtName } from './ui.js?v=20260925105859';

const ROOT = 'drive/';
const TOKEN_KEY = 'educarlos:gh-token';
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
const token = () => load(localStorage, TOKEN_KEY);
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

/* --------------------------------------------------------- GitHub API */

class GhError extends Error {}

function explain(status, body) {
  if (status === 401) return 'La clave de subida no es válida o ha caducado. Pega una nueva.';
  if (status === 403) return 'La clave no tiene permiso para escribir en el repo (necesita «Contents: Read and write»).';
  if (status === 404) return 'No se encuentra el repo con esta clave. Comprueba que la clave da acceso a «educarlos».';
  if (status === 409 || status === 422) return 'Alguien ha subido algo a la vez. Vuelve a intentarlo.';
  return 'GitHub ha respondido ' + status + '. ' + (body || '').slice(0, 160);
}

async function gh(path, { method = 'GET', body } = {}) {
  const r = await fetch('https://api.github.com' + path, {
    method,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token(),
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) {
    const err = new GhError(explain(r.status, await r.text().catch(() => '')));
    err.status = r.status;
    throw err;
  }
  return r.status === 204 ? null : r.json();
}

function utf8FromBase64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

/* A file's text as of one commit, or null if it does not exist there. Read
   from the API, never the site: the site is minutes behind, and a commit
   built on a stale history would drop someone else's version. */
async function readAt(repo, path, sha) {
  try {
    const f = await gh('/repos/' + repo + '/contents/' + path + '?ref=' + sha);
    if (f.content) return utf8FromBase64(f.content);
    // Over 1 MB the contents API leaves content out; the blob still has it.
    const b = await gh('/repos/' + repo + '/git/blobs/' + f.sha);
    return utf8FromBase64(b.content);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

/* Write several files as a single commit on the Pages branch. build() gets
   the head it is building on and returns { files, message, result }. If the
   branch moved in the meantime the ref update is refused, and the whole thing
   is rebuilt on the new head - so two people uploading at once both land. */
async function commit(build) {
  const { repo, branch = 'main' } = await getDrive();
  for (let attempt = 0; attempt < 4; attempt++) {
    const ref = await gh('/repos/' + repo + '/git/ref/heads/' + branch);
    const head = ref.object.sha;
    const parent = await gh('/repos/' + repo + '/git/commits/' + head);
    const { files, message, result } = await build({ repo, head });
    const tree = await gh('/repos/' + repo + '/git/trees', {
      method: 'POST',
      body: {
        base_tree: parent.tree.sha,
        tree: files.map(f => ({ path: f.path, mode: '100644', type: 'blob', content: f.content }))
      }
    });
    const made = await gh('/repos/' + repo + '/git/commits', {
      method: 'POST', body: { message, tree: tree.sha, parents: [head] }
    });
    try {
      await gh('/repos/' + repo + '/git/refs/heads/' + branch, {
        method: 'PATCH', body: { sha: made.sha, force: false }
      });
      return result;
    } catch (e) {
      if (e.status !== 422 && e.status !== 409) throw e;
    }
  }
  throw new GhError('Hay demasiadas subidas a la vez. Espera un momento y vuelve a intentarlo.');
}

const pad = (n) => String(n).padStart(4, '0');

/* Publish `html` as the next version of file `id`. `extra` is merged into the
   history entry (restoredFrom, for a restore). Returns the new history. */
async function publish(file, html, by, note, extra = {}) {
  const base = ROOT + file.id + '/';
  const history = await commit(async ({ repo, head }) => {
    const raw = await readAt(repo, base + 'history.json', head);
    const hist = raw ? JSON.parse(raw) : { versions: [] };
    const n = hist.versions.reduce((m, v) => Math.max(m, v.n), 0) + 1;
    const entry = {
      n, file: 'versions/v' + pad(n) + '.html',
      by, at: new Date().toISOString(),
      note: note || '', bytes: new Blob([html]).size, ...extra
    };
    hist.versions.push(entry);
    return {
      files: [
        { path: base + 'index.html', content: html },
        { path: base + entry.file, content: html },
        { path: base + 'history.json', content: JSON.stringify(hist, null, 2) + '\n' }
      ],
      message: 'Drive: ' + file.title + ' v' + n + ' (' + by + ')'
        + (extra.restoredFrom ? ' - restaura v' + extra.restoredFrom : '')
        + (note ? '\n\n' + note : ''),
      result: hist
    };
  });
  save(sessionStorage, FRESH_KEY + file.id, JSON.stringify(history));
  return history;
}

/* Add a new file to the drive: its folder, first version, and a line in
   drive/index.json. */
async function createFile(title, html, by, note) {
  const id = slug(title);
  if (!id) throw new GhError('Ponle un nombre al archivo.');
  const at = new Date().toISOString();
  const entry = { n: 1, file: 'versions/v0001.html', by, at, note: note || 'Primera versión', bytes: new Blob([html]).size };
  const hist = { versions: [entry] };
  const idx = await commit(async ({ repo, head }) => {
    const raw = await readAt(repo, ROOT + 'index.json', head);
    const d = raw ? JSON.parse(raw) : { files: [] };
    if (d.files.some(f => f.id === id)) throw new GhError('Ya hay un archivo que se llama así.');
    d.files.push({ id, title, subtitle: '', accent: ACCENTS[d.files.length % ACCENTS.length] });
    const base = ROOT + id + '/';
    return {
      files: [
        { path: ROOT + 'index.json', content: JSON.stringify(d, null, 2) + '\n' },
        { path: base + 'index.html', content: html },
        { path: base + entry.file, content: html },
        { path: base + 'history.json', content: JSON.stringify(hist, null, 2) + '\n' }
      ],
      message: 'Drive: nuevo archivo «' + title + '» (' + by + ')',
      result: d
    };
  });
  index = idx;
  save(sessionStorage, FRESH_KEY + id, JSON.stringify(hist));
  save(sessionStorage, FRESH_KEY + '_index', JSON.stringify(idx));
  return id;
}

const ACCENTS = ['#3a8ef0', '#46c08a', '#f0a13a', '#c46fe0', '#e8695f'];

function slug(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
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

/* The section page for the drive: every file, then the upload key and a way
   to add a new file. Called from main.js in place of the generic section. */
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
    + '<label>Nombre del archivo<input name="title" required maxlength="60" placeholder="Ej.: Presupuesto 2027"></label>'
    + uploadFields()
    + '<button class="cta" type="submit">Crear archivo</button>'
    + '<div class="drv-msg" role="status"></div>'
    + '</form></details>'
    + keyBox()
    + '</div></div>';

  wireKey(app);
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
      const id = await createFile(title, got.html, got.by, got.note);
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
    // cannot reach this origin's storage, where the upload key lives.
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

    + keyBox()
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

  wireKey(app);

  const form = app.querySelector('#up');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = form.querySelector('.drv-msg');
    const got = await readForm(form, msg);
    if (!got) return;
    busy(form, true);
    say(msg, 'Subiendo…');
    try {
      await publish(file, got.html, got.by, got.note);
      save(sessionStorage, FRESH_KEY + id + ':html', got.html.length < 2e6 ? got.html : '');
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
    if (!token()) { say(hmsg, 'Para recuperar una versión hace falta la clave de subida (abajo).', 'bad'); return; }
    const by = myName() || prompt('¿Cómo te llamas? Saldrá en el historial.') || '';
    if (!by.trim()) return;
    save(localStorage, NAME_KEY, by.trim());
    if (!confirm('¿Recuperar la versión ' + n + ' de ' + (v.by || '—') + '?\n\n'
      + 'Se publicará como versión nueva. No se borra nada: la actual sigue en el historial.')) return;
    btn.disabled = true;
    say(hmsg, 'Recuperando la versión ' + n + '…');
    try {
      const { repo, branch = 'main' } = await getDrive();
      const html = await readAt(repo, ROOT + id + '/' + v.file, branch);
      if (html == null) throw new GhError('No se encuentra la versión ' + n + ' en el repo.');
      await publish(file, html, by.trim(), '', { restoredFrom: n });
      save(sessionStorage, FRESH_KEY + id + ':html', html.length < 2e6 ? html : '');
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
    + '<label>Tu nombre<input name="by" required maxlength="40" autocomplete="name" value="' + escapeHtml(myName()) + '" placeholder="Saldrá en el historial"></label>'
    + '<label><span>Qué has cambiado <span class="opt">(opcional)</span></span><input name="note" maxlength="200" placeholder="Ej.: añadidas las fechas de octubre"></label>';
}

async function readForm(form, msg) {
  if (!token()) {
    say(msg, 'Primero pega la clave de subida (más abajo, en «Clave de subida»).', 'bad');
    form.closest('.page').querySelector('.drv-key').open = true;
    return null;
  }
  const f = form.file.files[0];
  const by = form.by.value.trim();
  if (!f) { say(msg, 'Elige un archivo .html.', 'bad'); return null; }
  if (!/\.html?$/i.test(f.name)) { say(msg, 'Tiene que ser un archivo .html.', 'bad'); return null; }
  if (f.size > MAX_BYTES) { say(msg, 'El archivo pesa más de 5 MB.', 'bad'); return null; }
  if (!by) { say(msg, 'Pon tu nombre.', 'bad'); return null; }
  save(localStorage, NAME_KEY, by);
  return { html: await f.text(), by, note: form.note.value.trim() };
}

function say(el, text, kind = '') {
  el.textContent = text;
  el.className = 'drv-msg' + (kind ? ' ' + kind : '');
}

function busy(form, on) {
  form.querySelectorAll('button, input').forEach(x => { x.disabled = on; });
}

/* --------------------------------------------------------- the key */

function keyBox() {
  const has = !!token();
  return '<details class="drv-box drv-key" data-rise>'
    + '<summary>Clave de subida · <b class="' + (has ? 'ok' : 'no') + '">'
    + (has ? 'guardada en este navegador' : 'sin configurar') + '</b></summary>'
    + '<p class="drv-help">Para ver y descargar no hace falta nada. Para <b>subir</b> o '
    + '<b>recuperar</b> versiones, este navegador necesita una clave de GitHub con permiso '
    + 'para escribir en el repo. Se pega una vez y se queda guardada solo aquí.</p>'
    + '<form id="keyf" class="drv-form">'
    + '<label>Clave (token de GitHub)<input name="k" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…"></label>'
    + '<div class="drv-btns"><button class="cta" type="submit">Guardar y probar</button>'
    + (has ? '<button class="cta ghost" type="button" id="forget">Quitar la clave</button>' : '')
    + '</div><div class="drv-msg" role="status"></div></form></details>';
}

function wireKey(app) {
  const form = app.querySelector('#keyf');
  if (!form) return;
  const msg = form.querySelector('.drv-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const k = form.k.value.trim();
    if (!k) { say(msg, 'Pega la clave primero.', 'bad'); return; }
    const before = token();
    save(localStorage, TOKEN_KEY, k);
    say(msg, 'Probando…');
    try {
      const { repo } = await getDrive();
      const r = await gh('/repos/' + repo);
      if (r.permissions && r.permissions.push === false) throw new GhError('La clave funciona pero no puede escribir en ' + repo + '.');
      say(msg, 'Clave guardada. Ya puedes subir versiones.', 'good');
      form.k.value = '';
      const s = app.querySelector('.drv-key summary b');
      s.textContent = 'guardada en este navegador'; s.className = 'ok';
    } catch (err) {
      save(localStorage, TOKEN_KEY, before);
      say(msg, err.message || String(err), 'bad');
    }
  });
  app.querySelector('#forget')?.addEventListener('click', () => {
    save(localStorage, TOKEN_KEY, '');
    say(msg, 'Clave quitada de este navegador.', 'good');
    const s = app.querySelector('.drv-key summary b');
    s.textContent = 'sin configurar'; s.className = 'no';
  });
}
