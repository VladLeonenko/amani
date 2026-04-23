// Утилиты для конвертации между Page Builder блоками и HTML

import { PageBlock, SectionLayout } from '@/types/pageBuilder';
import { PAGE_BUILDER_MEDIA_GIF_VIEWPORT_HTML_STYLE } from '@/constants/pageBuilderMedia';
import { getSectionGridFrWidths } from '@/utils/pageBuilderSectionGrid';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

function escapeAttr(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(s: string): string {
  return escapeAttr(s);
}

/**
 * Один блок → HTML (рекурсивно для section и вложенных типов)
 */
export function blockToHtml(block: PageBlock): string {
  const styles = block.styles || {};
  const styleString = buildStyleString(styles);
  const className = block.settings?.className || '';

  switch (block.type) {
    case 'section': {
      const layout = (block.content?.layout || 'full-width') as SectionLayout;
      const columns = block.content?.columns || [];
      const gridFr = getSectionGridFrWidths(layout, columns.length, block.content?.columnWidths);
      const gridTemplate = gridFr.map((w) => `minmax(0,${w}fr)`).join(' ');
      const colsHtml = columns
        .map((col, idx) => {
          const inner = (col.blocks || []).map((b) => blockToHtml(b)).join('\n');
          return `<div class="page-builder-section-column" data-column-index="${idx}">${inner}</div>`;
        })
        .join('');
      return `<section class="page-builder-block page-builder-section ${escapeAttr(className)}" style="${escapeAttr(styleString)};display:grid;grid-template-columns:${gridTemplate};gap:16px;width:100%;max-width:100%;box-sizing:border-box;align-items:start;">${colsHtml}</section>`;
    }

    case 'cover':
      return `
          <div class="page-builder-block page-builder-cover ${escapeAttr(className)}" style="${escapeAttr(styleString)}">
            ${block.content.html || ''}
            ${block.content.text ? `<h1>${escapeText(String(block.content.text))}</h1>` : ''}
            ${block.content.imageUrl ? `<img src="${escapeAttr(resolveImageUrl(block.content.imageUrl, ''))}" alt="" />` : ''}
          </div>
        `;

    case 'content':
      return `
          <div class="page-builder-block page-builder-content ${escapeAttr(className)}" style="${escapeAttr(styleString)}">
            ${block.content.html || ''}
            ${block.content.text ? `<p>${escapeText(String(block.content.text))}</p>` : ''}
            ${block.content.imageUrl ? `<img src="${escapeAttr(resolveImageUrl(block.content.imageUrl, ''))}" alt="" />` : ''}
          </div>
        `;

    case 'gallery': {
      const galleryItems = block.content.items || [];
      return `
          <div class="page-builder-block page-builder-gallery ${escapeAttr(className)}" style="${escapeAttr(styleString)}">
            ${galleryItems
              .map(
                (item: { imageUrl?: string; alt?: string }) =>
                  `<img src="${escapeAttr(resolveImageUrl(item.imageUrl || '', ''))}" alt="${escapeAttr(item.alt || '')}" />`
              )
              .join('')}
          </div>
        `;
    }

    case 'image':
      return `<div class="page-builder-block page-builder-image ${escapeAttr(className)}" style="${escapeAttr(styleString)}"><img src="${escapeAttr(resolveImageUrl(block.content.imageUrl || '', ''))}" alt="${escapeAttr(block.seo?.alt || block.name || '')}" style="width:100%;height:auto;display:block;" loading="lazy" /></div>`;

    case 'image-gif': {
      const images = block.content?.images || [];
      const n = images.length;
      const fps = Math.max(1, Number(block.content?.gifFps) || 5);
      const durationMs = n > 1 ? Math.round((n / fps) * 1000) : 3000;
      const rawId = (block.id || `gif-${n}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const animName = `pb_gif_${rawId}`.slice(0, 80);

      if (n === 0) {
        return `<div class="page-builder-block page-builder-image-gif ${escapeAttr(className)}" style="${escapeAttr(styleString)}"></div>`;
      }

      const imgsHtml = images
        .map(
          (url: string) =>
            `<img src="${escapeAttr(resolveImageUrl(url, ''))}" alt="" style="width:${100 / n}%;flex-shrink:0;height:100%;object-fit:cover;object-position:center;display:block;"/>`
        )
        .join('');

      if (n === 1) {
        return `<div class="page-builder-block page-builder-image-gif ${escapeAttr(className)}" style="${escapeAttr(styleString)}"><div class="page-builder-image-gif-viewport" style="${escapeAttr(PAGE_BUILDER_MEDIA_GIF_VIEWPORT_HTML_STYLE)}"><div class="page-builder-image-gif-track" style="display:flex;width:100%;height:100%">${imgsHtml}</div></div></div>`;
      }

      const pct = ((n - 1) / n) * 100;
      const keyframes = `<style>@keyframes ${animName}{from{transform:translateX(0)}to{transform:translateX(-${pct}%)}}</style>`;
      const anim = `${animName} ${durationMs}ms steps(${n}) infinite`;
      return `${keyframes}<div class="page-builder-block page-builder-image-gif ${escapeAttr(className)}" style="${escapeAttr(styleString)}"><div class="page-builder-image-gif-viewport" style="${escapeAttr(PAGE_BUILDER_MEDIA_GIF_VIEWPORT_HTML_STYLE)}"><div class="page-builder-image-gif-track" style="display:flex;width:${n * 100}%;height:100%;animation:${escapeAttr(anim)}">${imgsHtml}</div></div></div>`;
    }

    case 'image-compare': {
      const imgs = block.content?.images || [];
      const [img1, img2] = [imgs[0], imgs[1]];
      return `<div class="page-builder-block page-builder-image-compare ${escapeAttr(className)}" style="${escapeAttr(styleString)};display:grid;grid-template-columns:1fr 1fr;gap:8px;"><div><img src="${escapeAttr(resolveImageUrl(img1 || '', ''))}" alt="Before" style="width:100%;height:auto;" /></div><div><img src="${escapeAttr(resolveImageUrl(img2 || img1 || '', ''))}" alt="After" style="width:100%;height:auto;" /></div></div>`;
    }

    case 'image-wave':
      return block.content?.imageUrl
        ? `<div class="page-builder-block page-builder-image-wave ${escapeAttr(className)}" style="${escapeAttr(styleString)}"><img src="${escapeAttr(resolveImageUrl(block.content.imageUrl, ''))}" alt="" style="width:100%;height:auto;display:block;" /></div>`
        : '';

    case 'text':
      if (block.content.html) {
        return `<div class="page-builder-block page-builder-text ${escapeAttr(className)}" style="${escapeAttr(styleString)};white-space:pre-wrap;">${block.content.html}</div>`;
      }
      return `<div class="page-builder-block page-builder-text ${escapeAttr(className)}" style="${escapeAttr(styleString)};white-space:pre-wrap;">${escapeText(block.content.text || '')}</div>`;

    case 'video': {
      const url = String(block.content?.videoUrl || block.content?.iframeUrl || '').trim();
      if (!url) return '';
      const isEmbed =
        /^https?:\/\//i.test(url) &&
        (/youtube\.com|youtu\.be|vimeo\.com|vk\.com|rutube\.ru/i.test(url) || url.includes('/embed/'));
      if (isEmbed) {
        return `<div class="page-builder-block page-builder-video ${escapeAttr(className)}" style="${escapeAttr(styleString)}"><iframe src="${escapeAttr(url)}" title="video" style="width:100%;min-height:360px;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      }
      const src = resolveImageUrl(url, '');
      return `<div class="page-builder-block page-builder-video ${escapeAttr(className)}" style="${escapeAttr(styleString)}"><video src="${escapeAttr(src)}" controls playsinline style="width:100%;max-height:480px;"></video></div>`;
    }

    case 'spacer': {
      const ss = buildStyleString({
        ...(styles as object),
        minHeight: styles.minHeight ?? 48,
      } as Record<string, unknown>);
      return `<div class="page-builder-block page-builder-spacer ${escapeAttr(className)}" style="${escapeAttr(ss)}" aria-hidden="true"></div>`;
    }

    case 'cta':
      return `<div class="page-builder-block page-builder-cta ${escapeAttr(className)}" style="${escapeAttr(styleString)};text-align:center;padding:24px;">
            ${block.content.title ? `<h3>${escapeText(String(block.content.title))}</h3>` : ''}
            ${block.content.text ? `<p>${escapeText(String(block.content.text))}</p>` : ''}
            ${block.content.buttonText && block.content.linkUrl ? `<a class="page-builder-cta-btn" href="${escapeAttr(String(block.content.linkUrl))}">${escapeText(String(block.content.buttonText))}</a>` : ''}
          </div>`;

    case 'features': {
      const items = block.content.items || [];
      const cards = items
        .map(
          (item: { title?: string; description?: string; imageUrl?: string }) =>
            `<div class="page-builder-feature-card">${item.imageUrl ? `<img src="${escapeAttr(resolveImageUrl(item.imageUrl, ''))}" alt="" />` : ''}${item.title ? `<h4>${escapeText(String(item.title))}</h4>` : ''}${item.description ? `<p>${escapeText(String(item.description))}</p>` : ''}</div>`
        )
        .join('');
      return `<div class="page-builder-block page-builder-features ${escapeAttr(className)}" style="${escapeAttr(styleString)}">${block.content.title ? `<h2>${escapeText(String(block.content.title))}</h2>` : ''}<div class="page-builder-features-grid">${cards}</div></div>`;
    }

    case 'forms': {
      const fields = block.content.fields || [];
      const fieldsHtml = fields
        .map(
          (field: { name?: string; placeholder?: string; type?: string; required?: boolean }) =>
            `<label>${escapeText(String(field.name || ''))}<input type="${escapeAttr(String(field.type || 'text'))}" name="${escapeAttr(String(field.name || ''))}" placeholder="${escapeAttr(String(field.placeholder || ''))}" ${field.required ? 'required' : ''} /></label>`
        )
        .join('');
      return `<div class="page-builder-block page-builder-forms ${escapeAttr(className)}" style="${escapeAttr(styleString)}">${fieldsHtml}<button type="button">${escapeText(String(block.content.submitButtonText || 'Отправить'))}</button></div>`;
    }

    default:
      return `
          <div class="page-builder-block page-builder-${escapeAttr(block.type)} ${escapeAttr(className)}" style="${escapeAttr(styleString)}">
            ${block.content.html || ''}
            ${block.content.text ? `<p>${escapeText(String(block.content.text))}</p>` : ''}
          </div>
        `;
  }
}

/**
 * Конвертирует блоки Page Builder в HTML для публикации и предпросмотра
 */
export function blocksToHtml(blocks: PageBlock[]): string {
  if (!blocks || blocks.length === 0) return '';
  return blocks.map((b) => blockToHtml(b)).join('\n');
}

/**
 * Тело статьи для публичной страницы: из маркера PAGE_BUILDER или сырого JSON массива блоков → нормальный HTML
 */
export function normalizeBlogBodyForDisplay(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  const trimmed = raw.trim();
  const markerMatch = trimmed.match(/<!--PAGE_BUILDER_BLOCKS_START-->([\s\S]*?)<!--PAGE_BUILDER_BLOCKS_END-->/);
  if (markerMatch) {
    try {
      const blocks = JSON.parse(markerMatch[1]);
      if (Array.isArray(blocks) && blocks.length > 0 && blocks[0]?.type) {
        return blocksToHtml(blocks as PageBlock[]);
      }
    } catch {
      /* ignore */
    }
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.type) {
        return blocksToHtml(parsed as PageBlock[]);
      }
    } catch {
      /* ignore */
    }
  }

  return raw;
}

/**
 * Извлекает массив блоков Page Builder из сырого тела статьи (маркер или JSON-массив).
 * Для публичного рендера через React — до normalizeBlogBodyForDisplay.
 */
export function parsePageBuilderBlocksFromRawBody(raw: string): PageBlock[] | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const markerMatch = trimmed.match(/<!--PAGE_BUILDER_BLOCKS_START-->([\s\S]*?)<!--PAGE_BUILDER_BLOCKS_END-->/);
  if (markerMatch) {
    try {
      const blocks = JSON.parse(markerMatch[1]);
      if (Array.isArray(blocks) && blocks.length > 0 && blocks[0]?.type) return blocks as PageBlock[];
    } catch {
      return null;
    }
  }
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.type) return parsed as PageBlock[];
    } catch {
      return null;
    }
  }
  return null;
}

/** Блоки из body/content_json для совпадения превью PB и продакшена. */
export function parsePageBuilderBlocksFromPost(post: { body?: string; contentHtml?: string; content_html?: string; content_json?: unknown }): PageBlock[] | null {
  const raw = post.body || post.contentHtml || post.content_html || '';
  const fromBody = parsePageBuilderBlocksFromRawBody(raw);
  if (fromBody?.length) return fromBody;
  const cj = post.content_json;
  if (cj) {
    try {
      const blocks = Array.isArray(cj) ? cj : (cj as { blocks?: PageBlock[] })?.blocks ?? [];
      if (Array.isArray(blocks) && blocks.length > 0 && blocks[0]?.type) return blocks as PageBlock[];
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Конвертирует HTML обратно в блоки Page Builder (базовая версия)
 */
export function htmlToBlocks(html: string): PageBlock[] {
  if (!html || html.trim() === '') return [];

  const jsonMatch = html.match(/<!--PAGE_BUILDER_BLOCKS_START-->(.*?)<!--PAGE_BUILDER_BLOCKS_END-->/s);
  if (jsonMatch) {
    try {
      const blocks = JSON.parse(jsonMatch[1]);
      return Array.isArray(blocks) ? blocks : [];
    } catch {
      // Если не удалось распарсить, продолжаем с HTML парсингом
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blockElements = doc.querySelectorAll('.page-builder-block');

  if (blockElements.length > 0) {
    return Array.from(blockElements).map((el, index) => {
      const type = el.className.match(/page-builder-(\w+)/)?.[1] || 'content';
      return {
        id: `block-${Date.now()}-${index}`,
        type: type as PageBlock['type'],
        name: `Block ${index + 1}`,
        category: type,
        content: {
          html: el.innerHTML,
          text: el.textContent || '',
        },
        styles: {},
        position: {
          x: 0,
          y: index * 200,
          width: 1200,
          height: 200,
        },
        order: index,
      } as PageBlock;
    });
  }

  return [
    {
      id: `block-${Date.now()}`,
      type: 'content',
      name: 'Content Block',
      category: 'content',
      content: {
        html: html,
      },
      styles: {},
      position: {
        x: 0,
        y: 0,
        width: 1200,
        height: 400,
      },
      order: 0,
    } as PageBlock,
  ];
}

/**
 * Сохраняет блоки в HTML с метаданными
 */
export function blocksToHtmlWithMetadata(blocks: PageBlock[]): string {
  const blocksJson = JSON.stringify(blocks);
  const html = blocksToHtml(blocks);
  return `<!--PAGE_BUILDER_BLOCKS_START-->${blocksJson}<!--PAGE_BUILDER_BLOCKS_END-->\n${html}`;
}

/**
 * Строит строку стилей из объекта стилей
 */
function buildStyleString(styles: Record<string, unknown>): string {
  const styleParts: string[] = [];

  if (styles.backgroundColor) styleParts.push(`background-color: ${styles.backgroundColor}`);
  if (styles.color) styleParts.push(`color: ${styles.color}`);
  if (styles.minHeight != null && styles.minHeight !== 'auto') {
    const mh = styles.minHeight;
    styleParts.push(`min-height: ${typeof mh === 'number' ? `${mh}px` : String(mh)}`);
  }
  if (styles.padding && typeof styles.padding === 'object') {
    const p = styles.padding as { top?: number; right?: number; bottom?: number; left?: number };
    if (p.top) styleParts.push(`padding-top: ${p.top}px`);
    if (p.right) styleParts.push(`padding-right: ${p.right}px`);
    if (p.bottom) styleParts.push(`padding-bottom: ${p.bottom}px`);
    if (p.left) styleParts.push(`padding-left: ${p.left}px`);
  }
  if (styles.margin && typeof styles.margin === 'object') {
    const m = styles.margin as { top?: number; right?: number; bottom?: number; left?: number };
    if (m.top) styleParts.push(`margin-top: ${m.top}px`);
    if (m.right) styleParts.push(`margin-right: ${m.right}px`);
    if (m.bottom) styleParts.push(`margin-bottom: ${m.bottom}px`);
    if (m.left) styleParts.push(`margin-left: ${m.left}px`);
  }
  if (styles.fontSize) styleParts.push(`font-size: ${styles.fontSize}px`);
  if (styles.textAlign) styleParts.push(`text-align: ${styles.textAlign}`);

  return styleParts.join('; ');
}
