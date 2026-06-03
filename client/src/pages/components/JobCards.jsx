import { useState } from "react";

function CrackIt({ job }) {
  const [open, setOpen] = useState(false);
  const tips = [
    job.skills?.length > 0 && { label: "Key skills to highlight", text: job.skills.join(", ") },
    job.matchWhy && { label: "Why you match", text: job.matchWhy },
    { label: "Interview prep", text: "Research " + job.company + "'s products and recent news. Prepare STAR stories around your " + (job.skills?.[0] || "core") + " experience. Expect system design if senior-level." },
    { label: "Resume tip", text: "Tailor your headline to " + job.title + " — mirror their exact title. Quantify impact in bullets." },
    job.salary !== "Not disclosed" && { label: "Salary negotiation", text: "Posted range: " + job.salary + ". Come prepared with Levels.fyi / Glassdoor data to anchor higher." },
  ].filter(Boolean);

  return (
    <div className="jcard-crack">
      <button className={"jcard-crack-toggle" + (open ? " open" : "")} onClick={() => setOpen(o => !o)}>
        <svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        How to crack this interview
        <svg viewBox="0 0 24 24" className="chev" style={{marginLeft:"auto"}}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="jcard-crack-body">
          {tips.map((tip, i) => (
            <div key={i} className="jcard-crack-tip">
              <strong>{tip.label}:</strong>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job }) {
  const score = job.matchScore || 0;
  const tier  = score >= 50 ? "high" : score >= 25 ? "mid" : "low";
  const logo  = (job.company || "??").slice(0, 2).toUpperCase();

  return (
    <div className="jcard">
      <div className="jcard-top">
        <div className="jcard-logo">{logo}</div>
        <div className="jcard-info">
          <div className="jcard-title">{job.title}</div>
          <div className="jcard-company">{job.company}</div>
          {job.location && <div className="jcard-loc">{job.location}</div>}
        </div>
        <div className="jcard-score-wrap">
          <div className={"jcard-score-num " + tier}>
            {score}<span style={{fontSize:11,fontWeight:400,color:"var(--tx3)"}}>%</span>
          </div>
          <div className="jcard-score-label">match</div>
          <div className="jcard-score-bar">
            <div className={"jcard-score-fill " + tier} style={{width: Math.min(score,100) + "%"}}/>
          </div>
        </div>
      </div>
      <div className="jcard-pills">
        <span className="jcard-pill salary">{job.salary}</span>
        <span className="jcard-pill exp">{job.experience}</span>
        {job.jobType && <span className="jcard-pill type">{job.jobType}</span>}
        {job.portal  && <span className="jcard-pill portal">{job.portal}</span>}
      </div>
      {job.skills?.length > 0 && (
        <div className="jcard-skills">
          {job.skills.map((s, i) => <span key={i} className="jcard-skill">{s}</span>)}
        </div>
      )}
      {job.matchWhy && (
        <>
          <div className="jcard-divider"/>
          <div className="jcard-why">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            {job.matchWhy}
          </div>
        </>
      )}
      <CrackIt job={job}/>
      <div className="jcard-actions">
        {job.applyUrl
          ? <a className="jcard-apply" href={job.applyUrl} target="_blank" rel="noreferrer">
              Apply Now
              <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          : <span className="jcard-apply disabled">No link available</span>}
        <button className="jcard-bm" title="Bookmark">
          <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        </button>
      </div>
    </div>
  );
}

export function JobCards({ jobs, onRefetch }) {
  if (!jobs?.length) return null;
  return (
    <div className="jc-wrap">
      <div className="jc-header">
        <span className="jc-count">{jobs.length} job{jobs.length !== 1 ? "s" : ""} matched</span>
        <button className="jc-refetch" onClick={onRefetch}>
          <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          Refresh
        </button>
      </div>
      {jobs.map((job, i) => <JobCard key={job.id || i} job={job}/>)}
    </div>
  );
}