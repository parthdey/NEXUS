// jobService.js
// Drop this file into your chat app.
// Call getJobsForUser(jobProfile) when job mode is ON for a chat.

const JOB_SERVICE_URL = import.meta.env.VITE_JOB_SERVICE_URL || 'http://localhost:3001';

/**
 * Fetch a curated list of jobs matched to a user's JobProfile.
 *
 * @param {object} jobProfile  — your chat's jobProfile object
 * @returns {Promise<Job[]>}   — top 20 scored jobs, best match first
 *
 * Each returned job has:
 *   id, title, company, location, location_type,
 *   salary_min, salary_max, experience_min, experience_max,
 *   job_type, skills[], source_portal, source_url,
 *   matchScore (number), matchReasons (string[])
 */
export async function getJobsForUser(jobProfile) {
  const res = await fetch(`${JOB_SERVICE_URL}/match`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(jobProfile),
  });

  if (!res.ok) throw new Error(`Job service error: ${res.status}`);
  const { jobs } = await res.json();
  return jobs;   // already sorted by matchScore descending
}

/**
 * Format a job for display inside your chat UI.
 * Returns a plain object with clean display strings.
 */
export function formatJob(job) {
  const salary =
    job.salary_min && job.salary_max
      ? `₹${(job.salary_min / 1e5).toFixed(1)}–${(job.salary_max / 1e5).toFixed(1)} LPA`
      : job.salary_min
      ? `₹${(job.salary_min / 1e5).toFixed(1)}+ LPA`
      : 'Salary not disclosed';

  const exp =
    job.experience_min != null && job.experience_max != null
      ? job.experience_min === job.experience_max
        ? `${job.experience_min} yr`
        : `${job.experience_min}–${job.experience_max} yrs`
      : job.experience_min != null
      ? `${job.experience_min}+ yrs`
      : 'Exp not specified';

  const locType = {
    remote: '🌐 Remote',
    hybrid: '🏠 Hybrid',
    onsite: '🏢 Onsite',
  }[job.location_type] || '';

  return {
    title:       job.title,
    company:     job.company,
    location:    [job.location, locType].filter(Boolean).join(' · '),
    salary,
    experience:  exp,
    jobType:     job.job_type,
    skills:      job.skills.slice(0, 6),        // top 6 skills
    portal:      job.source_portal,
    applyUrl:    job.source_url,
    matchScore:  job.matchScore,
    matchWhy:    job.matchReasons.join(', '),   // e.g. "3 skill match, title match"
  };
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