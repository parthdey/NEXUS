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
import { useState, useCallback } from 'react'

const SNAPSHOT_KEY = 'nexus_wb_snapshot'
const NAME_KEY     = 'nexus_wb_name'

/**
 * Manages whiteboard name + localStorage persistence.
 * Phase 4: swap the localStorage calls for your Express API.
 */
export function useBoardState() {
  const [boardName, setBoardNameState] = useState(
    () => localStorage.getItem(NAME_KEY) || 'Untitled Board'
  )
  const [isRenaming, setIsRenaming] = useState(false)

  const setBoardName = useCallback((name) => {
    setBoardNameState(name)
    localStorage.setItem(NAME_KEY, name)
  }, [])

  const saveSnapshot = useCallback((snapshot) => {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
    } catch (e) {
      // localStorage full — silent fail, board still works
      console.warn('Board save failed:', e)
    }
  }, [])

  const loadSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      console.warn('Board load failed:', e)
      return null
    }
  }, [])

  const clearBoard = useCallback(() => {
    localStorage.removeItem(SNAPSHOT_KEY)
  }, [])

  return {
    boardName,
    setBoardName,
    isRenaming,
    setIsRenaming,
    saveSnapshot,
    loadSnapshot,
    clearBoard,
  }
}