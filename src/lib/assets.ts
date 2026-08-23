/**
 * Get correct URL for public/ assets
 * Works with both GitHub Pages and root deployments
 */
export function getPublicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanBase = base.endsWith('/') ? base : base + '/';
  return cleanBase + cleanPath;
}
