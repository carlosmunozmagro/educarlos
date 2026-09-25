# Drive HTML

A section of Educarlos for sharing HTML files. Every file has a **fixed link**
that always shows the latest version. Anyone can download it, change it (by
hand or with AI) and upload a new version: no account, no key, no password.
The history keeps every version with the name typed in (or "Anónimo") and
the date, and any old one can be recovered.

Still being tried out.

## How it works

Files are stored in **Supabase** (a free database), which the web talks to
directly. There is no server of our own.

```
drive/config.json      the Supabase project's URL and public key
drive/index.html       the fixed link: drive/?calendario (latest) or drive/?calendario&v=2
drive/setup.sql        creates the tables and puts in the examples — run once
drive/examples/        the example HTML files (they are also inside setup.sql)
app/drive.js           the screens: #/s/drive (the list) and #/d/<id> (a file)
```

Fixed link: `https://carlosmunozmagro.github.io/educarlos/drive/?calendario`

- **Upload** = a new version (row). It shows **instantly**, with no waiting.
- **Recover** = the old version is saved again as the newest, marked
  "Recupera la versión N". Nothing is ever deleted.
- **From the web you can only read and add.** Nobody can change or delete
  versions, so the history is always kept.

## Setting it up (once, ~5 minutes)

1. Go to <https://supabase.com> → **Start your project** → sign in with
   GitHub or Google.
2. **New project**: name `educarlos`, choose a database password (write it
   down, although you will not need it here), region **Europe**, free plan →
   **Create**. Wait a minute while it is created.
3. Left menu → **SQL Editor** → **New query** → paste the whole of
   `drive/setup.sql` → **Run**. It should say "Success".
4. Left menu → **Project Settings** → **API** (or **Data API** / **API Keys**)
   and copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - the **public key**: the one called *publishable* (`sb_publishable_…`)
     or, on older screens, *anon public*. **Never** the *secret* /
     *service_role* one.
5. Put those two values into `drive/config.json` (or pass them to Claude):

```json
{
  "supabaseUrl": "https://xxxx.supabase.co",
  "supabaseKey": "sb_publishable_…"
}
```

## Things to know

- **Anyone with the link can upload**, and can see everything. That is how
  it was decided: simple rather than secure. Nothing confidential.
- The public key is **meant** to be visible: all it allows is what
  `setup.sql` permits (reading and adding).
- **The free Supabase plan pauses the project after a week with no use.**
  If the drive says it cannot connect, go into Supabase and press
  **Restore project**. Nothing is lost.
- Free limit: 500 MB of database, which is thousands of versions of normal
  HTML files.
- The preview inside the app is sandboxed. Opening the fixed link runs the
  uploaded page as-is, so only upload pages from people you trust.
