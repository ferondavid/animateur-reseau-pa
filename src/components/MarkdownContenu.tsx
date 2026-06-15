import React from "react";

// Rendu Markdown léger → éléments React. Pas de "use client" : utilisable
// côté serveur (page publique) comme côté client (aperçu de l'éditeur).
// Sous-ensemble géré : titres (#/##/###), gras (**), italique (*), code (`),
// liens [txt](url), listes à puces (- / *), listes numérotées (1.), citations (>).

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/;
  let rest = text;
  let i = 0;
  while (rest.length) {
    const m = re.exec(rest);
    if (!m) {
      nodes.push(rest);
      break;
    }
    if (m.index > 0) nodes.push(rest.slice(0, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[1]) nodes.push(<strong key={k}>{m[2]}</strong>);
    else if (m[3]) nodes.push(<em key={k}>{m[4]}</em>);
    else if (m[5])
      nodes.push(
        <code
          key={k}
          style={{ background: "rgba(107,79,216,.08)", color: "#5A43C0", padding: "1px 5px", borderRadius: 6, fontSize: "0.9em" }}
        >
          {m[6]}
        </code>
      );
    else if (m[7])
      nodes.push(
        <a key={k} href={m[9]} target="_blank" rel="noreferrer" style={{ color: "#6B4FD8", textDecoration: "underline" }}>
          {m[8]}
        </a>
      );
    rest = rest.slice(m.index + m[0].length);
  }
  return nodes;
}

export default function MarkdownContenu({ source, className }: { source: string; className?: string }) {
  const lines = (source ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let ul: string[] = [];
  let ol: string[] = [];
  let quote: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (!para.length) return;
    const k = `p-${key++}`;
    blocks.push(
      <p key={k} style={{ color: "var(--pa-ink)", lineHeight: 1.7, margin: "0 0 14px" }}>
        {para.map((l, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(l, `${k}-${idx}`)}
          </React.Fragment>
        ))}
      </p>
    );
    para = [];
  };
  const flushUl = () => {
    if (!ul.length) return;
    const k = `ul-${key++}`;
    blocks.push(
      <ul key={k} style={{ color: "var(--pa-ink)", lineHeight: 1.7, margin: "0 0 14px", paddingLeft: 22, listStyle: "disc" }}>
        {ul.map((l, idx) => (
          <li key={idx} style={{ marginBottom: 4 }}>{renderInline(l, `${k}-${idx}`)}</li>
        ))}
      </ul>
    );
    ul = [];
  };
  const flushOl = () => {
    if (!ol.length) return;
    const k = `ol-${key++}`;
    blocks.push(
      <ol key={k} style={{ color: "var(--pa-ink)", lineHeight: 1.7, margin: "0 0 14px", paddingLeft: 22, listStyle: "decimal" }}>
        {ol.map((l, idx) => (
          <li key={idx} style={{ marginBottom: 4 }}>{renderInline(l, `${k}-${idx}`)}</li>
        ))}
      </ol>
    );
    ol = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    const k = `q-${key++}`;
    blocks.push(
      <blockquote
        key={k}
        style={{ borderLeft: "3px solid #C9BEF3", paddingLeft: 14, margin: "0 0 14px", color: "var(--pa-muted)", fontStyle: "italic", lineHeight: 1.7 }}
      >
        {quote.map((l, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(l, `${k}-${idx}`)}
          </React.Fragment>
        ))}
      </blockquote>
    );
    quote = [];
  };
  const flushAll = () => {
    flushPara();
    flushUl();
    flushOl();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const q = /^>\s?(.*)$/.exec(line);
    const li = /^[-*]\s+(.*)$/.exec(line);
    const oli = /^\d+\.\s+(.*)$/.exec(line);

    if (line.trim() === "") {
      flushAll();
    } else if (h) {
      flushAll();
      const lvl = h[1].length;
      const k = `h-${key++}`;
      const size = lvl === 1 ? 20 : lvl === 2 ? 17 : 15;
      blocks.push(
        <p key={k} style={{ color: "var(--pa-ink)", fontWeight: 700, fontSize: size, margin: "18px 0 8px", letterSpacing: "-0.2px" }}>
          {renderInline(h[2], k)}
        </p>
      );
    } else if (q) {
      flushPara();
      flushUl();
      flushOl();
      quote.push(q[1]);
    } else if (li) {
      flushPara();
      flushOl();
      flushQuote();
      ul.push(li[1]);
    } else if (oli) {
      flushPara();
      flushUl();
      flushQuote();
      ol.push(oli[1]);
    } else {
      flushUl();
      flushOl();
      flushQuote();
      para.push(line);
    }
  }
  flushAll();

  return <div className={className}>{blocks}</div>;
}
