// ─── RAG Engine ───────────────────────────────────────────────────────────────
import { uid } from "./constants.js";

// ─── Step 1: Normalize raw text ───────────────────────────────────────────────
export function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/-[ \t]*\n[ \t]*/g, "")
    .replace(/\n--- Page \d+ ---/g, "\n\n")
    .trim();
}

// ─── Section patterns ─────────────────────────────────────────────────────────
const SECTION_PATTERNS = [
  { type: "contact",        pattern: /^(contact|personal\s+info|profile|about\s+me)/i },
  { type: "skills",         pattern: /^(technical\s+skills?|skills?|achievements?|competenc)/i },
  { type: "experience",     pattern: /^(work\s+experience|experience|employment|internship|professional\s+experience)/i },
  { type: "projects",       pattern: /^(projects?|personal\s+projects?|technical\s+projects?|key\s+projects?)/i },
  { type: "education",      pattern: /^(education|academic|qualification|degree)/i },
  { type: "certifications", pattern: /^(certification|certif|license|course)/i },
  { type: "awards",         pattern: /^(awards?|honors?|achievements?|recognition)/i },
  { type: "publications",   pattern: /^(publications?|research|papers?)/i },
  { type: "languages",      pattern: /^(languages?|spoken\s+languages?)/i },
];

export function detectSectionType(line) {
  const clean = line.trim();
  for (const { type, pattern } of SECTION_PATTERNS) {
    if (pattern.test(clean)) return type;
  }
  return null;
}

export function isSectionHeader(line) {
  const t = line.trim();
  if (!t || t.length > 60 || t.startsWith("-") || t.startsWith("•") || t.startsWith("*")) return false;
  if (/[.!?]$/.test(t) && t.length > 30) return false;
  const isTitleCase = t[0] === t[0].toUpperCase() && /[A-Z]/.test(t[0]);
  const isAllCaps = t === t.toUpperCase() && /[A-Z]/.test(t);
  const hasNoLowerStart = !/^[a-z]/.test(t);
  return (isTitleCase || isAllCaps) && hasNoLowerStart && detectSectionType(t) !== null;
}

export function parseSections(rawText) {
  const normalized = normalizeText(rawText);
  const lines = normalized.split("\n");
  const sections = [];
  let currentSection = { type: "header", header: "", paragraphs: [], rawLines: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (isSectionHeader(trimmed)) {
      if (currentSection.rawLines.length > 0) {
        currentSection.paragraphs = buildParagraphs(currentSection.rawLines);
        sections.push(currentSection);
      }
      currentSection = {
        type: detectSectionType(trimmed) || "general",
        header: trimmed,
        rawLines: [],
        paragraphs: [],
      };
    } else {
      currentSection.rawLines.push(line);
    }
  }
  if (currentSection.rawLines.length > 0) {
    currentSection.paragraphs = buildParagraphs(currentSection.rawLines);
    sections.push(currentSection);
  }
  return sections;
}

export function buildParagraphs(lines) {
  const paras = [];
  let buf = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (buf.length > 0) { paras.push(buf.join("\n").trim()); buf = []; }
    } else {
      buf.push(line);
    }
  }
  if (buf.length > 0) paras.push(buf.join("\n").trim());
  return paras.filter(p => p.length > 10);
}

// ─── Date pattern ─────────────────────────────────────────────────────────────
const DATE_PATTERN = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\s*\d{4}\s*[-–—to]+\s*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\s*(?:\d{4}|present|current)/gi;

export function extractEntities(section) {
  if (!["experience","projects","education","certifications"].includes(section.type)) {
    return null;
  }
  const paragraphs = section.paragraphs;
  if (paragraphs.length === 0) return null;

  const entities = [];
  let currentEntity = null;

  function isEntityHeader(para) {
    DATE_PATTERN.lastIndex = 0;
    const hasDate = DATE_PATTERN.test(para);
    DATE_PATTERN.lastIndex = 0;
    const lines = para.split("\n").map(l => l.trim()).filter(Boolean);
    const isShort = para.length < 200;
    const noBullets = !/^[-•*●]/.test(para.trim()) && !para.includes("\n-") && !para.includes("\n•") && !para.includes("\n●");
    const startsCapital = lines.length > 0 && /^[A-Z]/.test(lines[0]);
    return isShort && noBullets && startsCapital && (hasDate || lines.length <= 3);
  }

  function flushEntity() {
    if (!currentEntity) return;
    entities.push(currentEntity);
    currentEntity = null;
  }

  for (const para of paragraphs) {
    if (isEntityHeader(para)) {
      flushEntity();
      const lines = para.split("\n").map(l => l.trim()).filter(Boolean);
      DATE_PATTERN.lastIndex = 0;
      const dates = (para.match(DATE_PATTERN) || []).join(", ");
      DATE_PATTERN.lastIndex = 0;
      const companyName = lines[0].replace(DATE_PATTERN, "").replace(/\s{2,}/g," ").trim();
      DATE_PATTERN.lastIndex = 0;
      const roleLine = lines.length > 1 ? lines[1].replace(DATE_PATTERN,"").trim() : "";
      DATE_PATTERN.lastIndex = 0;
      currentEntity = {
        name: companyName || para.slice(0, 60),
        role: roleLine,
        titleBlock: para,
        content: [],
        dates,
      };
    } else if (currentEntity) {
      currentEntity.content.push(para);
    } else {
      currentEntity = {
        name: section.header,
        role: "",
        titleBlock: "",
        content: [para],
        dates: "",
      };
    }
  }
  flushEntity();
  return entities.length > 0 ? entities : null;
}

export function buildStructuredChunks(rawText, docName) {
  const sections = parseSections(rawText);
  const chunks = [];

  for (const section of sections) {
    const entities = extractEntities(section);
    if (entities) {
      for (const entity of entities) {
        const parts = [];
        if (entity.name) parts.push(entity.name + (entity.dates ? " | " + entity.dates : ""));
        if (entity.role) parts.push(entity.role);
        if (entity.titleBlock && entity.titleBlock !== entity.name) {
          const tb = entity.titleBlock.replace(entity.name,"").replace(entity.role||"","").trim();
          if (tb.length > 5) parts.push(tb);
        }
        parts.push(...entity.content);
        const contentText = parts.filter(Boolean).join("\n\n").trim();
        if (contentText.length < 15) continue;
        chunks.push({
          text: contentText,
          metadata: { section: section.type, entity: entity.name, role: entity.role, entityType: section.type, dates: entity.dates, docName },
        });
      }
    } else {
      const fullText = section.paragraphs.join("\n\n").trim();
      if (fullText.length < 15) continue;
      if (fullText.length > 1200) {
        const subChunks = smartChunk(fullText, 1000, 200);
        subChunks.forEach((sc, i) => {
          chunks.push({ text: sc, metadata: { section: section.type, entity: section.header, entityType: "flat", docName, subIndex: i } });
        });
      } else {
        chunks.push({ text: fullText, metadata: { section: section.type, entity: section.header, entityType: "flat", docName } });
      }
    }
  }

  if (chunks.length === 0) {
    chunks.push({ text: normalizeText(rawText), metadata: { section: "general", entity: docName, entityType: "flat", docName } });
  }
  return chunks;
}

export function smartChunk(text, chunkSize, overlap) {
  chunkSize = chunkSize || 1000;
  overlap   = overlap   || 200;
  const sections = text.split(/\n[ \t]*\n+/).map(s => s.trim()).filter(Boolean);
  const chunks = [];
  let currentChunk = [];
  let currentLen = 0;

  function flush() {
    const joined = currentChunk.join(" ").trim();
    if (joined.length > 50) chunks.push(joined);
    const ov = joined.length > overlap ? joined.slice(-overlap) : joined;
    currentChunk = ov ? [ov] : [];
    currentLen = ov ? ov.length : 0;
  }

  for (const section of sections) {
    if (section.length > chunkSize) {
      if (currentChunk.length > 0) flush();
      const sentences = section.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
      for (const sent of sentences) {
        if (currentLen + sent.length > chunkSize && currentChunk.length > 0) flush();
        currentChunk.push(sent);
        currentLen += sent.length;
      }
    } else {
      if (currentLen + section.length > chunkSize && currentChunk.length > 0) flush();
      currentChunk.push(section);
      currentLen += section.length;
    }
  }
  if (currentChunk.length > 0) {
    const last = currentChunk.join(" ").trim();
    if (last.length > 50) chunks.push(last);
  }
  if (chunks.length === 0 && text.trim()) chunks.push(text.trim());
  return chunks;
}

// ─── Intent Classifier ────────────────────────────────────────────────────────
const SECTION_KEYWORDS = {
  experience:      ["experience","work","job","role","intern","internship","company","companies","employer","employment","position","did","doing","worked","responsibilities","tasks","achieve","contributed"],
  projects:        ["project","projects","built","build","created","developed","app","application","system","tool","website","chatbot","platform"],
  skills:          ["skill","skills","technology","technologies","tech","stack","know","language","framework","tool","database","cloud","proficient","expertise"],
  education:       ["education","study","studied","college","university","degree","cgpa","grade","gpa","graduation","school","course"],
  certifications:  ["certification","certified","certificate","license","course","completed"],
  contact:         ["contact","email","phone","number","linkedin","github","location","address"],
};

export function classifyIntent(query) {
  const q = query.toLowerCase();
  const scores = {};
  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    scores[section] = keywords.filter(k => q.includes(k)).length;
  }
  const topSection = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
  const isGeneral = topSection[1] === 0;
  return {
    type:       isGeneral ? "general" : "section_specific",
    section:    isGeneral ? null : topSection[0],
    entityHint: query,
    isGeneral,
    scores,
  };
}

// ─── RAGStore class ───────────────────────────────────────────────────────────
export class RAGStore {
  constructor() { this.docs = []; }

  _tokenize(text) {
    const STOPS = new Set(["the","and","for","are","but","not","you","all","any","can","was","one","our","out","use","had","how","its","has","have","this","that","with","they","will","from","been","were","said","each","which","their","there","what","about","into","than","them","then","some","time","could","would","should","when","your","just","like","more","also","other","over","such","very","these","those","using","used","per","make","made","well","need","able","many","both","high","good"]);
    return text.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(w=>w.length>1&&!STOPS.has(w));
  }

  add(id, name, rawText) {
    this.docs = this.docs.filter(d => d.id !== id);
    const structuredChunks = buildStructuredChunks(rawText, name);
    const chunks = structuredChunks.map(c => ({
      text:     c.text,
      metadata: c.metadata,
      tokens:   this._tokenize(c.text),
    }));
    this.docs.push({ id, name, rawText, chunks });
    console.log("[RAG] Chunks for", name + ":");
    chunks.forEach((c,i) => console.log(`  [${i}] section=${c.metadata.section} entity="${c.metadata.entity}" len=${c.text.length}`));
    return chunks.length;
  }

  remove(id) { this.docs = this.docs.filter(d => d.id !== id); }
  clear()    { this.docs = []; }

  query(queryText, k) {
    k = k || 6;
    if (!this.docs.length) return [];

    const totalRaw = this.docs.reduce((s,d)=>s+(d.rawText||"").length,0);
    if (totalRaw < 3000) {
      return this.docs.map(d=>({ text: d.rawText, name: d.name, metadata:{ section:"full", entity:d.name }, score:1, isFullDoc:true }));
    }

    const intent = classifyIntent(queryText);
    const qLower = queryText.toLowerCase();
    let allChunks = this.docs.flatMap(d => d.chunks.map(c => ({ ...c, docName: d.name })));
    let filtered = allChunks;

    if (!intent.isGeneral && intent.section) {
      const sectionFiltered = allChunks.filter(c => c.metadata.section === intent.section);
      if (sectionFiltered.length > 0) filtered = sectionFiltered;
    }

    const entityNames = [...new Set(allChunks.map(c=>c.metadata.entity.toLowerCase()))];
    const mentionedEntity = entityNames.find(e => {
      if (e.length <= 3) return false;
      const words = e.split(/\s+/).filter(Boolean);
      const twoWordPrefix = words.slice(0, 2).join(" ");
      return qLower.includes(e) || (twoWordPrefix.length > 5 && qLower.includes(twoWordPrefix));
    });

    if (mentionedEntity) {
      const entityFiltered = filtered.filter(c => {
        const entityLower = c.metadata.entity.toLowerCase();
        const words = mentionedEntity.split(/\s+/).filter(Boolean);
        const twoWordPrefix = words.slice(0, 2).join(" ");
        return entityLower.includes(twoWordPrefix) || entityLower.includes(mentionedEntity);
      });
      if (entityFiltered.length > 0) {
        filtered = entityFiltered;
        console.log("[RAG] Entity filter:", mentionedEntity, "→", filtered.length, "chunks");
      }
    }

    const qTokens = this._tokenize(queryText);
    if (qTokens.length === 0) return filtered.slice(0, k).map(c=>({...c,score:0}));

    const N = filtered.length || 1;
    const idf = term => {
      const df = filtered.filter(c=>c.tokens.includes(term)).length;
      return Math.log((N+1)/(df+1))+1;
    };
    const tf = tokens => {
      const f={};
      tokens.forEach(t=>f[t]=(f[t]||0)+1);
      const total=tokens.length||1;
      Object.keys(f).forEach(k=>f[k]/=total);
      return f;
    };

    const ranked = filtered.map(c => {
      const tfMap = tf(c.tokens);
      const score = qTokens.reduce((s,t)=>s+(tfMap[t]||0)*idf(t),0);
      return { ...c, score };
    }).sort((a,b)=>b.score-a.score);

    if (mentionedEntity && filtered.length <= 3) {
      return filtered.map(c=>({...c,score:1}));
    }
    return ranked.slice(0, k);
  }

  get size()     { return this.docs.reduce((s,d)=>s+d.chunks.length,0); }
  get docCount() { return this.docs.length; }
}