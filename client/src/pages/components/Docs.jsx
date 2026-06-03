// import { useRef } from "react";
// import { RTS } from "../../lib/constants.js";

// const I = {
//   X:      () => <svg viewBox="0 0 24 24" strokeLinecap="round" stroke="currentColor" strokeWidth="1.8" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
//   File:   () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
//   Upload: () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
//   Trash:  () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
// };

// export function Docs({ docs, onUpload, onDelete, onClose }) {
//   const ref = useRef();
//   const fmtSize = b => b>1024*1024 ? `${(b/1024/1024).toFixed(1)}MB` : b>1024 ? `${(b/1024).toFixed(0)}KB` : `${b}B`;

//   return (
//     <div className="dp">
//       <div className="dp-h">
//         <div>
//           <div className="dp-t">Documents</div>
//           <div style={{fontSize:11,color:"var(--tx3)",marginTop:1}}>
//             {docs.length} file{docs.length!==1?"s":""} · {docs.reduce((s,d)=>s+(d.chunks||0),0)} chunks indexed
//           </div>
//         </div>
//         <button className="ib" onClick={onClose}><I.X/></button>
//       </div>
//       <div className="dp-up"
//         onClick={()=>ref.current.click()}
//         onDragOver={e=>e.preventDefault()}
//         onDrop={e=>{e.preventDefault();[...e.dataTransfer.files].forEach(onUpload);}}>
//         <I.Upload/>Drop files or click to upload
//         <div style={{fontSize:10,marginTop:3,color:"var(--tx3)"}}>PDF · TXT · MD · JS/TS · Python · JSON · CSV and more</div>
//       </div>
//       <input ref={ref} type="file" style={{display:"none"}} multiple
//         accept=".pdf,.txt,.md,.js,.ts,.jsx,.tsx,.py,.json,.csv,.html,.css,.xml,.yaml,.yml,.sql,.java,.cpp,.c,.rs,.go,.rb,.php,.sh"
//         onChange={e=>[...e.target.files].forEach(onUpload)}/>
//       <div className="dp-list">
//         {docs.map(d=>(
//           <div className="dp-item" key={d.id}>
//             <div className="dp-ico" style={d.isPdf?{background:"var(--rd-bg)",borderColor:"rgba(248,113,113,.12)"}:{}}>
//               {d.isPdf
//                 ? <svg viewBox="0 0 24 24" style={{width:13,height:13,stroke:"var(--rd)",strokeWidth:1.8,fill:"none"}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
//                 : <I.File/>}
//             </div>
//             <div style={{flex:1,minWidth:0}}>
//               <div className="dp-n">{d.name}</div>
//               <div className="dp-c">
//                 {d.chunks||0} chunks · {fmtSize(d.size||0)}
//                 {!RTS.has(d.id) && <span style={{color:"var(--am)",marginLeft:4}}>· re-upload needed</span>}
//               </div>
//             </div>
//             <button className="dp-x" onClick={()=>onDelete(d.id)}><I.Trash/></button>
//           </div>
//         ))}
//         {!docs.length && (
//           <div style={{padding:"24px 10px",textAlign:"center",color:"var(--tx3)",fontSize:12,lineHeight:1.7}}>
//             No documents yet.<br/>
//             <span style={{fontSize:11}}>Upload files to ask questions<br/>about their content.</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }









import { useRef } from "react";
import { RTS } from "../../lib/constants.js";

const IFile   = () => <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IUpload = () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>;
const ITrash  = () => <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;
const IChevL  = () => <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;

const fmtSize = b =>
  b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB`
  : b > 1024       ? `${(b / 1024).toFixed(0)} KB`
  : `${b} B`;

export function Docs({ docs, onUpload, onDelete, onClose }) {
  const ref = useRef();

  return (
    <>
      {/* ── back button row ── */}
      <button className="pmi" onClick={onClose} style={{ borderBottom: "1px solid var(--br)", borderRadius: 0, padding: "9px 12px", marginBottom: 2 }}>
        <IChevL />
        <span className="pmi-label" style={{ fontWeight: 600, color: "var(--tx)" }}>Documents</span>
        {docs.length > 0 && (
          <span className="pmi-badge" style={{ background: "var(--bl-bg)", color: "var(--bl)" }}>
            {docs.length}
          </span>
        )}
      </button>

      {/* ── upload zone ── */}
      <div
        className="doc-drop"
        onClick={() => ref.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); [...e.dataTransfer.files].forEach(onUpload); }}
      >
        <IUpload />
        <span>Click or drag to upload</span>
        <span className="doc-drop-hint">PDF · TXT · MD · JS · TS · Python · JSON · CSV</span>
      </div>
      <input
        ref={ref} type="file" style={{ display: "none" }} multiple
        accept=".pdf,.txt,.md,.js,.ts,.jsx,.tsx,.py,.json,.csv,.html,.css,.xml,.yaml,.yml,.sql,.java,.cpp,.c,.rs,.go,.rb,.php,.sh"
        onChange={e => [...e.target.files].forEach(onUpload)}
      />

      {/* ── file list ── */}
      {docs.length > 0 && (
        <div className="doc-list">
          {docs.map(d => (
            <div className="doc-item" key={d.id}>
              <div className={`doc-item-ico ${d.isPdf ? "pdf" : ""}`}>
                {d.isPdf
                  ? <svg viewBox="0 0 24 24" width="12" height="12" stroke="var(--rd)" strokeWidth="1.8" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  : <IFile />}
              </div>
              <div className="doc-item-info">
                <div className="doc-item-name" title={d.name}>{d.name}</div>
                <div className="doc-item-meta">
                  {d.chunks || 0} chunks · {fmtSize(d.size || 0)}
                  {!RTS.has(d.id) && <span style={{ color: "var(--am)" }}> · re-upload</span>}
                </div>
              </div>
              <button className="doc-item-del" onClick={() => onDelete(d.id)} title="Remove">
                <ITrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {docs.length === 0 && (
        <div className="doc-empty">No files attached yet</div>
      )}
    </>
  );
}