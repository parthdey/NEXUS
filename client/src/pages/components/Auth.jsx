import { useState } from "react";
import { S } from "../../lib/constants.js";

const I = {
  Logo: () => <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
};

export function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF]       = useState({ name:"", email:"", password:"" });
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(false);
  const set = e => setF(p => ({ ...p, [e.target.name]: e.target.value }));

  const go = () => {
    setErr(""); setBusy(true);
    setTimeout(() => {
      const users = S.get("nx_users") || {};
      if (mode === "signup") {
        if (!f.name || !f.email || !f.password) { setErr("All fields required."); setBusy(false); return; }
        if (users[f.email]) { setErr("Email already registered."); setBusy(false); return; }
        users[f.email] = { name: f.name, email: f.email, password: f.password };
        S.set("nx_users", users);
        S.set("nx_session", { email: f.email, name: f.name });
        onAuth({ email: f.email, name: f.name });
      } else {
        if (!f.email || !f.password) { setErr("Fill all fields."); setBusy(false); return; }
        const u = users[f.email];
        if (!u || u.password !== f.password) { setErr("Invalid email or password."); setBusy(false); return; }
        S.set("nx_session", { email: u.email, name: u.name });
        onAuth({ email: u.email, name: u.name });
      }
      setBusy(false);
    }, 400);
  };

  return (
    <div className="auth-w">
      <div className="auth-c">
        <div className="auth-logo">
          <div className="auth-m"><I.Logo/></div>
          <span className="auth-mn">Nexus</span>
        </div>
        <div className="ah">{mode === "login" ? "Welcome back" : "Create account"}</div>
        <div className="as">{mode === "login" ? "Sign in to continue your conversations." : "Start chatting with AI-powered memory."}</div>
        {mode === "signup" && (
          <div className="fg">
            <label className="fl">Full Name</label>
            <input className="fi" name="name" placeholder="John Doe" value={f.name} onChange={set} onKeyDown={e=>e.key==="Enter"&&go()}/>
          </div>
        )}
        <div className="fg">
          <label className="fl">Email</label>
          <input className="fi" name="email" type="email" placeholder="you@example.com" value={f.email} onChange={set} onKeyDown={e=>e.key==="Enter"&&go()}/>
        </div>
        <div className="fg">
          <label className="fl">Password</label>
          <input className="fi" name="password" type="password" placeholder="••••••••" value={f.password} onChange={set} onKeyDown={e=>e.key==="Enter"&&go()}/>
        </div>
        {err && <div className="ferr">{err}</div>}
        <button className="fb" onClick={go} disabled={busy} style={{marginTop:12}}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <div className="asw">
          {mode === "login"
            ? <> No account? <button onClick={()=>{setMode("signup");setErr("");}}>Sign up free</button></>
            : <> Have an account? <button onClick={()=>{setMode("login");setErr("");}}>Sign in</button></>}
        </div>
      </div>
    </div>
  );
}