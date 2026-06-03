import { useEffect } from "react";

export function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, []);
  return <div className={`toast ${type}`}>{msg}</div>;
}