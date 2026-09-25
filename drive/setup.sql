-- Educarlos · Drive HTML
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Solo una vez.
-- Crea las dos tablas, deja que la web lea y añada (pero no borre ni cambie),
-- y mete los dos archivos de ejemplo.

create table if not exists drive_files (
  id          text primary key,
  title       text not null,
  subtitle    text not null default '',
  accent      text not null default '#3a8ef0',
  created_at  timestamptz not null default now()
);

create table if not exists drive_versions (
  id             bigint generated always as identity primary key,
  file_id        text not null references drive_files(id),
  n              int  not null,
  by             text not null default 'Anónimo',
  note           text not null default '',
  html           text not null,
  bytes          int  not null default 0,
  restored_from  int,
  created_at     timestamptz not null default now(),
  unique (file_id, n)
);

-- La web entra como "anon": puede leer y añadir, nunca cambiar ni borrar.
alter table drive_files    enable row level security;
alter table drive_versions enable row level security;

drop policy if exists "leer"   on drive_files;
drop policy if exists "anadir" on drive_files;
drop policy if exists "leer"   on drive_versions;
drop policy if exists "anadir" on drive_versions;
create policy "leer"   on drive_files    for select to anon using (true);
create policy "anadir" on drive_files    for insert to anon with check (true);
create policy "leer"   on drive_versions for select to anon using (true);
create policy "anadir" on drive_versions for insert to anon with check (true);

grant select, insert on drive_files, drive_versions to anon;

-- Ejemplos
insert into drive_files (id, title, subtitle, accent) values
  ('calendario', 'Calendario', 'Ejemplo: el mes de octubre del equipo.', '#3a8ef0'),
  ('documento', 'Documento de ejemplo', 'Un texto corto para practicar subidas y versiones.', '#46c08a')
on conflict (id) do nothing;

insert into drive_versions (file_id, n, by, note, html, bytes, created_at) values
  ('calendario', 1, 'Carlos', 'Primera versión de ejemplo', $html$<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Calendario · Octubre 2026</title>
<style>
  :root { --ink:#1d2330; --dim:#6b7383; --line:#e4e7ec; --bg:#f7f8fa;
          --a:#3a8ef0; --b:#46c08a; --c:#f0a13a; }
  * { box-sizing:border-box; }
  body { margin:0; padding:24px 16px; font:15px/1.4 -apple-system,Segoe UI,Inter,sans-serif;
         color:var(--ink); background:var(--bg); }
  main { max-width:900px; margin:0 auto; }
  h1 { margin:0 0 4px; font-size:26px; }
  p.sub { margin:0 0 18px; color:var(--dim); }
  table { width:100%; border-collapse:collapse; table-layout:fixed; background:#fff;
          border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  th { padding:8px 4px; font-size:12px; text-transform:uppercase; letter-spacing:.06em;
       color:var(--dim); border-bottom:1px solid var(--line); }
  td { vertical-align:top; height:92px; padding:6px; border:1px solid var(--line); }
  td.off { background:#fafbfc; }
  .d { font-weight:600; font-size:13px; }
  .ev { margin-top:4px; padding:2px 6px; border-radius:6px; font-size:11.5px; color:#fff;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ev.a { background:var(--a); } .ev.b { background:var(--b); } .ev.c { background:var(--c); }
  .legend { display:flex; gap:14px; margin-top:14px; font-size:13px; color:var(--dim); flex-wrap:wrap; }
  .legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; }
  @media (max-width:560px) { td { height:64px; padding:3px; } .ev { font-size:9.5px; padding:1px 3px; } }
</style>
</head>
<body>
<main>
  <h1>Octubre 2026</h1>
  <p class="sub">Calendario de ejemplo del equipo.</p>
  <table>
    <thead><tr><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th><th>Dom</th></tr></thead>
    <tbody>
      <tr><td class="off"></td><td class="off"></td><td class="off"></td><td><span class="d">1</span><div class="ev a">Arranque del trimestre</div></td><td><span class="d">2</span></td><td><span class="d">3</span></td><td><span class="d">4</span></td></tr>
      <tr><td><span class="d">5</span></td><td><span class="d">6</span><div class="ev a">Reunión de equipo</div></td><td><span class="d">7</span></td><td><span class="d">8</span></td><td><span class="d">9</span></td><td><span class="d">10</span></td><td><span class="d">11</span></td></tr>
      <tr><td><span class="d">12</span><div class="ev c">Festivo</div></td><td><span class="d">13</span><div class="ev a">Reunión de equipo</div></td><td><span class="d">14</span></td><td><span class="d">15</span></td><td><span class="d">16</span><div class="ev b">Entrega informe</div></td><td><span class="d">17</span></td><td><span class="d">18</span></td></tr>
      <tr><td><span class="d">19</span></td><td><span class="d">20</span><div class="ev a">Reunión de equipo</div></td><td><span class="d">21</span></td><td><span class="d">22</span></td><td><span class="d">23</span></td><td><span class="d">24</span></td><td><span class="d">25</span></td></tr>
      <tr><td><span class="d">26</span></td><td><span class="d">27</span><div class="ev a">Reunión de equipo</div></td><td><span class="d">28</span></td><td><span class="d">29</span></td><td><span class="d">30</span><div class="ev b">Cierre de mes</div></td><td><span class="d">31</span></td><td class="off"></td></tr>
    </tbody>
  </table>
  <div class="legend">
    <span><i style="background:var(--a)"></i>Reuniones</span>
    <span><i style="background:var(--b)"></i>Entregas</span>
    <span><i style="background:var(--c)"></i>Personal</span>
  </div>
</main>
</body>
</html>
$html$, 3693, '2026-09-25T09:00:00Z'),
  ('calendario', 2, 'Carlos', 'Añadidas la revisión de presupuesto y la comida de equipo', $html$<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Calendario · Octubre 2026</title>
<style>
  :root { --ink:#1d2330; --dim:#6b7383; --line:#e4e7ec; --bg:#f7f8fa;
          --a:#3a8ef0; --b:#46c08a; --c:#f0a13a; }
  * { box-sizing:border-box; }
  body { margin:0; padding:24px 16px; font:15px/1.4 -apple-system,Segoe UI,Inter,sans-serif;
         color:var(--ink); background:var(--bg); }
  main { max-width:900px; margin:0 auto; }
  h1 { margin:0 0 4px; font-size:26px; }
  p.sub { margin:0 0 18px; color:var(--dim); }
  table { width:100%; border-collapse:collapse; table-layout:fixed; background:#fff;
          border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  th { padding:8px 4px; font-size:12px; text-transform:uppercase; letter-spacing:.06em;
       color:var(--dim); border-bottom:1px solid var(--line); }
  td { vertical-align:top; height:92px; padding:6px; border:1px solid var(--line); }
  td.off { background:#fafbfc; }
  .d { font-weight:600; font-size:13px; }
  .ev { margin-top:4px; padding:2px 6px; border-radius:6px; font-size:11.5px; color:#fff;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ev.a { background:var(--a); } .ev.b { background:var(--b); } .ev.c { background:var(--c); }
  .legend { display:flex; gap:14px; margin-top:14px; font-size:13px; color:var(--dim); flex-wrap:wrap; }
  .legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; }
  @media (max-width:560px) { td { height:64px; padding:3px; } .ev { font-size:9.5px; padding:1px 3px; } }
</style>
</head>
<body>
<main>
  <h1>Octubre 2026</h1>
  <p class="sub">Calendario de ejemplo del equipo. Actualizado con dos citas nuevas.</p>
  <table>
    <thead><tr><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th><th>Dom</th></tr></thead>
    <tbody>
      <tr><td class="off"></td><td class="off"></td><td class="off"></td><td><span class="d">1</span><div class="ev a">Arranque del trimestre</div></td><td><span class="d">2</span></td><td><span class="d">3</span></td><td><span class="d">4</span></td></tr>
      <tr><td><span class="d">5</span></td><td><span class="d">6</span><div class="ev a">Reunión de equipo</div></td><td><span class="d">7</span></td><td><span class="d">8</span><div class="ev c">Revisión de presupuesto</div></td><td><span class="d">9</span></td><td><span class="d">10</span></td><td><span class="d">11</span></td></tr>
      <tr><td><span class="d">12</span><div class="ev c">Festivo</div></td><td><span class="d">13</span><div class="ev a">Reunión de equipo</div></td><td><span class="d">14</span></td><td><span class="d">15</span></td><td><span class="d">16</span><div class="ev b">Entrega informe</div></td><td><span class="d">17</span></td><td><span class="d">18</span></td></tr>
      <tr><td><span class="d">19</span></td><td><span class="d">20</span><div class="ev a">Reunión de equipo</div></td><td><span class="d">21</span></td><td><span class="d">22</span><div class="ev c">Comida de equipo</div></td><td><span class="d">23</span></td><td><span class="d">24</span></td><td><span class="d">25</span></td></tr>
      <tr><td><span class="d">26</span></td><td><span class="d">27</span><div class="ev a">Reunión de equipo</div></td><td><span class="d">28</span></td><td><span class="d">29</span></td><td><span class="d">30</span><div class="ev b">Cierre de mes</div></td><td><span class="d">31</span></td><td class="off"></td></tr>
    </tbody>
  </table>
  <div class="legend">
    <span><i style="background:var(--a)"></i>Reuniones</span>
    <span><i style="background:var(--b)"></i>Entregas</span>
    <span><i style="background:var(--c)"></i>Personal</span>
  </div>
</main>
</body>
</html>
$html$, 3815, '2026-09-25T09:30:00Z'),
  ('documento', 1, 'Carlos', 'Primera versión de ejemplo', $html$<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Documento de ejemplo</title>
<style>
  body { margin:0; padding:32px 18px; background:#f7f8fa; color:#1d2330;
         font:16px/1.65 Georgia, "Times New Roman", serif; }
  article { max-width:680px; margin:0 auto; background:#fff; padding:36px 32px;
            border:1px solid #e4e7ec; border-radius:12px; }
  h1 { font:700 28px/1.2 -apple-system,Segoe UI,Inter,sans-serif; margin:0 0 6px; }
  .meta { font:13px -apple-system,Segoe UI,Inter,sans-serif; color:#6b7383; margin-bottom:24px; }
  h2 { font:600 18px/1.3 -apple-system,Segoe UI,Inter,sans-serif; margin:28px 0 8px; }
  ul { padding-left:20px; }
  .box { background:#eef5fe; border-left:4px solid #3a8ef0; padding:12px 16px; border-radius:6px; }
  table { border-collapse:collapse; width:100%; font:14px -apple-system,Segoe UI,Inter,sans-serif; }
  th, td { border-bottom:1px solid #e4e7ec; padding:8px 6px; text-align:left; }
  @media (max-width:560px) { article { padding:22px 18px; } }
</style>
</head>
<body>
<article>
  <h1>Documento de ejemplo</h1>
  <div class="meta">Borrador · para probar el Drive HTML</div>

  <p>Este es un documento de prueba. La idea es que cualquiera del equipo pueda
  descargarlo, cambiarlo en su ordenador (a mano o con la IA) y subir su versión.
  El enlace de arriba siempre enseña la última.</p>

  <div class="box">Prueba a cambiar este recuadro, subir el archivo y ver cómo aparece
  en el historial con tu nombre.</div>

  <h2>Objetivos</h2>
  <ul>
    <li>Tener un único sitio con la versión buena de cada archivo.</li>
    <li>Saber quién cambió qué y cuándo.</li>
    <li>Poder volver atrás si algo sale mal.</li>
  </ul>

  <h2>Tareas</h2>
  <table>
    <thead><tr><th>Tarea</th><th>Quién</th><th>Estado</th></tr></thead>
    <tbody>
      <tr><td>Revisar el calendario</td><td>—</td><td>Pendiente</td></tr>
      <tr><td>Subir una versión nueva</td><td>—</td><td>Pendiente</td></tr>
      <tr><td>Recuperar una versión antigua</td><td>—</td><td>Pendiente</td></tr>
    </tbody>
  </table>
</article>
</body>
</html>
$html$, 2183, '2026-09-25T09:15:00Z')
on conflict (file_id, n) do nothing;
