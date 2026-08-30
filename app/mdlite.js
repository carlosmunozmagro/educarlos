/* Inline markdown-lite -> HTML.
   Supported: **bold**  _italic_  `code`  [text](url)  $math$
   Everything else is escaped. Never pass raw content to innerHTML
   without going through here. */

// Placeholder marker for spans that must survive escaping untouched.
const S = String.fromCharCode(1);

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Only allow schemes that cannot execute script. */
function safeUrl(u) {
  const t = String(u).trim();
  if (/^(https?:|mailto:)/i.test(t)) return t;
  if (/^(#|\/|\.\/|\.\.\/)/.test(t)) return t;
  return '#';
}

export function math(src, display = false) {
  if (typeof window.katex === 'undefined') return escapeHtml(src);
  try {
    return window.katex.renderToString(String(src), {
      displayMode: display, throwOnError: false, strict: 'ignore', output: 'html'
    });
  } catch (e) {
    console.warn('katex failed:', src, e);
    return '<code>' + escapeHtml(src) + '</code>';
  }
}

export function inline(text) {
  if (text == null) return '';
  const held = [];
  const hold = (html) => { held.push(html); return S + (held.length - 1) + S; };

  // 1. Pull out spans whose contents must NOT be escaped or re-parsed.
  let s = String(text).replace(/\$([^$\n]+)\$|`([^`\n]+)`/g, (m, tex, code) =>
    tex != null ? hold(math(tex, false)) : hold('<code>' + escapeHtml(code) + '</code>')
  );

  // 2. Escape everything that is left.
  s = escapeHtml(s);

  // 3. Apply the remaining inline grammar.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
        (m, label, url) => '<a href="' + escapeHtml(safeUrl(url)) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>')
       .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
       .replace(/(^|[\s(])_([^_]+)_(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');

  // 4. Put the protected spans back.
  return s.replace(new RegExp(S + '(\\d+)' + S, 'g'), (m, i) => held[+i]);
}

/* Convenience: an array of strings -> <p> elements. */
export function paragraphs(list) {
  return (Array.isArray(list) ? list : [list]).map(t => '<p>' + inline(t) + '</p>').join('');
}
