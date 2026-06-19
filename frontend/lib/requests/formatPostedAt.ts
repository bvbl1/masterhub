/** Relative label e.g. "Posted 2 hours ago" for job request cards. */
export function formatPostedAt(iso?: string): string {
  if (!iso?.trim()) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffSec < 60) return "Posted just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `Posted ${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Posted ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `Posted ${days} ${days === 1 ? "day" : "days"} ago`;

  return `Posted on ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

export function formatCompletedAt(iso?: string): string {
  if (!iso?.trim()) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `Completed on ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}
