#!/usr/bin/env python3
"""Format and house-rule checks across all content.

Exits non-zero on any error. Warnings do not fail the build.

    python3 tools/validate.py            # everything
    python3 tools/validate.py crypto-chains

The rules enforced here are the mechanical half of docs/STYLE.md and the
"enforced limits" table in docs/FORMAT.md. The half a machine cannot check -
arc, voice, whether the case is real - is what check-content reads for.
"""
import json
import os
import re
import sys
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCKS = {
    "prose": {"eyebrow", "heading", "text"},
    "visual": {"src", "alt", "caption"},
    "formula": {"tex", "caption"},
    "code": {"code", "label", "lang"},
    "table": {"columns", "rows", "caption"},
    "callout": {"text", "tone", "title"},
    "steps": {"items"},
    "reveal": {"question", "answer"},
    "sources": {"items"},
}
TONES = {"key", "note", "warning", "gotcha"}
MAX_WORDS = 80
MD_LINK = re.compile(r"\[([^\]]*)\]\(([^)]*)\)")
MD_MARK = re.compile(r"[*_`]")

errors, warnings = [], []


def err(where, msg):
    errors.append(f"{where}: {msg}")


def warn(where, msg):
    warnings.append(f"{where}: {msg}")


def load(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError as e:
            err(path, f"not valid JSON: {e}")
            return None


def words(s):
    """Prose word count as a reader meets it: markup stripped, links to text."""
    s = MD_LINK.sub(r"\1", str(s))
    s = re.sub(r"\$[^$]*\$", "M", s)
    s = MD_MARK.sub("", s)
    return len([w for w in s.split() if w.strip()])


def check_text_fields(where, block):
    """Balanced $ and no stray markup that mdlite would render as itself."""
    for key, val in block.items():
        vals = val if isinstance(val, list) else [val]
        for v in vals:
            if isinstance(v, dict):
                vals.extend(v.values())
                continue
            if not isinstance(v, str):
                continue
            if v.count("$") % 2:
                err(where, f"unbalanced $ in {key}: {v[:50]!r}")


def check_block(where, b, seen_visuals):
    t = b.get("type")
    if t not in BLOCKS:
        err(where, f"unknown block type {t!r}")
        return 0, 0
    extra = set(b) - BLOCKS[t] - {"type"}
    if extra:
        err(where, f"{t} block has unknown fields {sorted(extra)}")
    check_text_fields(where, b)

    n_words, n_visual = 0, 0
    if t == "prose":
        n_words = sum(words(x) for x in b.get("text", []))
    elif t == "callout":
        n_words = sum(words(x) for x in b.get("text", []))
        if b.get("tone") and b["tone"] not in TONES:
            err(where, f"callout tone {b['tone']!r} not in {sorted(TONES)}")
    elif t == "visual":
        n_visual = 1
        src = b.get("src", "")
        if not os.path.exists(os.path.join(ROOT, src)):
            err(where, f"visual src does not exist: {src}")
        seen_visuals.add(src)
        if not b.get("alt"):
            err(where, "visual has no alt text")
    elif t == "table":
        cols = len(b.get("columns", []))
        for i, row in enumerate(b.get("rows", [])):
            if len(row) != cols:
                err(where, f"table row {i} has {len(row)} cells, {cols} columns")
    elif t == "reveal":
        if not b.get("question") or not b.get("answer"):
            err(where, "reveal needs both question and answer")
    elif t == "sources":
        if not b.get("items"):
            err(where, "sources block is empty")
    return n_words, n_visual


def check_lesson(course, meta, path, seen_visuals):
    where = path
    d = load(path)
    if d is None:
        return
    for f in ("id", "courseId", "chapterId", "title", "screens"):
        if f not in d:
            err(where, f"missing field {f!r}")
    if d.get("courseId") != course:
        err(where, f"courseId {d.get('courseId')!r} != {course!r}")
    if d.get("id") != os.path.basename(path)[:-5]:
        err(where, "id does not match filename")

    reviewed = d.get("reviewedOn")
    if meta.get("needsSources") and not reviewed:
        err(where, "needsSources course, but no reviewedOn")
    if reviewed:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", reviewed):
            err(where, f"reviewedOn {reviewed!r} is not YYYY-MM-DD")
        elif date.fromisoformat(reviewed) < date.today() - timedelta(days=365):
            warn(where, f"reviewedOn {reviewed} is over a year old")

    screens = d.get("screens", [])
    if len(screens) < 3:
        err(where, f"{len(screens)} screens, minimum is 3")
    if not (8 <= len(screens) <= 16):
        warn(where, f"{len(screens)} screens, house style asks for 8-16")

    has_sources = False
    for i, s in enumerate(screens):
        w = f"{path} screen {i + 1}"
        if s.get("kind") not in (None, "title"):
            err(w, f"unknown screen kind {s['kind']!r}")
        if s.get("kind") == "title" and i:
            err(w, "kind 'title' is for the opening screen only")
        tw = tv = 0
        for b in s.get("blocks", []):
            bw, bv = check_block(w, b, seen_visuals)
            tw += bw
            tv += bv
            has_sources |= b.get("type") == "sources"
        if tw > MAX_WORDS:
            err(w, f"{tw} words of prose, limit is {MAX_WORDS}")
        if tv > 1:
            err(w, f"{tv} visuals, limit is 1")
    if not has_sources:
        err(where, "no sources block anywhere in the lesson")


def check_course(course):
    base = f"content/{course}"
    meta = load(f"{base}/course.json")
    if meta is None:
        return
    if meta.get("id") != course:
        err(base, "course id does not match its directory")
    if meta.get("needsSources") and not meta.get("disclaimer"):
        err(base, "needsSources is true but there is no disclaimer")

    seen_visuals = set()
    listed = []
    for ch in meta.get("chapters", []):
        for les in ch.get("lessons", []):
            listed.append(les["id"])
            path = f"{base}/lessons/{les['id']}.json"
            if not os.path.exists(os.path.join(ROOT, path)):
                warn(base, f"outlined but not written yet: {les['id']}")
                continue
            check_lesson(course, meta, path, seen_visuals)

    ldir = os.path.join(ROOT, base, "lessons")
    for name in sorted(os.listdir(ldir)) if os.path.isdir(ldir) else []:
        if name.endswith(".json") and name[:-5] not in listed:
            err(base, f"lesson file not in the manifest: {name}")

    vdir = os.path.join(ROOT, "visuals", course)
    for name in sorted(os.listdir(vdir)) if os.path.isdir(vdir) else []:
        rel = f"visuals/{course}/{name}"
        if rel not in seen_visuals:
            warn(rel, "orphan visual, no lesson references it")
        check_svg(rel)


HEX = re.compile(r'(?:fill|stroke|stop-color)\s*[:=]\s*"?\s*(#[0-9a-fA-F]{3,8})')


def check_svg(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        svg = f.read()
    if not re.search(r'viewBox="0 0 300 \d+"', svg):
        err(rel, 'viewBox must be "0 0 300 H"')
    if re.search(r"<svg[^>]*\s(width|height)=", svg):
        err(rel, "svg must not set width or height")
    for hexval in HEX.findall(svg):
        err(rel, f"hardcoded colour {hexval}, use the shared classes")
    if "font-family" in svg:
        err(rel, "font-family must be inherited, not set")
    for size in re.findall(r'font-size="(\d+(?:\.\d+)?)"', svg):
        if float(size) < 9:
            err(rel, f"font-size {size} is below the legibility floor of 9")


def main():
    wanted = sys.argv[1:] or load("content/index.json")["courses"]
    for course in wanted:
        check_course(course)
    for w in warnings:
        print(f"warn  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(f"\n{len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
