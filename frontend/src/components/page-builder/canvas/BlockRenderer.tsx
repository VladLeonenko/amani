import { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import { PageBlock, DeviceType, SectionLayout } from '@/types/pageBuilder';
import {
  getSectionGridFrWidths,
  frWidthsToLabelPercents,
} from '@/utils/pageBuilderSectionGrid';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { resolveBackgroundImageCssForDisplay } from '@/utils/backgroundImageCss';
import { SectionBlockSelector } from '../sections/SectionBlockSelector';
import { BlockCanvasToolbar } from './BlockCanvasToolbar';
import { PAGE_BUILDER_MEDIA } from '@/constants/pageBuilderMedia';
import { inferContentVariant, shouldHideGenericForContentVariant } from '@/utils/pageBuilderContentVariant';

/** Поля на холсте: без дефолтной белой/серой заливки Outlined/Filled. */
const editorFieldTransparentSx = {
  '& .MuiInputBase-root': { backgroundColor: 'transparent' },
  '& .MuiOutlinedInput-root': { backgroundColor: 'transparent !important' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.23)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.4)' },
  '& .MuiFilledInput-root': { backgroundColor: 'transparent !important' },
  '& .MuiInput-root': { backgroundColor: 'transparent' },
  '& .MuiInputBase-input': { backgroundColor: 'transparent' },
} as const;

function pbRichTextSx(textColor: string) {
  return {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    color: textColor,
    WebkitTextFillColor: textColor,
    '&, & *': {
      color: `${textColor} !important`,
      WebkitTextFillColor: `${textColor} !important`,
    },
    '& p, & li, & blockquote': {
      maxWidth: '100% !important',
      marginLeft: '0 !important',
      marginRight: '0 !important',
    },
    '& div[class*="ql-"]': {
      maxWidth: '100% !important',
      marginLeft: '0 !important',
      marginRight: '0 !important',
    },
    /* Quill/статьи: узкая колонка через inline max-width + margin: auto */
    '& div[style*="max-width"]': {
      maxWidth: '100% !important',
      marginLeft: '0 !important',
      marginRight: '0 !important',
    },
  };
}

function ImageCompareBlock({
  block,
  resolveImageUrl,
}: {
  block: PageBlock;
  resolveImageUrl: (u: string) => string;
}) {
  const [img1, img2] = block.content?.images || ['', ''];
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(p);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    };
    const onUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updatePosition]);

  const clipRight = Math.max(0, Math.min(100, 100 - position));

  return (
    <Box
      ref={containerRef}
      className="page-builder-image-compare"
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        aspectRatio: PAGE_BUILDER_MEDIA.aspectRatio,
        minHeight: PAGE_BUILDER_MEDIA.minHeight,
        maxHeight: PAGE_BUILDER_MEDIA.maxHeight,
        overflow: 'hidden',
        cursor: 'col-resize',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        e.preventDefault();
        isDragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        updatePosition(e.clientX);
      }}
    >
      <Box
        component="img"
        src={resolveImageUrl(img2 || img1)}
        alt=""
        draggable={false}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
        }}
      />
      <Box
        component="img"
        src={resolveImageUrl(img1)}
        alt=""
        draggable={false}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
          clipPath: `inset(0 ${clipRight}% 0 0)`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: `${position}%`,
          width: 4,
          height: '100%',
          bgcolor: 'white',
          boxShadow: 2,
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </Box>
  );
}

function GallerySlider({
  items,
  autoplay,
  speed,
  pauseOnHover,
  showArrows,
  showDots,
}: {
  items: { imageUrl: string; alt?: string }[];
  autoplay: boolean;
  speed: number;
  pauseOnHover: boolean;
  showArrows: boolean;
  showDots: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const length = items.length;

  useEffect(() => {
    if (!autoplay || length <= 1) return;
    if (pauseOnHover && isHovered) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % length);
    }, Math.max(speed, 1200));
    return () => clearInterval(timer);
  }, [autoplay, speed, length, pauseOnHover, isHovered]);

  if (length === 0) {
    return (
      <Box sx={{ height: 220, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Добавьте изображения в слайдер</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ position: 'relative', overflow: 'hidden', borderRadius: 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        sx={{
          display: 'flex',
          transition: 'transform 300ms ease',
          transform: `translateX(-${index * 100}%)`,
        }}
      >
        {items.map((item, i) => (
          <Box
            key={`${item.imageUrl}-${i}`}
            component="img"
            src={resolveImageUrl(item.imageUrl)}
            alt={item.alt || ''}
            sx={{ width: '100%', flexShrink: 0, height: 260, objectFit: 'cover' }}
          />
        ))}
      </Box>
      {length > 1 && showArrows && (
        <>
          <Button
            size="small"
            onClick={() => setIndex((prev) => (prev - 1 + length) % length)}
            sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', minWidth: 32, p: 0.5 }}
            variant="contained"
          >
            ‹
          </Button>
          <Button
            size="small"
            onClick={() => setIndex((prev) => (prev + 1) % length)}
            sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', minWidth: 32, p: 0.5 }}
            variant="contained"
          >
            ›
          </Button>
        </>
      )}
      {length > 1 && showDots && (
        <Box sx={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 0.8 }}>
          {items.map((_, dotIndex) => (
            <Box
              key={dotIndex}
              onClick={() => setIndex(dotIndex)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: dotIndex === index ? 'white' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

interface BlockRendererProps {
  block: PageBlock;
  deviceType: DeviceType;
  isPreview: boolean;
  onUpdateBlock: (blockId: string, updates: Partial<PageBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlockToSection?: (sectionId: string, columnId: string, block: Partial<PageBlock>) => void;
  onColumnActivate?: (sectionId: string, columnId: string) => void;
  activeColumnTarget?: { sectionId: string; columnId: string } | null;
  onBlockSelect?: (blockId: string | null) => void;
  selectedBlockId?: string | null;
}

export function BlockRenderer({
  block,
  deviceType,
  isPreview,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlockToSection,
  onColumnActivate,
  activeColumnTarget,
  onBlockSelect,
  selectedBlockId,
}: BlockRendererProps) {
  const styles = block.styles || {};
  const isSelected = selectedBlockId === block.id;
  const display = styles.display?.[deviceType] || 'block';

  if (display === 'none') {
    return null;
  }

  const blockStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    width: styles.width || '100%',
    height: styles.height || 'auto',
    minHeight: styles.minHeight || 'auto',
    maxWidth: styles.maxWidth || '100%',
    backgroundColor: styles.backgroundColor || 'transparent',
    color: styles.color || '#000',
    padding: styles.padding
      ? `${styles.padding.top || 0}px ${styles.padding.right || 0}px ${styles.padding.bottom || 0}px ${styles.padding.left || 0}px`
      : undefined,
    margin: styles.margin
      ? `${styles.margin.top || 0}px ${styles.margin.right || 0}px ${styles.margin.bottom || 0}px ${styles.margin.left || 0}px`
      : undefined,
    borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined,
    borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : undefined,
    borderStyle: styles.borderStyle || 'none',
    borderColor: styles.borderColor || 'transparent',
    boxShadow: styles.boxShadow || undefined,
    opacity: styles.opacity !== undefined ? styles.opacity : 1,
    zIndex: styles.zIndex || 'auto',
    backgroundImage:
      resolveBackgroundImageCssForDisplay(styles.backgroundImage, (u) => resolveImageUrl(u, '')) || undefined,
    backgroundSize: styles.backgroundSize || 'cover',
    backgroundPosition: styles.backgroundPosition || 'center',
    backgroundRepeat: styles.backgroundRepeat || 'no-repeat',
    textAlign: styles.textAlign || 'left',
    fontSize: styles.fontSize ? `${styles.fontSize}px` : undefined,
    fontFamily: styles.fontFamily || 'inherit',
    fontWeight: styles.fontWeight || 'normal',
    lineHeight: styles.lineHeight || 1.5,
    letterSpacing: styles.letterSpacing ? `${styles.letterSpacing}px` : undefined,
  };

  const anim = styles.animation;
  const hasPreviewAnim =
    isPreview &&
    anim?.enabled === true &&
    (anim.effect === 'fade' ||
      anim.effect === 'slide' ||
      anim.effect === 'zoom' ||
      anim.effect === undefined);

  const renderContent = () => {
    switch (block.type) {
      case 'section': {
        const layout = (block.content?.layout || 'full-width') as SectionLayout;
        const columns = block.content?.columns || [];
        const gridFr = getSectionGridFrWidths(layout, columns.length, block.content?.columnWidths);
        const labelPercents = frWidthsToLabelPercents(gridFr);

        return (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: gridFr.map((w) => `minmax(0, ${w}fr)`).join(' '),
              gap: 2,
              p: 0,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            {columns.map((col, idx) => {
              const columnActive =
                activeColumnTarget?.sectionId === block.id && activeColumnTarget?.columnId === col.id;
              return (
              <Box
                key={col.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isPreview && onColumnActivate) onColumnActivate(block.id, col.id);
                }}
                sx={{
                  minHeight: 80,
                  border: !isPreview ? `2px ${columnActive ? 'solid' : 'dashed'} ${columnActive ? 'primary.main' : '#ccc'}` : 'none',
                  borderRadius: 1,
                  p: 0,
                  bgcolor: !isPreview ? (columnActive ? 'rgba(25, 118, 210, 0.06)' : 'transparent') : 'transparent',
                  cursor: !isPreview && onColumnActivate ? 'pointer' : 'default',
                  '&:hover': !isPreview && onColumnActivate ? { bgcolor: '#f0f0f0' } : {},
                }}
              >
                <Box
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{ position: 'relative', zIndex: 1 }}
                >
                {(col.blocks || []).map((b) => (
                  <Box
                    key={b.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPreview && onBlockSelect) onBlockSelect(b.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    sx={{
                      position: 'relative',
                      mb: 1,
                      border: isPreview
                        ? 'none'
                        : selectedBlockId === b.id
                          ? '2px solid #1976d2'
                          : 'none',
                      borderRadius: 1,
                    }}
                  >
                    {!isPreview && (
                      <BlockCanvasToolbar
                        onEdit={() => onBlockSelect?.(b.id)}
                        onDelete={() => onDeleteBlock(b.id)}
                      />
                    )}
                    <BlockRenderer
                      block={b}
                      deviceType={deviceType}
                      isPreview={isPreview}
                      onUpdateBlock={onUpdateBlock}
                      onDeleteBlock={onDeleteBlock}
                      onAddBlockToSection={onAddBlockToSection}
                      onColumnActivate={onColumnActivate}
                      activeColumnTarget={activeColumnTarget}
                      onBlockSelect={onBlockSelect}
                      selectedBlockId={selectedBlockId}
                    />
                  </Box>
                ))}
                </Box>
                {!isPreview && onAddBlockToSection && (
                  <SectionBlockSelector
                    label={`Колонка ${idx + 1} (${Math.round(labelPercents[idx] ?? 0)}%)`}
                    onSelectBlock={(partial) => onAddBlockToSection(block.id, col.id, partial)}
                  />
                )}
              </Box>
            );
            })}
          </Box>
        );
      }

      case 'cover': {
        const hasHeroBg = Boolean(block.content?.videoUrl || block.content?.imageUrl);
        const titleColor = styles.color || (hasHeroBg ? '#fff' : '#000');
        const subColor = styles.color || (hasHeroBg ? '#fff' : 'rgba(0,0,0,0.8)');
        return (
          <Box sx={{ position: 'relative', width: '100%', minHeight: 400 }}>
            {block.content.videoUrl && (
              <Box
                component="video"
                src={resolveImageUrl(block.content.videoUrl)}
                autoPlay
                loop
                muted
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            {block.content.imageUrl && !block.content.videoUrl && (
              <Box
                component="img"
                src={resolveImageUrl(block.content.imageUrl)}
                alt={block.content.title}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            <Box
              sx={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                textAlign: 'center',
                p: 0,
              }}
            >
              {!isPreview && isSelected ? (
                <>
                  <TextField
                    fullWidth
                    value={block.content.title || ''}
                    placeholder="Заголовок"
                    onChange={(e) =>
                      onUpdateBlock(block.id, { content: { ...block.content, title: e.target.value } })
                    }
                    sx={{
                      ...editorFieldTransparentSx,
                      mb: 2,
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '2rem', md: '4rem' },
                        fontWeight: 700,
                        textAlign: 'center',
                        color: titleColor,
                        WebkitTextFillColor: titleColor,
                      },
                    }}
                    variant="standard"
                  />
                  <TextField
                    fullWidth
                    value={block.content.subtitle || ''}
                    placeholder="Подзаголовок"
                    onChange={(e) =>
                      onUpdateBlock(block.id, { content: { ...block.content, subtitle: e.target.value } })
                    }
                    sx={{
                      ...editorFieldTransparentSx,
                      mb: 2,
                      '& .MuiInputBase-input': {
                        fontSize: '1.25rem',
                        textAlign: 'center',
                        color: subColor,
                        WebkitTextFillColor: subColor,
                      },
                    }}
                    variant="standard"
                  />
                  <TextField
                    size="small"
                    value={block.content.buttonText || ''}
                    placeholder="Текст кнопки"
                    onChange={(e) =>
                      onUpdateBlock(block.id, { content: { ...block.content, buttonText: e.target.value } })
                    }
                    sx={{ ...editorFieldTransparentSx, mb: 1 }}
                  />
                </>
              ) : (
                <>
                  {block.content.title && (
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2rem', md: '4rem' },
                        fontWeight: 700,
                        mb: 2,
                        color: titleColor,
                      }}
                    >
                      {block.content.title}
                    </Typography>
                  )}
                  {block.content.subtitle && (
                    <Typography variant="h5" sx={{ mb: 3, color: subColor }}>
                      {block.content.subtitle}
                    </Typography>
                  )}
                  {block.content.buttonText && (
                    <Button variant="contained" size="large">
                      {block.content.buttonText}
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
        );
      }

      case 'content': {
        const richColor = styles.color || '#000';
        const cv = inferContentVariant(block);
        const hideGeneric = shouldHideGenericForContentVariant(cv);
        const showLegacyRich =
          !hideGeneric &&
          (!cv || cv === 'text' || cv === 'image-text');
        const c = block.content as Record<string, unknown>;
        return (
          <Box sx={{ ...pbRichTextSx(richColor) }}>
            {showLegacyRich && block.content.imageUrl && (
              <Box
                component="img"
                src={resolveImageUrl(block.content.imageUrl)}
                alt={block.seo?.alt || block.name}
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'cover',
                  mb: 2,
                }}
              />
            )}
            {showLegacyRich && block.content.text && (
              <Box
                component="div"
                dangerouslySetInnerHTML={{ __html: block.content.text as string }}
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              />
            )}
            {showLegacyRich && block.content.html && (
              <Box
                dangerouslySetInnerHTML={{ __html: block.content.html as string }}
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              />
            )}
            {/* FAQ: на холсте — редактируемые поля (раньше только Typography, «инпуты не работали») */}
            {cv === 'faq' && block.content.items && (
              <Box onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                {(block.content.items || []).map((item: any, index: number) => (
                  <Box
                    key={index}
                    sx={{ mb: 2 }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {isPreview ? (
                      <>
                        <Typography variant="h6" sx={{ mb: 1, color: styles.color || '#000' }}>
                          {item.question}
                        </Typography>
                        <Typography sx={{ color: styles.color || '#000' }}>{item.answer}</Typography>
                      </>
                    ) : (
                      <>
                        <TextField
                          fullWidth
                          size="small"
                          label="Вопрос"
                          value={item.question || ''}
                          onChange={(e) => {
                            const newItems = [...(block.content.items || [])];
                            newItems[index] = { ...newItems[index], question: e.target.value };
                            onUpdateBlock(block.id, {
                              content: { ...block.content, items: newItems, type: 'faq' },
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{ mb: 1, ...editorFieldTransparentSx }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          label="Ответ"
                          value={item.answer || ''}
                          onChange={(e) => {
                            const newItems = [...(block.content.items || [])];
                            newItems[index] = { ...newItems[index], answer: e.target.value };
                            onUpdateBlock(block.id, {
                              content: { ...block.content, items: newItems, type: 'faq' },
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={editorFieldTransparentSx}
                        />
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            {/* Pricing */}
            {cv === 'pricing' && block.content.plans && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                {(block.content.plans || []).map((plan: any, index: number) => (
                  <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h5" sx={{ color: styles.color || '#000' }}>{plan.name}</Typography>
                    <Typography variant="h4" sx={{ color: styles.color || '#000' }}>{plan.price}</Typography>
                    <Typography variant="body2" sx={{ color: styles.color || '#000' }}>{plan.period}</Typography>
                    <Typography sx={{ my: 2, color: styles.color || '#000' }}>{plan.description}</Typography>
                    <Button variant="contained">{plan.buttonText || 'Выбрать'}</Button>
                  </Box>
                ))}
              </Box>
            )}
            {/* Team */}
            {cv === 'team' && block.content.items && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                {(block.content.items || []).map((member: any, index: number) => {
                  const photo = member.photo || member.imageUrl;
                  return (
                    <Box key={index} sx={{ textAlign: 'center' }}>
                      {photo && (
                        <Box
                          component="img"
                          src={resolveImageUrl(photo)}
                          alt={member.name}
                          sx={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', mx: 'auto', mb: 1 }}
                        />
                      )}
                      <Typography variant="h6" sx={{ color: styles.color || '#000' }}>{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{member.role}</Typography>
                      <Typography variant="body2" sx={{ mt: 1, color: styles.color || '#000' }}>{member.description}</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
            {/* Steps */}
            {cv === 'steps' && block.content.steps && (
              <Box>
                {(block.content.steps || []).map((step: any, index: number) => (
                  <Box key={index} sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <Box sx={{ minWidth: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {step.number || index + 1}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ color: styles.color || '#000' }}>{step.title}</Typography>
                      <Typography sx={{ color: styles.color || '#000' }}>{step.description}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            {/* Features (контент-блок) */}
            {cv === 'features' && block.content.items && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 3,
                }}
              >
                {(block.content.items || []).map((item: any, index: number) => (
                  <Box key={index} sx={{ textAlign: 'center' }}>
                    {item.icon && (
                      <Typography variant="h2" sx={{ mb: 2 }}>
                        {item.icon}
                      </Typography>
                    )}
                    {(item.title || item.text) && (
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {item.title || item.text}
                      </Typography>
                    )}
                    {item.description && (
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            {/* Таблица */}
            {cv === 'table' && Array.isArray(c.tableRows) && (
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', border: '1px solid', borderColor: 'divider' }}>
                {(c.tableHeaders as string[] | undefined)?.length ? (
                  <Box component="thead">
                    <Box component="tr">
                      {(c.tableHeaders as string[]).map((h: string, i: number) => (
                        <Box component="th" key={i} sx={{ border: '1px solid', borderColor: 'divider', p: 1, textAlign: 'left' }}>
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : null}
                <Box component="tbody">
                  {(c.tableRows as string[][]).map((row: string[], ri: number) => (
                    <Box component="tr" key={ri}>
                      {row.map((cell: string, ci: number) => (
                        <Box component="td" key={ci} sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
                          {cell}
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            {/* Список */}
            {cv === 'list' && Array.isArray(c.listItems) && (
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {(c.listItems as string[]).map((line: string, i: number) => (
                  <Typography key={i} component="li" sx={{ mb: 0.5 }}>
                    {line}
                  </Typography>
                ))}
              </Box>
            )}
            {/* Аккордеон (простая вёрстка) */}
            {cv === 'accordion' && Array.isArray(c.accordionItems) && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {(c.accordionItems as { title?: string; body?: string }[]).map((sec, i: number) => (
                  <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {sec.title ?? ''}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {sec.body ?? ''}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            {/* Цитата */}
            {cv === 'quote' &&
              (String(c.quoteText ?? '') !== '' || String(c.quoteAuthor ?? '') !== '') && (
              <Box
                component="blockquote"
                sx={{
                  m: 0,
                  pl: 2,
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  fontStyle: 'italic',
                }}
              >
                {String(c.quoteText ?? '') !== '' && (
                  <Typography sx={{ mb: 1 }}>{String(c.quoteText)}</Typography>
                )}
                {String(c.quoteAuthor ?? '') !== '' && (
                  <Typography variant="caption" color="text.secondary">
                    — {String(c.quoteAuthor)}
                  </Typography>
                )}
              </Box>
            )}
            {/* Колонки (HTML) */}
            {cv === 'columns' && Array.isArray(c.columnHtml) && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {(c.columnHtml as string[]).map((html: string, i: number) => (
                  <Box
                    key={i}
                    sx={{ flex: '1 1 200px', minWidth: 0 }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ))}
              </Box>
            )}
          </Box>
        );
      }

      case 'image':
        return (
          <Box
            component="img"
            src={resolveImageUrl(block.content.imageUrl || '')}
            alt={block.seo?.alt || block.name || ''}
            /* inline width бьёт глобальный .blog-post-content img { width: 100vw } */
            style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block' }}
            sx={{
              height: 'auto',
              objectFit: 'cover',
            }}
          />
        );

      case 'image-gif': {
        const images = block.content?.images || [];
        const fps = block.content?.gifFps || 5;
        const duration = images.length > 1 ? (images.length / fps) * 1000 : 3000;
        const slidePct = images.length > 0 ? 100 / images.length : 100;
        return (
          <Box className="page-builder-image-gif" sx={{ position: 'relative', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
            {images.length > 0 ? (
              <Box
                className="page-builder-image-gif-viewport"
                sx={{
                  width: '100%',
                  maxWidth: '100%',
                  aspectRatio: PAGE_BUILDER_MEDIA.aspectRatio,
                  minHeight: PAGE_BUILDER_MEDIA.minHeight,
                  maxHeight: PAGE_BUILDER_MEDIA.maxHeight,
                  overflow: 'hidden',
                }}
              >
                <Box
                  className="page-builder-image-gif-track"
                  sx={{
                    display: 'flex',
                    width: `${images.length * 100}%`,
                    height: '100%',
                    animation: images.length > 1 ? `image-gif-slide ${duration}ms steps(${images.length}) infinite` : 'none',
                    '@keyframes image-gif-slide': {
                      '0%': { transform: 'translateX(0)' },
                      '100%': { transform: `translateX(-${((images.length - 1) / images.length) * 100}%)` },
                    },
                  }}
                >
                  {images.map((url, i) => (
                    <Box
                      key={i}
                      component="img"
                      src={resolveImageUrl(url)}
                      alt=""
                      style={{
                        width: `${slidePct}%`,
                        flexShrink: 0,
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ height: 200, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Добавьте изображения для GIF</Typography>
              </Box>
            )}
          </Box>
        );
      }

      case 'image-compare':
        return (
          <ImageCompareBlock block={block} resolveImageUrl={resolveImageUrl} />
        );

      case 'image-wave': {
        const url = block.content?.imageUrl;
        return (
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '100%',
              aspectRatio: PAGE_BUILDER_MEDIA.aspectRatio,
              minHeight: PAGE_BUILDER_MEDIA.minHeight,
              maxHeight: PAGE_BUILDER_MEDIA.maxHeight,
              '& img': {
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'url(#wave-filter)',
                display: 'block',
              },
              '&:hover img': {
                animation: 'wave-pulse 1.5s ease-in-out',
              },
              '@keyframes wave-pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.02)' },
              },
            }}
          >
            {url ? (
              <Box
                component="img"
                src={resolveImageUrl(url)}
                alt=""
                draggable={false}
              />
            ) : (
              <Box sx={{ height: 200, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Добавьте изображение</Typography>
              </Box>
            )}
          </Box>
        );
      }

      case 'text':
        if (!isPreview) {
          return (
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={block.content.text || ''}
              placeholder="Введите текст..."
              onChange={(e) =>
                onUpdateBlock(block.id, { content: { ...block.content, text: e.target.value } })
              }
              sx={{
                ...editorFieldTransparentSx,
                '& .MuiInputBase-input': {
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: styles.color || '#000',
                  WebkitTextFillColor: styles.color || '#000',
                },
              }}
            />
          );
        }
        return (
          <Typography
            component="div"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: `${styles.color || '#000'} !important`,
              WebkitTextFillColor: `${styles.color || '#000'} !important`,
            }}
          >
            {block.content.text || 'Введите текст...'}
          </Typography>
        );

      case 'cta':
        return (
          <Box sx={{ textAlign: 'center', p: 4, color: styles.color || '#000' }}>
            {block.content.title && (
              <Typography variant="h3" sx={{ mb: 2, color: styles.color || '#000' }}>
                {block.content.title}
              </Typography>
            )}
            {block.content.text && (
              <Typography variant="body1" sx={{ mb: 3, color: styles.color || '#000' }}>
                {block.content.text}
              </Typography>
            )}
            {block.content.buttonText && (
              <Button
                variant="contained"
                size="large"
                href={block.content.linkUrl}
                sx={{
                  backgroundColor: styles.backgroundColor || '#1976d2',
                  color: styles.color || '#fff',
                  borderRadius: styles.borderRadius || 4,
                }}
              >
                {block.content.buttonText}
              </Button>
            )}
          </Box>
        );

      case 'features':
        return (
          <Box sx={{ p: 4 }}>
            <Typography variant="h2" sx={{ mb: 4, textAlign: 'center' }}>
              {block.content.title || 'Особенности'}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              {(block.content.items || []).map((item: any, index: number) => (
                <Box key={index} sx={{ textAlign: 'center' }}>
                  {item.icon && (
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      {item.icon}
                    </Typography>
                  )}
                  {item.title && (
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {item.title}
                    </Typography>
                  )}
                  {item.description && (
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 'gallery':
        const rawItems = Array.isArray(block.content.items) && block.content.items.length > 0
          ? block.content.items
          : Array.isArray(block.content.images)
            ? block.content.images
            : [];
        const galleryItems = rawItems
          .map((item: any) =>
            typeof item === 'string'
              ? { imageUrl: item, alt: '' }
              : { imageUrl: item?.imageUrl || '', alt: item?.alt || '' }
          )
          .filter((item: { imageUrl: string }) => item.imageUrl);
        const galleryLayout = String((block.content as { layout?: string }).layout || 'slider');
        const isSlider = galleryLayout === 'slider' || galleryLayout === 'carousel';
        const autoplay = Boolean((block.content as { autoplay?: boolean }).autoplay);
        const speed = Number((block.content as { speed?: number }).speed || 3000);
        const pauseOnHover = Boolean((block.content as { pauseOnHover?: boolean }).pauseOnHover);
        const showArrows = (block.content as { showArrows?: boolean; showNavigation?: boolean }).showArrows
          ?? (block.content as { showNavigation?: boolean }).showNavigation
          ?? true;
        const showDots = (block.content as { showDots?: boolean }).showDots ?? true;
        return (
          <Box sx={{ p: 2 }}>
            {isSlider ? (
              <GallerySlider
                items={galleryItems}
                autoplay={autoplay}
                speed={speed}
                pauseOnHover={pauseOnHover}
                showArrows={showArrows}
                showDots={showDots}
              />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {galleryItems.map((item: any, index: number) => (
                  <Box
                    key={index}
                    component="img"
                    src={resolveImageUrl(item.imageUrl || item)}
                    alt={item.alt || `Image ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        );

      case 'forms':
        return (
          <Box sx={{ width: '100%', maxWidth: '100%', p: 0, color: styles.color || '#000' }}>
            {(block.content.fields || []).map((field: any, index: number) => (
              <TextField
                key={index}
                fullWidth
                label={field.name}
                placeholder={field.placeholder}
                type={field.type}
                required={field.required}
                sx={{ ...editorFieldTransparentSx, mb: 2 }}
              />
            ))}
            <Button variant="contained" fullWidth>
              {block.content.submitButtonText || 'Отправить'}
            </Button>
          </Box>
        );

      default:
        return (
          <Box sx={{ p: 2, textAlign: 'center', color: styles.color || '#000' }}>
            <Typography sx={{ color: styles.color || '#000' }}>Блок: {block.name}</Typography>
            <Typography variant="caption" sx={{ color: styles.color || '#000' }}>
              Тип: {block.type}
            </Typography>
            {block.content.html && (
              <Box 
                dangerouslySetInnerHTML={{ __html: block.content.html }}
                sx={{ color: styles.color || '#000', '& p': { color: styles.color || '#000' } }}
              />
            )}
            {block.content.text && (
              <Typography sx={{ color: styles.color || '#000' }}>{block.content.text}</Typography>
            )}
          </Box>
        );
    }
  };

  const previewAnimSx =
    hasPreviewAnim && anim
      ? {
          '@keyframes pbBlockEnter': {
            from: {
              opacity: 0,
              transform:
                anim.effect === 'slide'
                  ? 'translateY(14px)'
                  : anim.effect === 'zoom'
                    ? 'scale(0.96)'
                    : anim.effect === 'fade'
                      ? 'none'
                      : anim.effect === undefined
                        ? 'translateY(14px)'
                        : 'none',
            },
            to: { opacity: 1, transform: 'translateY(0) scale(1)' },
          },
          animation: `pbBlockEnter ${anim.duration ?? 0.55}s ${anim.easing || 'ease'} forwards`,
          animationDelay: `${anim.delay ?? 0}s`,
        }
      : undefined;

  return (
    <Box style={blockStyle} sx={previewAnimSx}>
      {renderContent()}
      {block.children && block.children.length > 0 && (
        <Box>
          {block.children.map((child) => (
            <BlockRenderer
              key={child.id}
              block={child}
              deviceType={deviceType}
              isPreview={isPreview}
              onUpdateBlock={onUpdateBlock}
              onDeleteBlock={onDeleteBlock}
              onAddBlockToSection={onAddBlockToSection}
              onColumnActivate={onColumnActivate}
              activeColumnTarget={activeColumnTarget}
              onBlockSelect={onBlockSelect}
              selectedBlockId={selectedBlockId}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
