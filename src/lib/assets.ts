/**
 * Get correct URL for public/ assets on GitHub Pages (subpath deploy)
 */
export function getPublicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanBase = base.endsWith('/') ? base : base + '/';
  return cleanBase + cleanPath;
}
