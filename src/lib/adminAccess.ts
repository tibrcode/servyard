// Centralized admin access check for the frontend.
// Honors optional env vars for flexibility on Vercel:
// - VITE_ADMIN_EMAILS: comma-separated list of exact admin emails
// - VITE_ADMIN_DOMAINS: comma-separated list of allowed admin email domains
// Defaults keep existing behavior: admin@servyard.com and company domains.

const envEmails = (import.meta as any)?.env?.VITE_ADMIN_EMAILS as string | undefined;
const envDomains = (import.meta as any)?.env?.VITE_ADMIN_DOMAINS as string | undefined;

const defaultEmails = ["admin@servyard.com"];
const defaultDomains = ["tibrcode.com", "servyard.com", "serv-yard.com"];

const parseList = (val?: string): string[] =>
  (val || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const allowedEmails = new Set<string>([...defaultEmails.map((e) => e.toLowerCase()), ...parseList(envEmails)]);
const allowedDomains = new Set<string>([...defaultDomains.map((d) => d.toLowerCase()), ...parseList(envDomains)]);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  if (allowedEmails.has(e)) return true;
  const atIdx = e.lastIndexOf("@");
  if (atIdx === -1) return false;
  const domain = e.slice(atIdx + 1);
  return allowedDomains.has(domain);
}
