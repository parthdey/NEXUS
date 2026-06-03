// // client/src/hooks/useBoardState.js
// import { useState, useCallback } from "react";

// const SNAPSHOT_KEY = "nexus_whiteboard_snapshot";
// const NAME_KEY     = "nexus_whiteboard_name";

// /**
//  * Manages whiteboard name + localStorage persistence.
//  * Phase 4: swap localStorage calls for your backend API.
//  */
// export function useBoardState() {
//   const [boardName, setBoardNameState] = useState(
//     () => localStorage.getItem(NAME_KEY) || "Untitled Board"
//   );
//   const [isRenaming, setIsRenaming] = useState(false);

//   const setBoardName = useCallback((name) => {
//     setBoardNameState(name);
//     localStorage.setItem(NAME_KEY, name);
//   }, []);

//   const saveSnapshot = useCallback((snapshot) => {
//     try {
//       localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
//     } catch (e) {
//       console.warn("Board save failed (storage full?):", e);
//     }
//   }, []);

//   const loadSnapshot = useCallback(() => {
//     try {
//       const raw = localStorage.getItem(SNAPSHOT_KEY);
//       return raw ? JSON.parse(raw) : null;
//     } catch (e) {
//       console.warn("Board load failed:", e);
//       return null;
//     }
//   }, []);

//   const clearBoard = useCallback(() => {
//     localStorage.removeItem(SNAPSHOT_KEY);
//   }, []);

//   return {
//     boardName,
//     setBoardName,
//     isRenaming,
//     setIsRenaming,
//     saveSnapshot,
//     loadSnapshot,
//     clearBoard,
//   };
// }























// 2
// client/src/hooks/useBoardState.js
// import { useState, useCallback } from 'react'

// const SNAPSHOT_KEY = 'nexus_wb_snapshot'
// const NAME_KEY     = 'nexus_wb_name'

// /**
//  * Manages whiteboard name + localStorage persistence.
//  * Phase 4: swap the localStorage calls for your Express API.
//  */
// export function useBoardState() {
//   const [boardName, setBoardNameState] = useState(
//     () => localStorage.getItem(NAME_KEY) || 'Untitled Board'
//   )
//   const [isRenaming, setIsRenaming] = useState(false)

//   const setBoardName = useCallback((name) => {
//     setBoardNameState(name)
//     localStorage.setItem(NAME_KEY, name)
//   }, [])

//   const saveSnapshot = useCallback((snapshot) => {
//     try {
//       localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
//     } catch (e) {
//       // localStorage full — silent fail, board still works
//       console.warn('Board save failed:', e)
//     }
//   }, [])

//   const loadSnapshot = useCallback(() => {
//     try {
//       const raw = localStorage.getItem(SNAPSHOT_KEY)
//       return raw ? JSON.parse(raw) : null
//     } catch (e) {
//       console.warn('Board load failed:', e)
//       return null
//     }
//   }, [])

//   const clearBoard = useCallback(() => {
//     localStorage.removeItem(SNAPSHOT_KEY)
//   }, [])

//   return {
//     boardName,
//     setBoardName,
//     isRenaming,
//     setIsRenaming,
//     saveSnapshot,
//     loadSnapshot,
//     clearBoard,
//   }
// }









import { useState, useCallback } from "react";

// ─── Persist snapshot to localStorage ────────────────────────────────────────
const saveSnapshot = (snapshot) => {
  try { localStorage.setItem("nx_board_snapshot", JSON.stringify(snapshot)); } catch {}
};

const loadSnapshot = () => {
  try {
    const s = localStorage.getItem("nx_board_snapshot");
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

// ─── Custom hook — call in App, destructure what you need ────────────────────
export function useBoardState() {
  const [boardOpen, setBoardOpen]   = useState(false);
  const [boardWidth, setBoardWidth] = useState(520);

  const startBoardDrag = (e) => {
    e.preventDefault();
    const onMove = (e) => {
      const newBoardW = window.innerWidth - e.clientX;
      setBoardWidth(Math.min(Math.max(newBoardW, 300), window.innerWidth * 0.65));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleBoardMount = useCallback((editor) => {
    const saved = loadSnapshot();
    if (saved) { try { editor.loadSnapshot(saved); } catch (e) {} }
    const unsub = editor.store.listen(
      () => saveSnapshot(editor.getSnapshot()),
      { scope: "document" }
    );
    return () => unsub();
  }, []);

  return {
    boardOpen,
    setBoardOpen,
    boardWidth,
    startBoardDrag,
    handleBoardMount,
  };
}