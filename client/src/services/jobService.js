// ─── Job Service — all job-related logic ─────────────────────────────────────
import { uid } from "../lib/constants.js";

// ─── API URL ──────────────────────────────────────────────────────────────────
const JOB_SERVICE_URL = import.meta.env.VITE_JOB_SERVICE_URL || "http://localhost:3001";
const AI_SERVICE_URL  = "http://localhost:5000";

// ─── Fetch jobs from Spring Boot job service ──────────────────────────────────
export async function getJobsForUser(jobProfile) {
  const res = await fetch(`${JOB_SERVICE_URL}/match`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(jobProfile),
  });
  if (!res.ok) throw new Error(`Job service error: ${res.status}`);
  const { jobs } = await res.json();
  return jobs;
}

// ─── Format a raw job for display ────────────────────────────────────────────
export function formatJob(job) {
  const salary =
    job.salary_min && job.salary_max
      ? "₹" + (job.salary_min/1e5).toFixed(1) + "–" + (job.salary_max/1e5).toFixed(1) + " LPA"
      : job.salary_min
      ? "₹" + (job.salary_min/1e5).toFixed(1) + "+ LPA"
      : "Not disclosed";

  const exp =
    job.experience_min != null && job.experience_max != null
      ? job.experience_min === job.experience_max
        ? job.experience_min + " yr"
        : job.experience_min + "–" + job.experience_max + " yrs"
      : job.experience_min != null
      ? job.experience_min + "+ yrs"
      : "Any exp";

  const locType = {
    remote: "🌐 Remote",
    hybrid: "🏠 Hybrid",
    onsite: "🏢 Onsite",
  }[job.location_type] || "";

  return {
    id:         job.id || uid(),
    title:      job.title        || "Untitled Role",
    company:    job.company      || "Unknown Company",
    location:   [job.location, locType].filter(Boolean).join(" · "),
    salary,
    experience: exp,
    jobType:    job.job_type     || "",
    skills:     (job.skills      || []).slice(0, 6),
    portal:     job.source_portal || "",
    applyUrl:   job.source_url   || "",
    matchScore: job.matchScore   || 0,
    matchWhy:   (job.matchReasons || []).join(", "),
  };
}

// ─── Intent detection ─────────────────────────────────────────────────────────
const JOB_INTENT_RE = [
  /find\s*(me\s*)?(jobs?|roles?|openings?|positions?|work|opportunities)/i,
  /show\s*(me\s*)?(jobs?|roles?|openings?|listings?|matches?|results?)/i,
  /get\s*(me\s*)?(jobs?|roles?|openings?|positions?|results?)/i,
  /search\s*(for\s*)?(jobs?|roles?|openings?)/i,
  /what\s*(jobs?|roles?|positions?|openings?)\s*(match|suit|fit|are)/i,
  /any\s*(new\s*)?(jobs?|roles?|openings?)/i,
  /latest\s*(jobs?|openings?|matches?)/i,
  /job\s*(matches?|results?|listings?|recommendations?)/i,
  /fetch\s*(jobs?|listings?|openings?)/i,
  /refresh\s*(jobs?|matches?|listings?|results?)/i,
  /matching\s*(jobs?|roles?|positions?)/i,
  /new\s*(openings?|positions?|roles?)/i,
  /find\s*(again|more|other|different)/i,
  /show\s*(again|more|other|different)/i,
  /search\s*(again|more)/i,
  /more\s*(jobs?|roles?|results?|matches?)/i,
  /other\s*(jobs?|roles?|options?|matches?)/i,
  /different\s*(jobs?|roles?|options?)/i,
  /give\s*(me\s*)?(jobs?|roles?|results?|matches?|openings?)/i,
  /look\s*(for\s*)?(jobs?|roles?|openings?)/i,
  /suggest\s*(jobs?|roles?|openings?|positions?)/i,
  /recommend\s*(jobs?|roles?|openings?)/i,
  /fetch\s*(again|more|results?)/i,
  /update\s*(jobs?|results?|matches?|listings?)/i,
  /reload\s*(jobs?|results?|matches?)/i,
];

export function isJobIntent(text) {
  return JOB_INTENT_RE.some(re => re.test(text));
}

// ─── Call AI server ───────────────────────────────────────────────────────────
export async function callAI(messages, system) {
  const res = await fetch(`${AI_SERVICE_URL}/api/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ messages, system }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error || `Server error ${res.status}`);
  }
  const d = await res.json();
  return d.reply || "";
}

// ─── Normalize profile for /match endpoint ────────────────────────────────────
export function normalizeProfileForMatch(profile) {
  const allSkillsRaw = [
    profile.techStack   || "",
    profile.frameworks  || "",
    profile.databases   || "",
    profile.cloud       || "",
  ].join(",");

  const skills = allSkillsRaw
    .split(/[,\s]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 1);

  const expRaw = (profile.experience || "").toLowerCase();
  let experience = 0;
  if (/fresher|trainee|student|intern|0/.test(expRaw)) {
    experience = 0;
  } else {
    const match = expRaw.match(/(\d+)/);
    experience = match ? parseInt(match[1], 10) : 0;
  }

  const jobTypeLower = (profile.jobType || "").toLowerCase();
  const locationType =
    jobTypeLower.includes("remote") ? "remote" :
    jobTypeLower.includes("hybrid") ? "hybrid" :
    jobTypeLower.includes("onsite") ? "onsite" : null;

  return {
    targetRole: profile.targetRole  || "",
    location:   profile.preferredLocations || profile.location || "",
    experience,
    skills,
    jobType:    profile.jobType     || "",
    ...(locationType ? { location_type: locationType } : {}),
  };
}

// ─── Build AI system prompt for job mode ──────────────────────────────────────
export function buildJobSystem(profile) {
  if (!profile) return "";
  const p = profile;
  const links = Object.entries(p.codingProfiles || {})
    .filter(([,v]) => v)
    .map(([k,v]) => `${k}: ${v}`)
    .join(", ");
  const projs = (p.projects || [])
    .filter(x => x.name)
    .map(x => `• ${x.name}: ${x.desc}${x.link ? ` (${x.link})` : ""}`)
    .join("\n");

  return `You are Nexus in Job Search Mode — a dedicated AI career assistant with deep knowledge of the tech job market, Indian and global hiring, compensation, and interview processes.

CANDIDATE PROFILE:
Name: ${p.name||"—"} | Location: ${p.location||"—"} | Target Role: ${p.targetRole||"—"}
Experience: ${p.experience||"—"} | Notice Period: ${p.noticePeriod||"—"}
Current CTC: ${p.currentCTC||"—"} | Expected CTC: ${p.expectedCTC||"—"}
Job Type: ${p.jobType||"—"} | Preferred Locations: ${p.preferredLocations||"—"}

EDUCATION: ${p.college||"—"} | ${p.degree||"—"} | Grad: ${p.graduationYear||"—"} | CGPA: ${p.cgpa||"—"}

TECH STACK:
Languages: ${p.techStack||"—"} | Frameworks: ${p.frameworks||"—"}
Databases: ${p.databases||"—"} | Cloud/DevOps: ${p.cloud||"—"}

CODING PROFILES: ${links||"—"}
PROJECTS:\n${projs||"—"}
ACHIEVEMENTS: ${p.achievements||"—"}
${p.resumeText ? `\nRESUME CONTENT:\n${p.resumeText.slice(0,1500)}` : ""}

INSTRUCTIONS:
- Always keep this candidate's full profile in mind
- Give tailored, specific advice for their exact stack and experience
- Help with: job search strategy, resume review, interview prep, salary negotiation, company research
- Suggest specific companies, roles, and job portals (LinkedIn, Naukri, Unstop, Wellfound, etc.)
- Be proactive and give concrete actionable steps

FORMAT RULES:
- Use ## headings for major sections
- Use **bold** for company names, role titles, important keywords
- Use numbered lists for steps/rankings, bullet lists for options
- Use tables to compare companies, salaries, or options side by side
- Use \`code\` for technical terms, CLI commands, tech names
- Keep answers well-structured and scannable`;
}

// ── Example usage inside your chat app ────────────────────────────────────────
//
// import { getJobsForUser, formatJob } from './jobService.js';
//
// // When user opens job mode in a chat:
// async function onJobModeOpen(chat) {
//   if (!chat.jobMode || !chat.jobProfile) return;
//
//   const jobs = await getJobsForUser(chat.jobProfile);
//   return jobs.map(formatJob);
// }
//
// // Each formatted job looks like:
// // {
// //   title:      "React Developer",
// //   company:    "Acme Corp",
// //   location:   "Bangalore · 🏠 Hybrid",
// //   salary:     "₹8.0–12.0 LPA",
// //   experience: "2–4 yrs",
// //   jobType:    "full-time",
// //   skills:     ["react", "typescript", "nodejs"],
// //   portal:     "naukri",
// //   applyUrl:   "https://...",
// //   matchScore: 43,
// //   matchWhy:   "3 skill match, title match, location match",
// // }