# Drive HTML

A section of Educarlos for sharing HTML files. Every file has a **fixed link**
that always shows the latest version. Anyone can download it, change it (by
hand or with AI) and upload a new version. Every version is kept, with who
uploaded it and when, and any old one can be recovered.

Still being tried out. If it works it may move somewhere else.

## Where things live

```
drive/index.json                   the list of files (+ the repo and branch to write to)
drive/<id>/index.html              the current version — the fixed link
drive/<id>/versions/v0001.html     every version, never edited
drive/<id>/history.json            n, who, when, note, and restoredFrom when it is a restore
app/drive.js                       the screens (#/s/drive and #/d/<id>) and the uploads
```

Fixed link: `https://carlosmunozmagro.github.io/educarlos/drive/<id>/`

- **Upload** = one commit to `main` that updates `index.html`, adds
  `versions/vNNNN.html` and adds a line to `history.json`.
- **Recover** = the same thing, with the old version's content. Nothing is
  deleted: it becomes the newest version, marked "Recupera la versión N".
- **New file** = the same, plus a line in `drive/index.json`.

After an upload, GitHub Pages takes **1–2 minutes** to update the public link.
The person who uploaded sees it straight away. Everyone else sees it once
Pages has rebuilt.

## The upload key (token)

Viewing and downloading need nothing. **Uploading** writes to the repo, and
GitHub only allows that with a key: a *fine-grained personal access token*.
It is pasted once in "Clave de subida", at the bottom of the drive, and
stays in that browser (`localStorage`).

### Create one (5 minutes, on github.com)

1. github.com → your photo → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Token name:** `educarlos-drive` (whatever you like).
3. **Expiration:** 90 days, or whatever you prefer. When it expires, make another.
4. **Repository access:** *Only select repositories* → `educarlos`.
5. **Permissions → Repository permissions → Contents:** *Read and write*.
   Nothing else.
6. **Generate token** and copy it (it starts with `github_pat_`). GitHub only
   shows it once.
7. In Educarlos → Drive HTML → "Clave de subida" → paste → "Guardar y probar".

### Things to know

- **Whoever has the key can write to the whole `educarlos` repo** (only that
  repo, and only files). That is why it is scoped to this repo alone. If a key
  leaks, delete it on GitHub and nothing else is exposed.
- **Commits come out under the account that made the key.** The name that
  shows in the drive history is the one typed in the form.
- **Anything uploaded is public**, because the repo is public for Pages. Do
  not upload anything confidential.
- **Uploaded pages run on the same domain as the app.** Only open or upload
  pages from people you trust. The preview in the app is sandboxed, but
  opening the fixed link is not.
