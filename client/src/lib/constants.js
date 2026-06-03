// ─── Tiny pure utilities used across the app ──────────────────────────────────

export const uid = () => Math.random().toString(36).slice(2, 10);
export const now = () => new Date().toISOString();
export const fmtTime = iso => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
export const fmtDate = iso => {
  const d = new Date(iso), t = new Date();
  if (d.toDateString() === t.toDateString()) return "Today";
  const y = new Date(t); y.setDate(t.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ─── localStorage wrapper ─────────────────────────────────────────────────────
export const S = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: k => localStorage.removeItem(k),
};

// ─── sessionStorage wrapper (RAG text storage ~10MB/key) ──────────────────────
export const RTS = {
  set: (id, rawText) => {
    try { sessionStorage.setItem(`rag_${id}`, rawText); return true; }
    catch(e) { console.warn("sessionStorage full:", e); return false; }
  },
  get: (id) => { try { return sessionStorage.getItem(`rag_${id}`) || null; } catch { return null; } },
  del: (id) => { try { sessionStorage.removeItem(`rag_${id}`); } catch {} },
  has: (id) => { try { return sessionStorage.getItem(`rag_${id}`) !== null; } catch { return false; } },
};