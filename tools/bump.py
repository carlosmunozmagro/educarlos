#!/usr/bin/env python3
"""Stamp a new build id on every module URL.

There is no build step here, so the browser caches app/*.js by URL and nothing
ever tells it they changed. A phone that has revalidated content/index.json
(fetched with no-cache) while still running last week's main.js is not a
hypothetical: it renders the new sections through the old router, and the
result looks like a bug in the content.

So every module carries ?v=<build id>, in the entry <script> and in every
relative import. Changing the id changes every URL at once, which is the only
thing a cache respects. Run this before publishing:

    python3 tools/bump.py

It rewrites index.html and app/*.js in place and prints the new id. The
stylesheet is stamped the same way; vendor/ is not, being pinned already.
"""

import datetime, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = datetime.datetime.now().strftime('%Y%m%d%H%M')

# An app-owned asset URL: a relative import, the entry <script>, or the
# stylesheet link - with or without an existing ?v= stamp. vendor/ is left
# alone: it is pinned and never changes under the same name.
URL = re.compile(r"""(?P<q>['"])(?P<path>(?:\./|app/)[\w./-]+\.(?:js|css))(?:\?v=[\w.-]+)?(?P=q)""")

def stamp(text):
    return URL.sub(lambda m: f"{m['q']}{m['path']}?v={BUILD}{m['q']}", text)

changed = []
for f in [ROOT / 'index.html', *sorted((ROOT / 'app').glob('*.js'))]:
    old = f.read_text()
    new = stamp(old)
    if new != old:
        f.write_text(new)
        changed.append(f.relative_to(ROOT))

print('build', BUILD)
for f in changed:
    print('  stamped', f)
if not changed:
    print('  nothing to stamp', file=sys.stderr)
