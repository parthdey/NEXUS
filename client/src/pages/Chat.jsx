import { useState, useEffect, useRef } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

// ─── Utilities & storage ──────────────────────────────────────────
import { uid, now, fmtTime, fmtDate, S, RTS } from "../lib/constants.js";

// ─── RAG engine ───────────────────────────────────────────────────
import { RAGStore, classifyIntent } from "../lib/ragStore.js";

// ─── Whiteboard hook ──────────────────────────────────────────────
import { useBoardState } from "../hooks/useBoardState.js";

// ─── Job service ──────────────────────────────────────────────────
import {
  getJobsForUser,
  formatJob,
  isJobIntent,
  callAI,
  normalizeProfileForMatch,
  buildJobSystem,
} from "../services/jobService.js";

// ─── UI components ────────────────────────────────────────────────
import { Markdown } from "./components/Markdown.jsx";
import { Auth }     from "./components/Auth.jsx";
import { Sett }     from "./components/Settings.jsx";
import { Docs }     from "./components/Docs.jsx";
import { JobCards } from "./components/JobCards.jsx";
import { JobModal } from "./components/JobModal.jsx";
import { Toast }    from "./components/Toast.jsx";

// ─── Styles ───────────────────────────────────────────────────────
import "../styles/chat.css";

// ════════════════════════════════════════════════════════════════
//  ARCHITECTURE  (updated to match new file structure)
//
//  FILE STRUCTURE:
//    pages/Chat.jsx          — main App component (state + handlers + JSX)
//    pages/components/       — Auth, Docs, JobCards, JobModal,
//                              Markdown, Settings, Toast
//    hooks/useBoardState.js  — boardOpen, boardWidth, drag + tldraw mount
//    lib/constants.js        — uid, now, fmtTime, fmtDate, S, RTS
//    lib/ragStore.js         — RAGStore class, parseSections,
//                              buildStructuredChunks, classifyIntent
//    services/jobService.js  — getJobsForUser, formatJob, isJobIntent,
//                              callAI, normalizeProfileForMatch, buildJobSystem
//    styles/chat.css         — all CSS (previously inline template literal)
//
//  CHAT DATA SHAPE:
//    { id, title, messages[], createdAt, updatedAt,
//      jobMode: bool, jobProfile: JobProfile | null, docs: DocMeta[] }
//
//  MESSAGE DATA SHAPE:
//    { id, role, content, timestamp, ragSource?,
//      jobCards?: FormattedJob[] }
//    jobCards — attached to AI messages triggered by job fetch,
//               rendered as rich cards below the AI bubble
//
//  AI LAYER:
//    callAI(messages, system) → POST localhost:5000/api/chat
//    server.js proxies to Groq API (llama-3.3-70b-versatile)
//    API key lives on server only — never in the browser
//
//  JOB FLOW:
//    activateJob(profile)  → save chat → fetchAndShowJobs()
//    isJobIntent(text)     → fetchAndShowJobs()  [on any matching msg]
//    fetchAndShowJobs()    → getJobsForUser → formatJob
//                          → callAI (intro text)
//                          → save aiMsg { content, jobCards }
//
//  RAG FLOW:
//    handleUpload(file)    → extract text → RTS.set (sessionStorage)
//                          → RAGStore.add → save doc metadata to chat
//    handleSend(text)      → RAGStore.query → classifyIntent
//                          → inject context into system prompt → callAI
//
//  WHITEBOARD:
//    useBoardState()       → boardOpen, boardWidth, startBoardDrag,
//                            handleBoardMount
//    tldraw snapshot       → persisted in localStorage "nx_board_snapshot"
//    panel is resizable    → drag handle between .main and .board-panel
// ════════════════════════════════════════════════════════════════


// ═══════════════════ ICONS ════════════════════════════════════════
// Only icons used directly in App's JSX live here.
// Each component in ./components/ defines its own icons locally.
const I = {
  Logo:      () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  Plus:      () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Send:      () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Sun:       () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:      () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Settings:  () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Logout:    () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Trash:     () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  File:      () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Briefcase: () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  Chat:      () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Menu:      () => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Edit: () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width="20"
    height="20"
  >
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 000-1.42l-2.5-2.5a1.003 1.003 0 00-1.42 0L14.84 5.24l3.75 3.75 2.12-2.08z"/>
  </svg>
),
  X:() => <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};


// ═══════════════════ APP ═════════════════════════════════════════
export default function App() {

  // ─── Auth & theme ───────────────────────────────────────────────
  const [user,   setUser]   = useState(() => S.get("nx_session"));
  const [theme,  setTheme]  = useState(() => S.get("nx_theme") || "dark");

  // ─── Chat state ─────────────────────────────────────────────────
  const [chats,  setChats]  = useState(() => S.get("nx_chats") || {});
  const [cid,    setCid]    = useState(null);   // active chat id
  const [page,   setPage]   = useState("chat"); // "chat" | "settings"

  // ─── UI toggles ─────────────────────────────────────────────────
  const [plusMenu,     setPlusMenu]     = useState(false);
  const [showDocs,     setShowDocs]     = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [sidebar,      setSidebar]      = useState(() => window.innerWidth > 768);

  // ─── Input & loading ────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [input,   setInput]   = useState("");
  const [toast,   setToast]   = useState(null);

  // ─── Refs ───────────────────────────────────────────────────────
  const endRef   = useRef();            // auto-scroll anchor
  const inputRef = useRef();            // textarea focus
  const rag      = useRef(new RAGStore()); // RAG index for current chat

  // ─── Whiteboard (boardOpen, boardWidth, drag, tldraw mount) ────
  const { boardOpen, setBoardOpen, boardWidth, startBoardDrag, handleBoardMount } = useBoardState();


  // ─── Theme: apply to <html> and persist ─────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    S.set("nx_theme", theme);
  }, [theme]);


  // ─── PDF.js: load from CDN on mount ─────────────────────────────
  useEffect(() => {
    if (window.pdfjsLib) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
    };
    document.head.appendChild(s);
  }, []);


  // ─── Auto-scroll to latest message ──────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, cid, loading]);


  // ─── RAG re-index: runs when active chat or its docs change ─────
  // Raw text lives in sessionStorage (RTS), not localStorage.
  // If a doc's text is missing (e.g. new tab), it logs a warning
  // and the badge in Docs.jsx shows "re-upload needed".
  const activeChatDocs = cid ? (chats[cid]?.docs || []) : [];
  const docsKey = activeChatDocs.map(d => d.id).join(",");

  useEffect(() => {
    const store = rag.current;
    store.clear();
    let indexed = 0;
    for (const doc of activeChatDocs) {
      const rawText = RTS.get(doc.id);
      if (rawText) {
        store.add(doc.id, doc.name, rawText);
        indexed++;
      } else {
        console.warn(`[RAG] rawText missing for "${doc.name}" — re-upload needed`);
      }
    }
    if (indexed > 0) {
      console.log(`[RAG] Indexed ${indexed} doc(s), ${store.size} chunks for chat ${cid}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, docsKey]);


  // ─── Helpers ────────────────────────────────────────────────────
  const toast2 = (msg, type = "default") => setToast({ msg, type, id: uid() });
  const save   = upd => { setChats(upd); S.set("nx_chats", upd); };

  // ─── Derived state from active chat ─────────────────────────────
  const activeChat = cid ? chats[cid] : null;
  const msgs       = activeChat?.messages || [];
  const jobOn      = !!activeChat?.jobMode;
  const jobProfile = activeChat?.jobProfile || null;
  const docs       = activeChat?.docs || [];


  // ─── Chat management ────────────────────────────────────────────

  const newChat = () => {
    const id = uid();
    const upd = {
      [id]: { id, title: "New Chat", messages: [], createdAt: now(), updatedAt: now(), jobMode: false, jobProfile: null, docs: [] },
      ...chats,
    };
    save(upd); setCid(id); setInput(""); setPage("chat");
    if (window.innerWidth <= 768) setSidebar(false);
  };

  const delChat = id => {
    // Also clean up sessionStorage for any docs in the deleted chat
    const chatDocs = chats[id]?.docs || [];
    chatDocs.forEach(d => RTS.del(d.id));
    const upd = { ...chats };
    delete upd[id];
    save(upd);
    if (cid === id) setCid(Object.keys(upd)[0] || null);
  };


  // ─── Job flow ────────────────────────────────────────────────────
  // fetchAndShowJobs: fetch from /match → AI intro → save msg with jobCards.
  // Takes a chatsSnapshot to avoid stale closure issues when called
  // immediately after a state update (e.g. activateJob).
  const fetchAndShowJobs = async (profile, chatId, chatsSnapshot) => {
    const cur = chatsSnapshot || chats;
    setLoading(true);

    // Inject a user-side trigger message so the conversation reads naturally
    const trigMsg = { id: uid(), role: "user", content: "Find matching jobs for me", timestamp: now() };
    const withTrig = {
      ...cur,
      [chatId]: {
        ...cur[chatId],
        messages: [...(cur[chatId].messages || []), trigMsg],
        updatedAt: now(),
      },
    };
    save(withTrig);

    try {
      // 1. Fetch matching jobs from the job service
      let jobCards = [];
      let fetchError = null;
      try {
        const matchProfile = normalizeProfileForMatch(profile);
        console.log("[Jobs] Sending to /match:", JSON.stringify(matchProfile));
        const raw = await getJobsForUser(matchProfile);
        console.log("[Jobs] Received:", raw?.length, "jobs");
        jobCards = (raw || []).map(formatJob);
      } catch (e) {
        fetchError = e.message;
        console.error("[Jobs] Fetch failed:", e);
      }

      // 2. Build system prompt — include a preview of top 6 jobs so the
      //    AI can write a contextual intro without listing them itself
      const jobSys = buildJobSystem(profile);
      let aiSys = jobSys;

      if (jobCards.length > 0) {
        const preview = jobCards.slice(0, 6).map((j, i) =>
          `${i + 1}. ${j.title} @ ${j.company} | ${j.salary} | ${j.experience} | ${j.location} | Match: ${j.matchScore}%${j.matchWhy ? ` (${j.matchWhy})` : ""}`
        ).join("\n");
        aiSys += `\n\nLIVE JOB RESULTS (${jobCards.length} jobs fetched now):\n${preview}`
          + `\n\nWrite a warm 2-3 sentence intro. Highlight the best match and total count.`
          + ` End with: 'Here are your top matches:' — do NOT list jobs yourself, the UI renders rich cards.`;
      } else if (fetchError) {
        aiSys += `\n\nThe job service returned an error: ${fetchError}. Apologise briefly and suggest the user try again.`;
      } else {
        aiSys += `\n\nNo jobs were found. Suggest how the user can broaden their search or improve their profile.`;
      }

      // 3. Call AI for the intro text
      const history = (withTrig[chatId].messages || []).slice(-6)
        .map(m => ({ role: m.role, content: m.content }));
      const intro = await callAI(history, aiSys);

      // 4. Save the AI message with jobCards attached for rendering
      const aiMsg = {
        id:       uid(),
        role:     "assistant",
        content:  intro,
        timestamp: now(),
        jobCards: jobCards.length > 0 ? jobCards : null,
        jobError: fetchError || null,
      };
      const fin = { ...withTrig };
      fin[chatId] = { ...fin[chatId], messages: [...fin[chatId].messages, aiMsg], updatedAt: now() };
      save(fin);

    } catch (e) {
      toast2(e.message || "Error fetching jobs.", "e");
    } finally {
      setLoading(false);
    }
  };

  // Activate job mode: save profile to chat, then immediately fetch jobs
  const activateJob = async (profile) => {
    if (!cid) return;
    const updatedChats = {
      ...chats,
      [cid]: { ...chats[cid], jobMode: true, jobProfile: profile, updatedAt: now() },
    };
    save(updatedChats);
    setShowJobModal(false);
    toast2("⚡ Job Search Mode activated! Fetching matches…", "s");
    await fetchAndShowJobs(profile, cid, updatedChats);
  };

  const disableJob = () => {
    if (!cid) return;
    save({ ...chats, [cid]: { ...chats[cid], jobMode: false, updatedAt: now() } });
    toast2("Job Search Mode disabled.", "default");
  };


  // ─── Send message ────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Create a new chat on-the-fly if none is active
    let chatId = cid;
    let cur = { ...chats };
    if (!chatId) {
      chatId = uid();
      cur[chatId] = { id: chatId, title: text.slice(0, 40), messages: [], createdAt: now(), updatedAt: now(), jobMode: false, jobProfile: null, docs: [] };
      setCid(chatId);
    }

    // Append user message
    const um = { id: uid(), role: "user", content: text, timestamp: now() };
    cur[chatId] = {
      ...cur[chatId],
      messages: [...(cur[chatId].messages || []), um],
      title: cur[chatId].messages.length === 0 ? text.slice(0, 40) : cur[chatId].title,
      updatedAt: now(),
    };
    save({ ...cur });
    setInput("");
    setLoading(true);

    try {
      // Intercept job-intent messages before the normal AI path
      if (cur[chatId].jobMode && cur[chatId].jobProfile && isJobIntent(text)) {
        setLoading(false);
        await fetchAndShowJobs(cur[chatId].jobProfile, chatId, cur);
        return;
      }

      // Build system prompt — job mode overrides the default
      let sys = `You are Nexus, an intelligent AI assistant. Be helpful, insightful, and clear.

FORMAT RULES (always follow):
- Use **bold** for key terms, important points, and labels
- Use ## headings to separate major sections when the answer has multiple parts
- Use bullet lists (- item) for collections of items, steps, or options
- Use numbered lists for sequential steps or ranked items
- Use \`inline code\` for code terms, commands, file names
- Use fenced code blocks with language tag (\`\`\`python) for code samples
- Use > blockquote for important callouts or warnings
- Use tables for comparisons (| Col | Col |)
- Keep paragraphs short — 2-4 sentences max
- For short/simple answers, skip structure and just answer naturally`;

      if (cur[chatId].jobMode && cur[chatId].jobProfile) {
        sys = buildJobSystem(cur[chatId].jobProfile);
      }

      // RAG: query the index and inject relevant chunks into the system prompt
      if (rag.current.docCount > 0) {
        const ragHits = rag.current.query(text, 8);
        if (ragHits.length > 0) {
          const intent     = classifyIntent(text);
          const isFullDoc  = ragHits[0]?.isFullDoc;
          const docNames   = [...new Set(ragHits.map(r => r.name || r.docName))].filter(Boolean).join(", ");

          // Build context string — group by section for structured resumes,
          // or use full-doc mode for small documents (< 3000 chars total)
          let ctx = "";
          if (isFullDoc) {
            ctx = ragHits.map(r => `=== ${r.name} ===\n${r.text}\n=== END ${r.name} ===`).join("\n\n");
          } else {
            const bySec = {};
            for (const hit of ragHits) {
              const sec = hit.metadata?.section || "general";
              if (!bySec[sec]) bySec[sec] = [];
              bySec[sec].push(hit);
            }
            ctx = Object.entries(bySec).map(([sec, hits]) => {
              const label = sec.charAt(0).toUpperCase() + sec.slice(1).replace(/_/g, " ");
              const body  = hits.map(h => {
                const entityLabel = h.metadata?.entity
                  ? `[${h.metadata.entity}${h.metadata.dates ? " | " + h.metadata.dates : ""}]\n`
                  : "";
                return entityLabel + h.text;
              }).join("\n\n");
              return `## ${label}\n${body}`;
            }).join("\n\n---\n\n");
          }

          const div = "=".repeat(60);
          sys += `\n\n${div}\nDOCUMENT: ${docNames}\n${div}\n${ctx}\n${div}\nEND OF DOCUMENT\n${div}\n\n`
            + `INSTRUCTIONS:\n`
            + `1. Answer ONLY using the document content above\n`
            + `2. Copy names, titles, companies, dates EXACTLY as written\n`
            + `3. If asked about a specific company or project, use ONLY that entity's data\n`
            + `4. Do NOT mix information from different companies or projects\n`
            + `5. If the answer is not in the document, say so explicitly\n`
            + `6. Include specific numbers, dates, and achievements from the document`;

          console.log(`[RAG] hits=${ragHits.length} sections=${[...new Set(ragHits.map(r => r.metadata?.section))].join(",")}`);
        }
      }

      // Call AI and save response
      const history = (cur[chatId].messages || []).slice(-14).map(m => ({ role: m.role, content: m.content }));
      const reply   = await callAI(history, sys);

      const ragSource = rag.current.docCount > 0 ? (rag.current.docs[0]?.name || null) : null;
      const am = { id: uid(), role: "assistant", content: reply, timestamp: now(), ragSource };
      const fin = { ...cur };
      fin[chatId] = { ...fin[chatId], messages: [...fin[chatId].messages, am], updatedAt: now() };
      save(fin);

    } catch (e) {
      toast2(e.message || "API error.", "e");
    }

    setLoading(false);
  };


  // ─── PDF text extraction ─────────────────────────────────────────
  // Uses pdf.js (loaded from CDN above).
  // Groups text items by y-coordinate to reconstruct line order,
  // which preserves resume/document structure far better than
  // naive string concatenation.
  const extractPdfText = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const lib = window.pdfjsLib;
          if (!lib) { reject(new Error("PDF.js not loaded yet — try again in a moment.")); return; }

          const pdf   = await lib.getDocument({ data: typedArray }).promise;
          const pages = [];

          for (let p = 1; p <= pdf.numPages; p++) {
            const page    = await pdf.getPage(p);
            const content = await page.getTextContent();

            // Group items by y-coordinate (rounded to 2px to merge near items)
            const lineMap = new Map();
            for (const item of content.items) {
              if (!item.str || !item.str.trim()) continue;
              const y = Math.round(item.transform[5] / 2) * 2;
              if (!lineMap.has(y)) lineMap.set(y, []);
              lineMap.get(y).push({ x: item.transform[4], str: item.str });
            }

            // Sort top-to-bottom (descending y in PDF coords) then left-to-right
            const lines = [...lineMap.keys()]
              .sort((a, b) => b - a)
              .map(y => lineMap.get(y).sort((a, b) => a.x - b.x).map(i => i.str).join(" ").trim())
              .filter(Boolean);

            pages.push(lines.join("\n"));
          }

          resolve(pages.join("\n\n").trim());
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };


  // ─── Document upload ─────────────────────────────────────────────
  // Stores raw text in sessionStorage (RTS) — survives refresh, ~10MB/key.
  // Only metadata (id, name, chunks, size) is persisted to localStorage
  // via the chat object — keeps it lean.
  const handleUpload = async (file) => {
    if (!cid) { toast2("Open or create a chat first.", "e"); return; }

    const ext       = "." + file.name.split(".").pop().toLowerCase();
    const textTypes = [".txt",".md",".js",".ts",".jsx",".tsx",".py",".json",".csv",".html",".css",".xml",".yaml",".yml",".env",".sh",".sql",".java",".cpp",".c",".rs",".go",".rb",".php"];
    const isPdf     = ext === ".pdf";

    if (!isPdf && !textTypes.includes(ext)) {
      toast2(`Unsupported: ${ext}. Use PDF, TXT, MD, or code files.`, "e"); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast2("File too large (max 20MB).", "e"); return;
    }

    toast2(`Processing "${file.name}"…`, "default");

    // Extract text
    let rawText = "";
    if (isPdf) {
      try { rawText = await extractPdfText(file); }
      catch (err) { toast2(`PDF error: ${err.message}`, "e"); return; }
    } else {
      rawText = await file.text().catch(() => "");
    }

    if (!rawText || rawText.trim().length < 10) {
      toast2("File appears empty or unreadable.", "e"); return;
    }

    // Re-use existing doc id if same filename already uploaded to this chat
    const existingDocs = chats[cid]?.docs || [];
    const existing     = existingDocs.find(d => d.name === file.name);
    const docId        = existing ? existing.id : uid();

    const stored = RTS.set(docId, rawText);
    if (!stored) { toast2("Storage full — try a smaller file.", "e"); return; }

    // Index into RAGStore immediately so queries work without reload
    const chunkCount = rag.current.add(docId, file.name, rawText);
    console.log(`[RAG] Indexed "${file.name}": ${chunkCount} chunks, ${rawText.length} chars`);

    const newDoc = { id: docId, name: file.name, chunks: chunkCount, size: file.size, isPdf, addedAt: now() };
    const prevDocs = existingDocs.filter(d => d.id !== docId);
    save({ ...chats, [cid]: { ...chats[cid], docs: [...prevDocs, newDoc], updatedAt: now() } });
    toast2(`"${file.name}" — ${chunkCount} chunks indexed!`, "s");
  };


  // ─── Document delete ─────────────────────────────────────────────
  const handleDocDel = id => {
    if (!cid) return;
    RTS.del(id);             // remove raw text from sessionStorage
    rag.current.remove(id);  // remove from in-memory RAG index
    const updDocs = (chats[cid]?.docs || []).filter(d => d.id !== id);
    save({ ...chats, [cid]: { ...chats[cid], docs: updDocs, updatedAt: now() } });
    toast2("Document removed.", "default");
  };


  // ─── Sidebar grouping ────────────────────────────────────────────
  const chatList = Object.values(chats).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const grouped  = chatList.reduce((acc, c) => {
    const l = fmtDate(c.updatedAt);
    if (!acc[l]) acc[l] = [];
    acc[l].push(c);
    return acc;
  }, {});


  // ─── Auth gate ───────────────────────────────────────────────────
  if (!user) return <Auth onAuth={u => setUser(u)} />;

  const ini = user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);


  // ─── Render ──────────────────────────────────────────────────────
  return (
    <>
      <div className={`app ${sidebar ? "" : "collapsed"}`}>

        {/* ── Sidebar overlay (mobile) ── */}
        {sidebar && (
          <div className={`sidebar-overlay${sidebar ? " visible" : ""}`} onClick={() => setSidebar(false)} />
        )}

        {/* ══ Sidebar ══════════════════════════════════════════════ */}
        <div className={`sidebar${sidebar ? " open" : ""}`}>

          {/* Header */}
          <div className="s-head">
            <div className="logo">
              <div className="logo-dot"><I.Logo /></div>
              <span className="logo-name">Nexus</span>
            </div>
            <button className="ib" onClick={() => setSidebar(false)}><I.X /></button>
          </div>

          {/* New chat + Whiteboard buttons */}
          <button className="s-new" onClick={newChat}><I.Plus />New conversation</button>
          <button
            className={`s-new s-wb ${boardOpen ? "active" : ""}`}
            onClick={() => { setBoardOpen(b => !b); if (window.innerWidth <= 768) setSidebar(false); }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Whiteboard
          </button>

          {/* Chat history grouped by date */}
          <div className="s-hist">
            {Object.entries(grouped).map(([lbl, items]) => (
              <div key={lbl}>
                <div className="s-gl">{lbl}</div>
                {items.map(c => (
                  <div
                    key={c.id}
                    className={`s-item ${cid === c.id ? "act" : ""} ${c.jobMode ? "jc" : ""}`}
                    onClick={() => { setCid(c.id); setPage("chat"); if (window.innerWidth <= 768) setSidebar(false); }}
                  >
                    <div className="s-it">{c.title}</div>
                    <button className="s-del" onClick={e => { e.stopPropagation(); delChat(c.id); }}><I.Trash /></button>
                  </div>
                ))}
              </div>
            ))}
            {!chatList.length && (
              <div style={{ padding: "18px 9px", textAlign: "center", color: "var(--tx3)", fontSize: 12 }}>
                No chats yet.
              </div>
            )}
          </div>

          {/* Footer: user info, settings, sign out */}
          <div className="s-foot">
            <div className="s-user">
              <div className="av">{ini}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="u-n">{user.name}</div>
                <div className="u-e">{user.email}</div>
              </div>
            </div>
            <button className="s-lnk" onClick={() => { setPage("settings"); if (window.innerWidth <= 768) setSidebar(false); }}>
              <I.Settings />Settings
            </button>
            <button className="s-lnk" onClick={() => { S.del("nx_session"); setUser(null); }}>
              <I.Logout />Sign out
            </button>
          </div>
        </div>
        {/* ══ End Sidebar ══════════════════════════════════════════ */}


        {/* ══ Main + Whiteboard ════════════════════════════════════ */}
        <div className="main-wrap">
          <div className="main">

            {/* Settings page */}
            {page === "settings" ? (
              <Sett
                user={user} theme={theme}
                onTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
                onBack={() => setPage("chat")}
              />
            ) : (
              <>
                {/* ── Topbar ── */}
                <div className="topbar">
                  <div className="tb-l">
                    <button className="ib" onClick={() => setSidebar(s => !s)}><I.Menu /></button>
                    <span className="tb-t">{activeChat?.title || "Nexus AI"}</span>
                    {/* RAG badge — click to open docs panel */}
                    {docs.length > 0 && (
                      <span className="badge rag" onClick={() => { setPlusMenu(true); setShowDocs(true); }} style={{ cursor: "pointer" }}>
                        <I.File style={{ width: 11, height: 11 }} />
                        {docs.length} doc{docs.length !== 1 ? "s" : ""} · {docs.reduce((s, d) => s + (d.chunks || 0), 0)} chunks
                      </span>
                    )}
                    {jobOn && <span className="badge job" onClick={() => setShowJobModal(true)}>⚡ Job Mode</span>}
                  </div>
                  <div className="tb-r">
                    <button className="ib" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
                      {theme === "dark" ? <I.Sun /> : <I.Moon />}
                    </button>
                  </div>
                </div>

                {/* ── Job mode banner ── */}
                {jobOn && jobProfile && (
                  <div className="job-banner">
                    <I.Briefcase />
                    <span>
                      <strong>Job Search Mode</strong> — {jobProfile.name || user.name}
                      {jobProfile.targetRole ? ` · ${jobProfile.targetRole}` : ""}
                      {jobProfile.experience ? ` · ${jobProfile.experience}` : ""}
                      {jobProfile.techStack  ? ` · ${jobProfile.techStack.split(",")[0].trim()}…` : ""}
                    </span>
                    <div className="jb-acts">
                      <button className="jb-btn muted" onClick={() => setShowJobModal(true)}>
                        <I.Edit style={{ width: 11, height: 11, display: "inline", verticalAlign: "middle", marginRight: 3 }} />Edit
                      </button>
                      <button className="jb-btn" onClick={disableJob}>Disable</button>
                    </div>
                  </div>
                )}

                {/* ── Chat area ── */}
                <div className="chat-area">
                  {!msgs.length ? (
                    /* Empty state */
                    <div className="ci" style={{ height: "100%", justifyContent: "center" }}>
                      <div className="empty">
                        <div className="empty-ico">{jobOn ? <I.Briefcase /> : <I.Chat />}</div>
                        <h2>{jobOn ? `Hi ${(jobProfile?.name || user.name).split(" ")[0]}! Let's land that job.` : "Ask me anything"}</h2>
                        <p>{jobOn
                          ? `I know your profile — ${jobProfile?.targetRole || "your role"}, ${jobProfile?.experience || ""} experience, ${jobProfile?.techStack?.split(",")[0]?.trim() || "your stack"}. Ask me anything about your job search.`
                          : "I remember our conversations, read your documents, and help you find jobs."
                        }</p>
                        <div className="chips">
                          {(jobOn
                            ? ["Find matching jobs for me", "Review my resume", "Mock interview — SDE-2", "Negotiate my salary", "Best companies for my stack", "Write a cold email to a recruiter"]
                            : ["Summarize a document", "Help with my resume", "Explain this code", "Career tips"]
                          ).map(s => (
                            <button key={s} className="chip" onClick={() => { setInput(s); inputRef.current?.focus(); }}>{s}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Message list */
                    <div className="ci">
                      {msgs.map(m => (
                        <div key={m.id} className="msg-outer">
                          <div className={`msg ${m.role}`}>
                            <div className={`mav ${m.role}`}>{m.role === "user" ? ini : "N"}</div>
                            <div className="mbub">
                              <div className="mc">
                                <Markdown text={m.content} />
                                {/* RAG source tag shown below AI message */}
                                {m.ragSource && (
                                  <div className="rtag">
                                    <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, stroke: "currentColor", strokeWidth: 2, fill: "none", flexShrink: 0 }}>
                                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    {m.ragSource}
                                  </div>
                                )}
                              </div>
                              <div className="mm">{fmtTime(m.timestamp)}</div>
                            </div>
                          </div>
                          {/* Job cards rendered below AI message if present */}
                          {m.jobCards && m.jobCards.length > 0 && (
                            <div className="jc-outer">
                              <JobCards
                                jobs={m.jobCards}
                                onRefetch={() => {
                                  if (activeChat?.jobProfile && cid) {
                                    fetchAndShowJobs(activeChat.jobProfile, cid, chats);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {loading && (
                        <div className="msg ai">
                          <div className="mav ai">N</div>
                          <div className="typing"><div className="td" /><div className="td" /><div className="td" /></div>
                        </div>
                      )}
                      <div ref={endRef} />
                    </div>
                  )}
                </div>

                {/* ── Input bar ── */}
                <div className="iw"><div className="ib2">
                  <div className="ifield">

                    {/* + button — toggles pmenu; Docs view slides in inside it */}
                    <div className="pw">
                      <button
                        className={`pb ${plusMenu ? "active" : ""}`}
                        onClick={() => { setPlusMenu(m => !m); setShowDocs(false); }}
                      >
                        <I.Plus />
                        {docs.length > 0 && <span className="ddot">{docs.length}</span>}
                      </button>

                      {plusMenu && (
                        <div className="pmenu">
                          {showDocs ? (
                            /* Docs view — replaces the menu items in-place */
                            <Docs
                              docs={docs}
                              onUpload={handleUpload}
                              onDelete={handleDocDel}
                              onClose={() => setShowDocs(false)}
                            />
                          ) : (
                            /* Main menu items */
                            <>
                              <button className="pmi doc" onClick={() => setShowDocs(true)}>
                                <I.File /><span className="pmi-label">Attach Documents</span><span className="pmi-badge">RAG</span>
                              </button>
                              <div className="pmsep" />
                              <button className="pmi job" onClick={() => {
                                setPlusMenu(false);
                                if (!cid) { newChat(); setTimeout(() => setShowJobModal(true), 60); return; }
                                setShowJobModal(true);
                              }}>
                                <I.Briefcase />
                                <span className="pmi-label">{jobOn ? "Edit Job Profile" : "Job Search Mode"}</span>
                                {jobOn && <span className="pmi-badge" style={{ color: "var(--am)", background: "var(--am-bg)" }}>ON</span>}
                              </button>
                              {jobOn && (
                                <button className="pmi dis" onClick={() => { disableJob(); setPlusMenu(false); }}>
                                  <I.X style={{ stroke: "var(--rd)" }} />Disable Job Mode
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message textarea */}
                    <textarea
                      ref={inputRef} rows={1}
                      placeholder={
                        jobOn        ? `Ask about jobs, interviews, ${jobProfile?.targetRole || "your role"}…`
                        : docs.length ? "Ask about your documents…"
                        : "Message Nexus…"
                      }
                      value={input}
                      onChange={e => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                      }}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    />

                    {/* Send button */}
                    <button className="send" onClick={handleSend} disabled={!input.trim() || loading}>
                      {loading
                        ? <svg viewBox="0 0 24 24" width="15" height="15" stroke="white" strokeWidth="2" fill="none" className="spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>
                        : <I.Send />}
                    </button>
                  </div>
                  <div className="ihint">Nexus is AI and can make mistakes. Please double-check responses.</div>
                </div></div>
              </>
            )}
          </div>
          {/* ══ End .main ════════════════════════════════════════════ */}

          {/* ── Whiteboard panel (renders beside .main when open) ── */}
          {boardOpen && (
            <>
              <div className="board-drag-handle" onMouseDown={startBoardDrag} />
              <div className="board-panel" style={{ width: boardWidth }}>
                <div className="board-panel-topbar">
                  <span className="board-panel-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="14" rx="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    Whiteboard
                  </span>
                  <button className="board-close-btn" onClick={() => setBoardOpen(false)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="board-canvas">
                  <Tldraw onMount={handleBoardMount} />
                </div>
              </div>
            </>
          )}
        </div>
        {/* ══ End .main-wrap ═══════════════════════════════════════ */}

      </div>
      {/* ══ End .app ═════════════════════════════════════════════ */}

      {/* ── Global overlays (rendered outside .app to avoid z-index issues) ── */}

      {/* Backdrop — closes pmenu and docs view on outside click */}
      {plusMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => { setPlusMenu(false); setShowDocs(false); }}
        />
      )}

      {/* Toast notifications */}
      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Job profile modal */}
      {showJobModal && (
        <JobModal initial={jobProfile} onSave={activateJob} onClose={() => setShowJobModal(false)} />
      )}
    </>
  );
}