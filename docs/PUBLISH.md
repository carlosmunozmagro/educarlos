# Publishing Educarlos

Two things live here: the **one-time setup** that puts the app on the web, and the
**routine** you run every time you finish a lesson.

The whole repo is ~1.1 MB across ~100 files. There is no build step and no
dependency install — GitHub Pages serves these files exactly as they sit on disk.

---

## Part 1 — one-time setup

### 1. Make the repository on github.com

`gh` on this Mac is a broken Uber wrapper, so do this in the browser.

1. Go to <https://github.com/new>.
2. **Repository name:** `educarlos`
3. **Public.** A free GitHub account can only serve Pages from a public repo.
   Everything here is course material and public-domain law citations, so there is
   nothing to hide — but this is the decision to make consciously.
4. Do **not** tick "Add a README", "Add .gitignore", or "Choose a license". The
   repo must start empty or the first push will be rejected.
5. Create repository. Leave the page open — you need the URL from it.

### 2. Push this folder

The local repo already exists and the first commit is already made, under your
personal identity (`carlosmunozmagro@gmail.com`, set repo-locally so your global
Uber identity is untouched). All that is left is to point it at GitHub and push.
Replace `YOUR-USERNAME`:

```bash
cd ~/Desktop/EduCarlos && git remote add origin https://github.com/YOUR-USERNAME/educarlos.git && git push -u origin main
```

If it asks for a password, GitHub wants a **personal access token**, not your
account password: github.com → Settings → Developer settings → Personal access
tokens → Tokens (classic) → Generate new token, tick `repo`, and paste that as the
password. macOS Keychain remembers it after the first time.

### 3. Turn Pages on

In the repo: **Settings → Pages**.

- **Source:** Deploy from a branch
- **Branch:** `main`, folder `/ (root)`
- **Save**

Wait one or two minutes, then open:

```
https://YOUR-USERNAME.github.io/educarlos/
```

The trailing slash matters. Everything the app loads is a relative path, so it
works from a subfolder — but only if the browser knows it *is* a folder.

### 4. Put it on your phone

Open that URL in Safari on your phone → Share → **Add to Home Screen**. The app is
already configured for it: the mark becomes the icon, and it opens without Safari
chrome, full-screen, which is how the snap scrolling is meant to feel.

---

## Part 2 — the routine, from your phone

The Mac terminal is not the only way in, and it isn't the best one. Ranked:

### Route A — the Code tab in the Claude app (recommended, nothing to install)

There is no separate Claude Code app. It lives **inside the Claude app you already
have**, under the **Code** tab. Cloud sessions run on Anthropic's infrastructure
against a GitHub repo, so nothing runs on your Mac and nothing has to be downloaded,
pasted, or uploaded.

**One-time:** connect GitHub. Open claude.ai/code in a browser once and authorize
the Claude GitHub App during onboarding. (Alternatively, from the Mac terminal, run
`/web-setup` inside a Claude Code session to sync your existing GitHub token.)

**Then, from the phone, every time:**

1. Open the Claude app → **Code** tab → new session.
2. Pick the `educarlos` repo and a branch.
3. Say what you want: *"write lesson 3 of historia-es from the brief, run the
   validator, and open a PR"*.
4. Come back when it's done. Review the diff in the app — it shows `+42 -18` and
   you can leave inline comments and send them back.
5. **Create PR** from the session, then merge it. Pages redeploys off `main`.

Why it fits this project: **the pipeline lives inside the repo.** The skills in
`.claude/skills/` — `course-outline`, `lesson-research`, `write-lesson`,
`make-visual`, `check-content` — and the house rules in `docs/` are cloned with it.
A session opened from your phone gets the same instructions, the same
`docs/STYLE.md`, and the same `tools/validate.py` as a session at your desk. The
cloud sandbox has `python3`, which is all this project needs.

Worth knowing:

- Cloud sessions are a **research preview for Pro, Max and Team** plans. If you
  don't see a Code tab, that's why — use Route B or C.
- Work lands on a **branch, and you create the PR**; it does not push to `main` on
  its own. That's two taps, and it means nothing reaches the live site unreviewed.
- Sessions keep running with your phone in your pocket, and are waiting on your Mac
  when you get back — `claude --teleport` pulls one into the terminal.
- You can also ask it to watch the PR and fix CI failures on its own.

### Route B — Working Copy (a real git client on iOS)

For when you have a file in hand and want to place it yourself. Working Copy clones
the repo onto the phone and appears in the **Files** app, so any app that can "Save
to Files" can save straight into the repo.

1. Install Working Copy, clone `educarlos` (sign in to GitHub from inside the app).
2. Save or drop the file into the right folder — e.g.
   `content/historia-es/lessons/03-la-transicion.json`.
3. In Working Copy: **Commit** → type a message → **Push**.

Free to clone and browse; pushing is a one-time in-app purchase. This is the closest
thing to the terminal that exists on iOS, and it is the right tool if you want to
move files by hand regularly.

### Route C — the GitHub website

Nothing to install, fine for the occasional single file. On github.com in Safari:
navigate into the folder → **Add file** → **Upload files** → pick the file → commit.

It gets tedious with nested paths and more than one file, and there is no validator
in the loop. Use it as the fallback, not the habit.

### At the desk

When you are on the Mac, one command does all of it:

```bash
python3 tools/publish.py
```

It runs `tools/validate.py` and **stops if anything fails**, shows every changed
file, commits with a message describing what moved
(`publish: historia-es (3), visuals (1)`), pushes, and prints the live URL.
`python3 tools/publish.py --dry` validates and lists what *would* go, then stops.

---

## Why not Google Drive in the middle

It can be done and it is not worth it.

The workable version is a no-code automation — Zapier or Make — with a
**New File in Folder** trigger on Drive and a **Create or Update File** action on
GitHub. No server, no scripts. The free tiers poll every 15 minutes or so, which is
fine for a few lessons a week.

What you give up:

- **The validator never runs.** Whatever lands in Drive goes straight to the live
  site, malformed or not. That is the one guarantee worth keeping.
- **The path problem.** A lesson belongs at
  `content/<course>/lessons/<id>.json`. Drive folders are flat by comparison, so
  you end up encoding the path in the filename or building one Zap per course.
- **Silent failure.** When a Zap stops firing, nothing tells you. You will think
  a lesson is published when it isn't.

The version without a middleman — a scheduled GitHub Action pulling from the Drive
API — needs a Google Cloud project, a service account, the folder shared to it, and
its key in repo secrets. That is a lot of machinery to avoid two taps in Working
Copy, and it still can't run the validator before publishing.

### What about a connector instead?

The Claude app supports MCP connectors, and GitHub publishes one, so you *can* write
files to the repo from an ordinary chat without the Code tab. It is a real option if
your plan has no Code tab.

It is still second best here, for one reason: a plain chat has no sandbox, so
**nothing runs `tools/validate.py` before the file lands**. The Code tab has a
machine; a connector only has an API. Same reason Drive fails, arrived at from a
different direction.

**Recommendation:** skip Drive. Route A removes the file-shuffling entirely, which
is the actual thing you were trying to avoid.

---

## Two places, one repo

Once this is on GitHub, work happens in two places: **Claude Code tabs on your Mac**,
writing into `~/Desktop/EduCarlos`, and **cloud sessions from your phone**, writing
on GitHub. They do not know about each other. Three rules keep them from colliding:

1. **Push before you leave the desk.** Run `python3 tools/publish.py` when you stop
   working on the Mac. A phone session clones what is on GitHub, so anything still
   sitting only on your Mac is invisible to it.
2. **Pull before you start at the desk.** After merging a PR from your phone, run
   `git pull` on the Mac before the local tabs write anything else. Skip this and
   you get a conflict on the next push.
3. **One course at a time in one place.** Don't have a Mac tab and a phone session
   writing the same course at once. Different courses in parallel is fine — they
   touch different folders.

If a push is ever rejected, that is rule 2 being enforced. `git pull --rebase`, then
publish again.

## What gets uploaded

Everything except `.DS_Store`, `__pycache__/` and `*.log`, which `.gitignore`
already excludes. Specifically, all of this is meant to be public:

| | |
|---|---|
| `index.html`, `app/` | The app itself. |
| `content/` | Courses and lessons. The thing readers came for. |
| `visuals/` | The SVG diagrams. |
| `vendor/katex/` | Maths rendering, 600 KB. Committed on purpose — there is no npm on this machine and no build step, so the library has to be in the repo. |
| `research/` | Sourced briefs. Public on purpose: it is the receipts for the tax and legal claims. |
| `docs/`, `schema/`, `tools/` | House rules, JSON Schema, validator and this script. |
| `.nojekyll` | Tells Pages to serve the files as-is instead of running Jekyll over them. |

---

## Adding to the app, not just to a course

The home screen's shelves come from `content/index.json`. To add a course to an
existing shelf you do nothing beyond adding its id to `courses` — a section with a
`lang` picks up every course in that language automatically.

```json
{
  "courses": ["crypto-chains", "sociedades-es", "historia-es"],
  "sections": [
    { "id": "en", "badge": "EN", "title": "Courses in English", "lang": "en" }
  ]
}
```

A new shelf needs one entry in `sections`:

- `id` — the URL fragment, `#/s/<id>`
- `badge` — the glyph in the square. One or two characters.
- `title`, `subtitle` — what the card says
- `lang` — collects every course in that language, **or**
- `courses` — an explicit list of ids, for a shelf that isn't about language

The `misterio` shelf is the second kind, with an empty list. Fill in its `courses`
whenever you decide what it is; until then it shows "Coming soon" and is still
reachable.

---

## When something goes wrong

**Pages says "There isn't a GitHub Pages site here."** — The build hasn't finished,
or Settings → Pages was never saved. Check the Actions tab.

**The page loads but is blank.** — Almost always a missing trailing slash on the
URL, or a course id in `content/index.json` with no matching folder. Open the
browser console; the router prints the failing fetch.

**A push is rejected.** — Someone (you, elsewhere) pushed first. `git pull --rebase`
then `python3 tools/publish.py` again.
