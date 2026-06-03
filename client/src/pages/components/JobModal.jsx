import { useState, useRef } from "react";
import { uid } from "../../lib/constants.js";

const EMPTY = {
  name:"", email:"", phone:"", location:"", targetRole:"",
  experience:"", noticePeriod:"", expectedCTC:"", currentCTC:"",
  jobType:"Full-time", preferredLocations:"",
  techStack:"", frameworks:"", databases:"", cloud:"",
  college:"", degree:"", graduationYear:"", cgpa:"",
  projects:[{id:uid(), name:"", desc:"", link:""}],
  codingProfiles:{github:"", leetcode:"", codeforces:"", hackerrank:"", portfolio:""},
  resumeText:"", achievements:"",
};

const I = {
  X:        () => <svg viewBox="0 0 24 24" strokeLinecap="round" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Plus:     () => <svg viewBox="0 0 24 24" strokeLinecap="round" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Upload:   () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  Trash:    () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Briefcase:() => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  User:     () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Layers:   () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  GradCap:  () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  Folder:   () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  Link2:    () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M15 7h3a5 5 0 010 10h-3m-6 0H6A5 5 0 016 7h3M8 12h8"/></svg>,
  File:     () => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

const STEPS = [
  {id:"personal",  label:"Personal",   Icon:I.User},
  {id:"skills",    label:"Skills",     Icon:I.Layers},
  {id:"education", label:"Education",  Icon:I.GradCap},
  {id:"projects",  label:"Projects",   Icon:I.Folder},
  {id:"links",     label:"Links",      Icon:I.Link2},
  {id:"resume",    label:"Resume",     Icon:I.File},
];

const Field = ({label, fk, ph, type="text", p, f}) => (
  <div className="jf">
    <label className="jl">{label}</label>
    <input className="ji" type={type} placeholder={ph||label} value={p[fk]||""} onChange={e=>f(fk,e.target.value)}/>
  </div>
);

export function JobModal({ initial, onSave, onClose }) {
  const [step, setStep] = useState(0);
  const [p, setP]       = useState(() => ({ ...EMPTY, ...(initial||{}) }));
  const fileRef         = useRef();
  const f  = (k,v)     => setP(prev => ({...prev, [k]:v}));
  const fn = (par,k,v) => setP(prev => ({...prev, [par]:{...prev[par],[k]:v}}));
  const fp = (i,k,v)   => setP(prev => { const a=[...prev.projects]; a[i]={...a[i],[k]:v}; return {...prev,projects:a}; });
  const addP = ()       => setP(prev => ({...prev, projects:[...prev.projects,{id:uid(),name:"",desc:"",link:""}]}));
  const delP = i        => setP(prev => ({...prev, projects:prev.projects.filter((_,j)=>j!==i)}));
  const onResume = async file => { const t = await file.text().catch(()=>""); f("resumeText", t.slice(0,3000)); };

  const body = () => {
    if (step===0) return (<>
      <div className="jp-sec-h"><I.User/>Personal Information</div>
      <div className="g2">
        <Field label="Full Name" fk="name" ph="John Doe" p={p} f={f}/>
        <Field label="Email" fk="email" ph="you@email.com" type="email" p={p} f={f}/>
        <Field label="Phone" fk="phone" ph="+91 9876543210" p={p} f={f}/>
        <Field label="Current Location" fk="location" ph="Bengaluru, India" p={p} f={f}/>
        <Field label="Target Role" fk="targetRole" ph="Full Stack Engineer, SDE-2…" p={p} f={f}/>
        <div className="jf"><label className="jl">Job Type</label>
          <select className="jsel" value={p.jobType} onChange={e=>f("jobType",e.target.value)}>
            {["Full-time","Part-time","Remote","Hybrid","Contract","Internship"].map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <Field label="Years of Experience" fk="experience" ph="2 years, Fresher…" p={p} f={f}/>
        <Field label="Notice Period" fk="noticePeriod" ph="30 days, Immediate…" p={p} f={f}/>
        <Field label="Current CTC" fk="currentCTC" ph="12 LPA" p={p} f={f}/>
        <Field label="Expected CTC" fk="expectedCTC" ph="18 LPA" p={p} f={f}/>
        <div className="jf gf"><label className="jl">Preferred Job Locations</label>
          <input className="ji" placeholder="Bengaluru, Hyderabad, Remote…" value={p.preferredLocations||""} onChange={e=>f("preferredLocations",e.target.value)}/>
        </div>
      </div>
    </>);
    if (step===1) return (<>
      <div className="jp-sec-h"><I.Layers/>Tech Stack & Skills</div>
      <div className="jf"><label className="jl">Programming Languages</label>
        <input className="ji" placeholder="Python, JavaScript, Java, C++…" value={p.techStack||""} onChange={e=>f("techStack",e.target.value)}/>
        <span className="jhi">Comma separated</span>
      </div>
      <div className="jf"><label className="jl">Frameworks & Libraries</label>
        <input className="ji" placeholder="React, Node.js, Django, Spring Boot…" value={p.frameworks||""} onChange={e=>f("frameworks",e.target.value)}/>
      </div>
      <div className="g2">
        <div className="jf"><label className="jl">Databases</label>
          <input className="ji" placeholder="PostgreSQL, MongoDB, Redis…" value={p.databases||""} onChange={e=>f("databases",e.target.value)}/></div>
        <div className="jf"><label className="jl">Cloud & DevOps</label>
          <input className="ji" placeholder="AWS, Docker, Kubernetes, GCP…" value={p.cloud||""} onChange={e=>f("cloud",e.target.value)}/></div>
      </div>
      <div className="jf"><label className="jl">Achievements & Certifications</label>
        <textarea className="jta" placeholder="AWS Certified, Hackathon wins…" value={p.achievements||""} onChange={e=>f("achievements",e.target.value)}/>
      </div>
    </>);
    if (step===2) return (<>
      <div className="jp-sec-h"><I.GradCap/>Education</div>
      <div className="g2">
        <div className="jf gf"><label className="jl">College / University</label>
          <input className="ji" placeholder="IIT Bombay, VIT Vellore…" value={p.college||""} onChange={e=>f("college",e.target.value)}/></div>
        <div className="jf"><label className="jl">Degree & Branch</label>
          <input className="ji" placeholder="B.Tech Computer Science" value={p.degree||""} onChange={e=>f("degree",e.target.value)}/></div>
        <div className="jf"><label className="jl">Graduation Year</label>
          <input className="ji" placeholder="2024" type="number" value={p.graduationYear||""} onChange={e=>f("graduationYear",e.target.value)}/></div>
        <div className="jf"><label className="jl">CGPA / Percentage</label>
          <input className="ji" placeholder="8.5 / 10 or 85%" value={p.cgpa||""} onChange={e=>f("cgpa",e.target.value)}/></div>
      </div>
    </>);
    if (step===3) return (<>
      <div className="jp-sec-h"><I.Folder/>Projects</div>
      <div className="proj-list">
        {p.projects.map((pr,i)=>(
          <div className="proj" key={pr.id}>
            {p.projects.length>1 && <button className="proj-x" onClick={()=>delP(i)}><I.Trash/></button>}
            <div className="jf"><label className="jl">Project {i+1} Name</label>
              <input className="ji" placeholder="E-Commerce Platform…" value={pr.name} onChange={e=>fp(i,"name",e.target.value)}/></div>
            <div className="jf"><label className="jl">Description & Tech</label>
              <textarea className="jta" style={{minHeight:52}} placeholder="What it does, tech used…" value={pr.desc} onChange={e=>fp(i,"desc",e.target.value)}/></div>
            <div className="jf"><label className="jl">Live Link / GitHub URL</label>
              <input className="ji" placeholder="https://github.com/…" value={pr.link} onChange={e=>fp(i,"link",e.target.value)}/></div>
          </div>
        ))}
        {p.projects.length<6 && <button className="add-p" onClick={addP}><I.Plus/>Add another project</button>}
      </div>
    </>);
    if (step===4) return (<>
      <div className="jp-sec-h"><I.Link2/>Coding Profiles & Portfolio</div>
      <div className="cpg">
        {[["github","GitHub"],["leetcode","LeetCode"],["codeforces","Codeforces"],["hackerrank","HackerRank"],["portfolio","Portfolio"]].map(([k,l])=>(
          <div className="cpi" key={k}>
            <span className="cpl">{l}</span>
            <input className="cpinp" placeholder="URL or username" value={p.codingProfiles[k]||""} onChange={e=>fn("codingProfiles",k,e.target.value)}/>
          </div>
        ))}
      </div>
    </>);
    if (step===5) return (<>
      <div className="jp-sec-h"><I.File/>Resume</div>
      <div className={`rdrop ${p.resumeText?"has":""}`}
        onClick={()=>fileRef.current.click()}
        onDragOver={e=>e.preventDefault()}
        onDrop={e=>{e.preventDefault();const f2=e.dataTransfer.files[0];if(f2)onResume(f2);}}>
        <I.Upload/>
        {p.resumeText ? `✓ Resume loaded · ${p.resumeText.length} characters` : "Drop resume here or click to upload"}
        <div style={{fontSize:11,marginTop:4,color:"var(--tx3)"}}>TXT or MD files</div>
      </div>
      <input ref={fileRef} type="file" style={{display:"none"}} accept=".txt,.md"
        onChange={e=>{const f2=e.target.files[0];if(f2)onResume(f2);}}/>
      <div className="jf" style={{marginTop:10}}><label className="jl">Or paste resume text directly</label>
        <textarea className="jta" style={{minHeight:110}} placeholder="Paste your full resume here…" value={p.resumeText||""} onChange={e=>f("resumeText",e.target.value)}/>
      </div>
    </>);
  };

  return (
    <div className="mover" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="jp">
        <div className="jp-h">
          <div className="jp-hl">
            <div className="jp-ti">
              <div className="jp-ticon"><I.Briefcase/></div>
              Job Search Profile
            </div>
            <div className="jp-sub">Saved to this chat only · Powers your personal AI career assistant</div>
            <div className="jp-steps">
              {STEPS.map((s,i)=>(
                <div key={s.id} style={{display:"flex",alignItems:"center"}}>
                  <div className={`jp-s ${step===i?"act":""} ${i<step?"done":""}`} onClick={()=>setStep(i)}>
                    <div className="jp-sn">{i<step?"✓":i+1}</div>{s.label}
                  </div>
                  {i<STEPS.length-1&&<div className="jp-sep"/>}
                </div>
              ))}
            </div>
          </div>
          <button className="jp-xbtn" onClick={onClose}><I.X/></button>
        </div>
        <div className="jp-body">{body()}</div>
        <div className="jp-foot">
          {step>0 && <button className="jp-cancel" onClick={()=>setStep(s=>s-1)}>← Back</button>}
          <button className="jp-cancel" onClick={onClose}>Cancel</button>
          {step<STEPS.length-1
            ? <button className="jp-ok" onClick={()=>setStep(s=>s+1)}>Next →</button>
            : <button className="jp-ok" onClick={()=>onSave(p)}>⚡ Activate Job Mode</button>}
        </div>
      </div>
    </div>
  );
}