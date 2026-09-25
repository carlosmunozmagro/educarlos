# Drive HTML

A section of Educarlos for sharing HTML files. Every file has a **fixed link**
that always shows the latest version. Anyone can download it, change it (by
hand or with AI) and upload a new version, with no account and no key: just
the **team word**. Every version is kept, with the name typed in (or
"Anónimo") and the date, and any old one can be recovered.

Still being tried out. If it works it may move somewhere else.

## How it works

```
Browser (anyone: the file + a name, optional + the team word)
      │
      ▼
Cloudflare Worker   worker/drive-worker.js — holds the GitHub key, checks the word
      │  one commit per version
      ▼
Repo educarlos, main branch  →  GitHub Pages  →  fixed link
```

```
drive/index.json                   the list of files, the repo and the Worker's URL ("worker")
drive/<id>/index.html              the current version — the fixed link
drive/<id>/versions/v0001.html     every version, never edited or deleted
drive/<id>/history.json            n, who, when, note, and restoredFrom when it is a restore
app/drive.js                       the screens (#/s/drive and #/d/<id>)
worker/drive-worker.js             the Worker, to paste into Cloudflare
```

Fixed link: `https://carlosmunozmagro.github.io/educarlos/drive/<id>/`

- **Upload** = one commit that updates `index.html`, adds `versions/vNNNN.html`
  and adds a line to `history.json`.
- **Recover** = the same thing with the old version's content. Nothing is
  deleted: it becomes the newest version, marked "Recupera la versión N".
- **New file** = the same, plus a line in `drive/index.json`.
- The Worker **only writes inside `drive/`**, and only to files that are
  already in `drive/index.json`.

After an upload, GitHub Pages takes **1–2 minutes** to update the public link.
The person who uploaded sees it straight away.

Until the Worker is configured (`"worker": ""` in `drive/index.json`), viewing
and downloading work, and the upload forms say they are not switched on yet.

---

## Setting up the Worker (once, ~15 minutes)

### 1. The GitHub key (only the Worker will use it)

1. github.com → your photo → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Name: `educarlos-drive`. **Expiration:** as long as GitHub allows (or
   "No expiration"). When it expires, uploads stop until it is replaced (step 3).
3. **Repository access:** *Only select repositories* → `educarlos`.
4. **Permissions → Repository permissions → Contents:** *Read and write*.
   Nothing else.
5. **Generate token** and copy it (`github_pat_…`). GitHub only shows it once.
   Do not share it with anyone and do not put it in the repo: it goes only
   into Cloudflare.

### 2. Create the Worker

1. Make a free account at <https://dash.cloudflare.com/sign-up>.
2. Left menu → **Compute (Workers)** → **Workers & Pages** → **Create** →
   **Start with Hello World** (or "Create Worker").
3. Name: `educarlos-drive` → **Deploy**.
4. **Edit code** → delete everything → paste the whole of
   `worker/drive-worker.js` → **Deploy**.
5. Copy its URL, something like `https://educarlos-drive.<your-name>.workers.dev`.

(Cloudflare renames its menus now and then. If something is called
differently, look for "Workers".)

### 3. The Worker's settings

In the Worker → **Settings** → **Variables and Secrets** → **Add**:

| Name | Type | Value |
|---|---|---|
| `GITHUB_TOKEN` | **Secret** | the `github_pat_…` from step 1 |
| `TEAM_WORD` | **Secret** | the team word. Leave it out to ask for none |

Nothing else is needed: the repo (`carlosmunozmagro/educarlos`), the branch
(`main`) and the allowed website (`https://carlosmunozmagro.github.io`) are
already the defaults. They can be changed with the variables `REPO`, `BRANCH`
and `ALLOWED_ORIGINS`.

The word is **not** written anywhere in the repo, because the repo is
public. It lives only in Cloudflare and gets passed on to the team.

**Deploy** again if it asks you to.

### 4. Tell the app where the Worker is

Put the URL from step 2 into `drive/index.json`:

```json
"worker": "https://educarlos-drive.<your-name>.workers.dev",
```

(From github.com, open the file → pencil → edit → *Commit changes*. Or ask
Claude.) Two minutes later, uploads work.

### Changing the word or the key

Cloudflare → the Worker → Settings → Variables and Secrets → edit `TEAM_WORD`
or `GITHUB_TOKEN`. Nothing needs to change in the app. Whoever had the old word
remembered gets "La palabra del equipo no es correcta" and types the new one.

## Things to know

- **The word is a lock on the door, not real security.** It stops strangers
  who find the link. If it spreads, change it.
- **Anything uploaded is public**, because the repo is public for Pages. Do
  not upload anything confidential.
- **The GitHub key never reaches anyone's browser.** It lives only in
  Cloudflare. If there is ever a doubt, delete it on GitHub and make another
  (step 1 + step 3).
- **Uploaded pages run on the same domain as the app.** Uploads come from
  people you trust, but that is worth keeping in mind. The preview inside the
  app is sandboxed.
- **Free Cloudflare:** 100,000 requests a day, far more than enough.
