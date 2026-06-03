export function Sett({ user, theme, onTheme, onBack }) {
  const ini = user.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  return (
    <div className="set"><div className="set-in">
      <button onClick={onBack} style={{fontSize:13,color:"var(--tx3)",marginBottom:24,display:"flex",alignItems:"center",gap:6,transition:"color var(--tr)"}}
        onMouseEnter={e=>e.currentTarget.style.color="var(--tx)"}
        onMouseLeave={e=>e.currentTarget.style.color="var(--tx3)"}>
        <svg viewBox="0 0 24 24" style={{width:14,height:14,stroke:"currentColor",strokeWidth:2,fill:"none"}}><polyline points="15 18 9 12 15 6"/></svg>
        Back to chat
      </button>
      <div className="set-h">Settings</div>
      <div className="set-s">Manage your preferences.</div>
      <div className="set-sec"><div className="set-sh">Account</div><div className="set-card">
        <div className="set-row">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="av" style={{width:38,height:38,borderRadius:11,fontSize:13}}>{ini}</div>
            <div>
              <div style={{fontSize:14,fontWeight:500}}>{user.name}</div>
              <div style={{fontSize:12,color:"var(--tx3)"}}>{user.email}</div>
            </div>
          </div>
        </div>
      </div></div>
      <div className="set-sec"><div className="set-sh">Appearance</div><div className="set-card">
        <div className="set-row">
          <div><div className="set-rl">Dark Mode</div><div className="set-rd">Currently: {theme==="dark"?"Dark":"Light"}</div></div>
          <div className={`tgl ${theme==="dark"?"on":""}`} onClick={onTheme}/>
        </div>
      </div></div>
      <div className="set-sec"><div className="set-sh">AI Model</div><div className="set-card">
        <div className="set-row">
          <div><div className="set-rl">Llama 3.3 70B (Groq)</div><div className="set-rd">Ultra-fast · Free tier · 70B params</div></div>
          <span className="tag g">Active</span>
        </div>
      </div></div>
    </div></div>
  );
}