export function Markdown({ text }) {
  if (!text) return null;

  const inlineFormat = (str, keyPfx) => {
    const parts = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let last = 0, m, ki = 0;
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) parts.push(str.slice(last, m.index));
      if (m[0].startsWith("**"))     parts.push(<strong key={keyPfx+ki++}>{m[2]}</strong>);
      else if (m[0].startsWith("*")) parts.push(<em key={keyPfx+ki++}>{m[3]}</em>);
      else if (m[0].startsWith("`")) parts.push(<code key={keyPfx+ki++}>{m[4]}</code>);
      else if (m[0].startsWith("[")) parts.push(<a key={keyPfx+ki++} href={m[6]} target="_blank" rel="noreferrer">{m[5]}</a>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(str.slice(last));
    return parts.length ? parts : str;
  };

  const lines = text.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const l = lines[i];

    if (l.startsWith("```")) {
      const lang = l.slice(3).trim();
      const codeBuf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeBuf.push(lines[i]); i++; }
      out.push(
        <div key={`cb${i}`} className="md-code-wrap">
          {lang && <div className="md-code-lang">{lang}</div>}
          <pre><code>{codeBuf.join("\n")}</code></pre>
        </div>
      );
      i++; continue;
    }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(l.trim())) {
      out.push(<hr key={`hr${i}`} className="md-hr"/>); i++; continue;
    }

    const h = l.match(/^(#{1,3})\s+(.+)/);
    if (h) {
      const lvl = h[1].length;
      const Tag = `h${lvl}`;
      out.push(<Tag key={`h${i}`} className={`md-h${lvl}`}>{inlineFormat(h[2], `h${i}`)}</Tag>);
      i++; continue;
    }

    if (l.startsWith("> ")) {
      const bqLines = [];
      while (i < lines.length && lines[i].startsWith("> ")) { bqLines.push(lines[i].slice(2)); i++; }
      out.push(<blockquote key={`bq${i}`} className="md-bq">{bqLines.map((bl,bi)=><p key={bi}>{inlineFormat(bl,`bq${i}${bi}`)}</p>)}</blockquote>);
      continue;
    }

    if (/^[-*+]\s/.test(l)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(<li key={i}>{inlineFormat(lines[i].replace(/^[-*+]\s/,""), `ul${i}`)}</li>);
        i++;
      }
      out.push(<ul key={`ul${i}`} className="md-ul">{items}</ul>);
      continue;
    }

    if (/^\d+\.\s/.test(l)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i}>{inlineFormat(lines[i].replace(/^\d+\.\s/,""), `ol${i}`)}</li>);
        i++;
      }
      out.push(<ol key={`ol${i}`} className="md-ol">{items}</ol>);
      continue;
    }

    if (l.includes("|") && l.trim().startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().startsWith("|")) {
        rows.push(lines[i]); i++;
      }
      const isHeader = rows[1] && /^[|\s:-]+$/.test(rows[1]);
      const dataRows = isHeader ? [rows[0], ...rows.slice(2)] : rows;
      const parsed = dataRows.map(r => r.replace(/^\||\|$/g,"").split("|").map(c=>c.trim()));
      out.push(
        <div key={`tbl${i}`} className="md-table-wrap">
          <table className="md-table">
            {isHeader && <thead><tr>{parsed[0].map((c,ci)=><th key={ci}>{inlineFormat(c,`th${i}${ci}`)}</th>)}</tr></thead>}
            <tbody>{(isHeader?parsed.slice(1):parsed).map((row,ri)=><tr key={ri}>{row.map((c,ci)=><td key={ci}>{inlineFormat(c,`td${i}${ri}${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    if (l.trim() === "") { i++; continue; }
    out.push(<p key={`p${i}`} className="md-p">{inlineFormat(l, `p${i}`)}</p>);
    i++;
  }

  return <div className="md">{out}</div>;
}