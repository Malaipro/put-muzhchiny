/**
 * Get correct URL for public/ assets
 * Works with both GitHub Pages and root deployments
 */
export const PUBLIC_ASSET_REVISION = '2026-10-20-v5';

export function getPublicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const separator = cleanPath.includes('?') ? '&' : '?';

  // Telegram iOS keeps an aggressive WebView cache between Mini App opens.
  // Public assets have stable filenames, so give every release a fresh URL.
  return `${cleanBase}${cleanPath}${separator}asset=${PUBLIC_ASSET_REVISION}`;
}
