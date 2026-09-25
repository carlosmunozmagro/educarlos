/* Educarlos Drive - the upload Worker.

   The drive's pages are static on GitHub Pages and cannot write to the repo
   themselves: every write to GitHub needs a key, and a key published in a
   public page is a key for anyone. So this Worker holds the key and does the
   writing, and the pages send it the file.

   Paste this whole file into a Cloudflare Worker (docs/DRIVE.md walks through
   it) and give the Worker these settings:

     GITHUB_TOKEN     secret  fine-grained token, Contents: Read and write, only on the repo
     TEAM_WORD        secret  the word asked for on upload; leave unset for none

   and, only to change the defaults:

     REPO             text    default carlosmunozmagro/educarlos
     BRANCH           text    default main
     ALLOWED_ORIGINS  text    default https://carlosmunozmagro.github.io  (comma-separated)

   It only ever writes inside drive/: a file's index.html, a new version,
   its history.json, and drive/index.json when a file is added. Nothing is
   ever deleted or overwritten in versions/.

   POST /check    { word }                          is the word right?
   POST /upload   { word, id, html, by, note }      new version of a file
   POST /restore  { word, id, n, by }               republish version n
   POST /create   { word, title, html, by, note }   add a new file         */

const ROOT = 'drive/';
const MAX_BYTES = 5 * 1024 * 1024;
const ACCENTS = ['#3a8ef0', '#46c08a', '#f0a13a', '#c46fe0', '#e8695f'];

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ error: 'Solo POST.' }, 405, cors);
    if (!cors['Access-Control-Allow-Origin']) return reply({ error: 'Origen no permitido.' }, 403, cors);

    let body;
    try { body = await request.json(); } catch { return reply({ error: 'Petición mal formada.' }, 400, cors); }

    try {
      if (!wordOk(body.word, env)) throw new Oops('La palabra del equipo no es correcta.', 401);
      const gh = github(env);
      const action = new URL(request.url).pathname.replace(/^\/+|\/+$/g, '');
      if (action === 'check') return reply({ ok: true }, 200, cors);
      if (action === 'upload') return reply(await upload(gh, body), 200, cors);
      if (action === 'restore') return reply(await restore(gh, body), 200, cors);
      if (action === 'create') return reply(await create(gh, body), 200, cors);
      throw new Oops('Acción desconocida.', 404);
    } catch (e) {
      const status = e instanceof Oops ? e.status : 502;
      return reply({ error: e.message || String(e) }, status, cors);
    }
  }
};

class Oops extends Error {
  constructor(msg, status = 400) { super(msg); this.status = status; }
}

/* ----------------------------------------------------------- plumbing */

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || 'https://carlosmunozmagro.github.io').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes('*') || allowed.includes(origin);
  return {
    ...(ok ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function reply(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' }
  });
}

/* No word configured means no word asked. Compared without an early exit,
   so the time taken says nothing about how much of a guess was right. */
function wordOk(given, env) {
  const want = String(env.TEAM_WORD || '').trim().toLowerCase();
  if (!want) return true;
  const got = String(given || '').trim().toLowerCase();
  let diff = got.length ^ want.length;
  for (let i = 0; i < want.length; i++) diff |= (got.charCodeAt(i) || 0) ^ want.charCodeAt(i);
  return diff === 0;
}

function github(env) {
  const repo = env.REPO || 'carlosmunozmagro/educarlos';
  const branch = env.BRANCH || 'main';
  if (!env.GITHUB_TOKEN) throw new Oops('El Worker no tiene la clave de GitHub configurada.', 500);

  async function gh(path, { method = 'GET', body } = {}) {
    const r = await fetch('https://api.github.com/repos/' + repo + path, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + env.GITHUB_TOKEN,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'educarlos-drive-worker',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      const e = new Oops(
        r.status === 401 ? 'La clave de GitHub del Worker no vale o ha caducado.'
        : r.status === 403 ? 'La clave de GitHub del Worker no puede escribir en el repo.'
        : 'GitHub ha respondido ' + r.status + '. ' + text.slice(0, 160), 502);
      e.gh = r.status;
      throw e;
    }
    return r.status === 204 ? null : r.json();
  }

  /* A file's text as of one commit, or null if it is not there. */
  async function readAt(path, ref) {
    try {
      const f = await gh('/contents/' + path + '?ref=' + ref);
      if (f.content) return fromBase64(f.content);
      // Over 1 MB the contents API leaves the content out; the blob has it.
      return fromBase64((await gh('/git/blobs/' + f.sha)).content);
    } catch (e) {
      if (e.gh === 404) return null;
      throw e;
    }
  }

  /* Several files as one commit. build() sees the head it builds on; if the
     branch moves before the ref update, everything is rebuilt on the new
     head, so two uploads at once both land and neither loses a version. */
  async function commit(build) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const head = (await gh('/git/ref/heads/' + branch)).object.sha;
      const parent = await gh('/git/commits/' + head);
      const { files, message, result } = await build(head);
      const tree = await gh('/git/trees', {
        method: 'POST',
        body: {
          base_tree: parent.tree.sha,
          tree: files.map(f => ({ path: f.path, mode: '100644', type: 'blob', content: f.content }))
        }
      });
      const made = await gh('/git/commits', {
        method: 'POST', body: { message, tree: tree.sha, parents: [head] }
      });
      try {
        await gh('/git/refs/heads/' + branch, { method: 'PATCH', body: { sha: made.sha, force: false } });
        return result;
      } catch (e) {
        if (e.gh !== 422 && e.gh !== 409) throw e;
      }
    }
    throw new Oops('Hay demasiadas subidas a la vez. Espera un momento y vuelve a intentarlo.', 409);
  }

  return { readAt, commit, branch };
}

function fromBase64(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

/* ------------------------------------------------------------ checks */

const pad = (n) => String(n).padStart(4, '0');
const bytes = (s) => new TextEncoder().encode(s).length;

function slug(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

function cleanText(s, max) {
  return String(s || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
}

function cleanHtml(html) {
  if (typeof html !== 'string' || !html.trim()) throw new Oops('El archivo está vacío.');
  if (bytes(html) > MAX_BYTES) throw new Oops('El archivo pesa más de 5 MB.');
  return html;
}

async function fileEntry(gh, head, id) {
  if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(String(id || ''))) throw new Oops('Archivo no válido.');
  const raw = await gh.readAt(ROOT + 'index.json', head);
  const file = raw && (JSON.parse(raw).files || []).find(f => f.id === id);
  if (!file) throw new Oops('No hay ningún archivo «' + id + '» en el drive.', 404);
  return file;
}

/* ----------------------------------------------------------- actions */

/* The next version of a file: the fixed link, the kept copy and the history,
   all in one commit. `extra` goes into the history entry. */
function publish(gh, id, html, by, note, extra = {}) {
  const base = ROOT + id + '/';
  return gh.commit(async (head) => {
    const file = await fileEntry(gh, head, id);
    const raw = await gh.readAt(base + 'history.json', head);
    const hist = raw ? JSON.parse(raw) : { versions: [] };
    const n = hist.versions.reduce((m, v) => Math.max(m, v.n), 0) + 1;
    const entry = {
      n, file: 'versions/v' + pad(n) + '.html',
      by, at: new Date().toISOString(), note, bytes: bytes(html), ...extra
    };
    hist.versions.push(entry);
    return {
      files: [
        { path: base + 'index.html', content: html },
        { path: base + entry.file, content: html },
        { path: base + 'history.json', content: JSON.stringify(hist, null, 2) + '\n' }
      ],
      message: 'Drive: ' + file.title + ' v' + n + ' (' + by + ')'
        + (extra.restoredFrom ? ' - recupera v' + extra.restoredFrom : '')
        + (note ? '\n\n' + note : ''),
      result: { history: hist }
    };
  });
}

function upload(gh, b) {
  return publish(gh, b.id, cleanHtml(b.html),
    cleanText(b.by, 40) || 'Anónimo', cleanText(b.note, 200));
}

async function restore(gh, b) {
  const n = Number(b.n);
  if (!Number.isInteger(n) || n < 1) throw new Oops('Versión no válida.');
  const id = String(b.id || '');
  await fileEntry(gh, gh.branch, id);
  const html = await gh.readAt(ROOT + id + '/versions/v' + pad(n) + '.html', gh.branch);
  if (html == null) throw new Oops('No se encuentra la versión ' + n + '.', 404);
  return publish(gh, id, html, cleanText(b.by, 40) || 'Anónimo', '', { restoredFrom: n });
}

function create(gh, b) {
  const title = cleanText(b.title, 60);
  const id = slug(title);
  if (!id) throw new Oops('Ponle un nombre al archivo.');
  const html = cleanHtml(b.html);
  const by = cleanText(b.by, 40) || 'Anónimo';
  const note = cleanText(b.note, 200) || 'Primera versión';
  return gh.commit(async (head) => {
    const raw = await gh.readAt(ROOT + 'index.json', head);
    const d = raw ? JSON.parse(raw) : { files: [] };
    d.files = d.files || [];
    if (d.files.some(f => f.id === id)) throw new Oops('Ya hay un archivo que se llama así.', 409);
    d.files.push({ id, title, subtitle: '', accent: ACCENTS[d.files.length % ACCENTS.length] });
    const entry = { n: 1, file: 'versions/v0001.html', by, at: new Date().toISOString(), note, bytes: bytes(html) };
    const hist = { versions: [entry] };
    const base = ROOT + id + '/';
    return {
      files: [
        { path: ROOT + 'index.json', content: JSON.stringify(d, null, 2) + '\n' },
        { path: base + 'index.html', content: html },
        { path: base + entry.file, content: html },
        { path: base + 'history.json', content: JSON.stringify(hist, null, 2) + '\n' }
      ],
      message: 'Drive: nuevo archivo «' + title + '» (' + by + ')',
      result: { id, index: d, history: hist }
    };
  });
}
