/**
 * Нормализует значение CSS background-image: оборачивает голый URL/path в url("..."),
 * градиенты и уже оформленный url() не трогает.
 */
export function normalizeBackgroundImageCss(raw: string | undefined | null): string | undefined {
  if (raw == null) return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('url(') ||
    lower.startsWith('linear-gradient') ||
    lower.startsWith('radial-gradient') ||
    lower.startsWith('conic-gradient') ||
    lower.startsWith('repeating-linear-gradient') ||
    lower.startsWith('repeating-radial-gradient')
  ) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    const escaped = trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `url("${escaped}")`;
  }

  return trimmed;
}

/**
 * Подставляет полные URL внутри url(...) для фона (как resolveImageUrl для img src).
 */
export function resolveBackgroundImageCssForDisplay(
  raw: string | undefined | null,
  resolveImage: (path: string) => string
): string | undefined {
  const normalized = normalizeBackgroundImageCss(raw);
  if (!normalized) return undefined;
  return normalized.replace(/url\s*\(\s*(["']?)([^"')]+)\1\s*\)/gi, (_full, _q, inner: string) => {
    const trimmed = inner.trim();
    if (/^data:/i.test(trimmed)) return `url("${trimmed.replace(/"/g, '\\"')}")`;
    const resolved = resolveImage(trimmed);
    const escaped = resolved.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `url("${escaped}")`;
  });
}
