/**
 * Высота и пропорции медиа-блоков Page Builder (админка + публичная статья).
 * Меняй здесь — GIF, «до/после», wave используют одни и те же правила.
 */
export const PAGE_BUILDER_MEDIA = {
  aspectRatio: '16 / 9',
  minHeight: 280,
  maxHeight: 'min(85vh, 900px)',
} as const;

/** Для blockToHtml (статический HTML без React) — viewport GIF */
export const PAGE_BUILDER_MEDIA_GIF_VIEWPORT_HTML_STYLE =
  'width:100%;aspect-ratio:16/9;min-height:280px;max-height:min(85vh,900px);overflow:hidden;position:relative';
