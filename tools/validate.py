#!/usr/bin/env python3
"""Format + house-rule enforcement for all course content.

Exits non-zero if any ERROR is found. Warnings do not fail the build.
Rules come from docs/FORMAT.md ("Enforced limits") and docs/STYLE.md.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_WORDS = 80
MIN_SCREENS = 3
BLOCK_TYPES = {"prose", "visual", "formula", "code", "table",
               "callout", "steps", "reveal", "sources"}
TONES = {"key", "note", "warning", "gotcha"}

errors: list[str] = []
warnings: list[str] = []


def err(where: str, msg: str) -> None:
    errors.append(f"ERROR  {where}: {msg}")


def warn(where: str, msg: str) -> None:
    warnings.append(f"WARN   {where}: {msg}")


INLINE = re.compile(r"`[^`]*`|\[([^\]]*)\]\([^)]*\)|\*\*|_|\$[^$]*\$")


def words(text: str) -> int:
    """Prose words, ignoring markup and math."""
    stripped = INLINE.sub(lambda m: m.group(1) or " ", text)
    return len([w for w in stripped.split() if any(c.isalnum() for c in w)])


def check_dollars(where: str, text: str) -> None:
    if text.count("$") % 2:
        err(where, f"unbalanced $ in {text[:40]!r}")


def walk_text(block: dict):
    """Every user-visible string in a block, for the $-balance check."""
    for key in ("text", "answer"):
        for t in block.get(key, []) or []:
            yield t
    for key in ("heading", "eyebrow", "caption", "question", "label", "title", "alt"):
        if isinstance(block.get(key), str):
            yield block[key]
    for row in block.get("rows", []) or []:
        for cell in row:
            yield str(cell)
    for col in block.get("columns", []) or []:
        yield str(col)
    for item in block.get("items", []) or []:
        if isinstance(item, dict):
            for v in item.values():
                if isinstance(v, str):
                    yield v


def validate_lesson(path: Path, course_id: str, needs_sources: bool) -> None:
    where = path.relative_to(ROOT).as_posix()
    try:
        lesson = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        err(where, f"JSON inválido: {exc}")
        return

    for field in ("id", "courseId", "chapterId", "title", "screens"):
        if field not in lesson:
            err(where, f"falta el campo obligatorio {field!r}")
    if lesson.get("id") != path.stem:
        err(where, f"id {lesson.get('id')!r} != nombre de archivo {path.stem!r}")
    if lesson.get("courseId") != course_id:
        err(where, f"courseId {lesson.get('courseId')!r} != {course_id!r}")

    reviewed = lesson.get("reviewedOn")
    if needs_sources:
        if not reviewed:
            err(where, "needsSources: falta reviewedOn")
        elif not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(reviewed)):
            err(where, f"reviewedOn {reviewed!r} no es YYYY-MM-DD")
        elif date.fromisoformat(reviewed) < date.today() - timedelta(days=365):
            warn(where, f"reviewedOn {reviewed} tiene más de un año")

    screens = lesson.get("screens", [])
    if len(screens) < MIN_SCREENS:
        err(where, f"{len(screens)} pantallas, mínimo {MIN_SCREENS}")

    has_sources = False
    for i, screen in enumerate(screens, 1):
        at = f"{where} pantalla {i}"
        if screen.get("kind") not in (None, "title"):
            err(at, f"kind {screen['kind']!r} no válido")
        if screen.get("kind") == "title" and i != 1:
            err(at, "kind 'title' sólo en la primera pantalla")

        blocks = screen.get("blocks", [])
        if not blocks:
            err(at, "pantalla sin bloques")
        visuals = word_count = 0
        for block in blocks:
            btype = block.get("type")
            if btype not in BLOCK_TYPES:
                err(at, f"tipo de bloque desconocido: {btype!r}")
                continue
            if btype == "visual":
                visuals += 1
                src = block.get("src", "")
                if not (ROOT / src).exists():
                    err(at, f"visual inexistente: {src}")
                if not block.get("alt"):
                    err(at, "visual sin alt")
            if btype == "callout" and block.get("tone") not in TONES | {None}:
                err(at, f"tone {block.get('tone')!r} no válido")
            if btype == "table":
                ncols = len(block.get("columns", []))
                for row in block.get("rows", []):
                    if len(row) != ncols:
                        err(at, f"fila con {len(row)} celdas, se esperaban {ncols}")
            if btype == "sources":
                has_sources = True
                if not block.get("items"):
                    err(at, "bloque sources vacío")
            if btype in ("prose", "callout"):
                word_count += sum(words(t) for t in block.get("text", []) or [])
            for text in walk_text(block):
                check_dollars(at, text)

        if visuals > 1:
            err(at, f"{visuals} visuales, máximo 1")
        if word_count > MAX_WORDS:
            err(at, f"{word_count} palabras de prosa, máximo {MAX_WORDS}")

    if needs_sources and not has_sources:
        err(where, "needsSources: la lección no tiene bloque sources")


def validate_course(course_id: str) -> None:
    cdir = ROOT / "content" / course_id
    cpath = cdir / "course.json"
    where = cpath.relative_to(ROOT).as_posix()
    if not cpath.exists():
        err(where, "no existe")
        return
    course = json.loads(cpath.read_text(encoding="utf-8"))

    if course.get("id") != course_id:
        err(where, f"id {course.get('id')!r} != directorio {course_id!r}")
    if course.get("lang") not in ("es", "en"):
        err(where, f"lang {course.get('lang')!r} no válido")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", course.get("accent", "")):
        err(where, f"accent {course.get('accent')!r} no es #rrggbb")
    needs_sources = bool(course.get("needsSources"))
    if needs_sources and not course.get("disclaimer"):
        err(where, "needsSources sin disclaimer")

    listed: list[str] = []
    seen_chapters: set[str] = set()
    for chapter in course.get("chapters", []):
        cid = chapter.get("id")
        if cid in seen_chapters:
            err(where, f"capítulo duplicado: {cid}")
        seen_chapters.add(cid)
        for lesson in chapter.get("lessons", []):
            lid = lesson.get("id")
            listed.append(lid)
            for field in ("id", "title", "summary"):
                if not lesson.get(field):
                    err(where, f"{lid}: falta {field!r} en el manifiesto")
            lpath = cdir / "lessons" / f"{lid}.json"
            if not lpath.exists():
                err(where, f"la lección {lid!r} del manifiesto no tiene archivo")
                continue
            validate_lesson(lpath, course_id, needs_sources)
            chapter_id = json.loads(lpath.read_text(encoding="utf-8")).get("chapterId")
            if chapter_id != cid:
                err(f"{lid}", f"chapterId {chapter_id!r} != capítulo {cid!r}")

    if len(listed) != len(set(listed)):
        err(where, "hay ids de lección repetidos en el manifiesto")
    on_disk = {p.stem for p in (cdir / "lessons").glob("*.json")}
    for orphan in sorted(on_disk - set(listed)):
        err(where, f"lección huérfana, no está en el manifiesto: {orphan}")


def check_orphan_visuals(course_ids: list[str]) -> None:
    used = set()
    for path in (ROOT / "content").rglob("lessons/*.json"):
        used |= set(re.findall(r'"src":\s*"([^"]+)"', path.read_text(encoding="utf-8")))
    for course_id in course_ids:
        vdir = ROOT / "visuals" / course_id
        if not vdir.exists():
            continue
        for svg in sorted(vdir.glob("*.svg")):
            rel = svg.relative_to(ROOT).as_posix()
            if rel not in used:
                warn(rel, "visual huérfano, ninguna lección lo referencia")
            text = svg.read_text(encoding="utf-8")
            if re.search(r'(?<!&)#[0-9a-fA-F]{3,6}\b', text):
                err(rel, "color literal en el SVG; usa las clases compartidas")
            if re.search(r'\b(width|height)=', text.split(">")[0]):
                err(rel, "el <svg> no debe llevar width/height")
            if not re.search(r'viewBox="0 0 300 ', text):
                err(rel, 'viewBox debe ser "0 0 300 H"')
            for size in re.findall(r'font-size="(\d+(?:\.\d+)?)"', text):
                if float(size) < 9:
                    err(rel, f"font-size {size}, mínimo 9")


def main() -> int:
    index = json.loads((ROOT / "content" / "index.json").read_text(encoding="utf-8"))
    course_ids = index.get("courses", [])
    for course_id in course_ids:
        validate_course(course_id)
    check_orphan_visuals(course_ids)

    for line in warnings:
        print(line)
    for line in errors:
        print(line)
    print(f"\n{len(course_ids)} cursos · {len(errors)} errores · {len(warnings)} avisos")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
