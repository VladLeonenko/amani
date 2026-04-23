import { useCallback, useMemo } from 'react';
import { PageBuilder } from './PageBuilder';
import { PageBlock, PageSection, PageSettings } from '@/types/pageBuilder';

interface PageBuilderWrapperProps {
  initialBlocks?: PageBlock[];
  initialSections?: PageSection[];
  initialSettings?: Partial<PageSettings>;

  onSave: (data: {
    blocks?: PageBlock[];
    sections?: PageSection[];
    settings?: Partial<PageSettings>;
  }) => void | Promise<void>;

  onPublish?: (data: {
    blocks?: PageBlock[];
    sections?: PageSection[];
    settings?: Partial<PageSettings>;
  }) => void | Promise<void>;

  pageId?: string;
  pageSlug?: string;
}

export function PageBuilderWrapper({
  initialBlocks = [],
  initialSections = [],
  initialSettings = {},
  onSave,
  onPublish,
  pageId,
  pageSlug,
}: PageBuilderWrapperProps) {
  const mergedSettings: PageSettings = useMemo(
    () => ({
      id: pageId || '',
      title: initialSettings.title || '',
      slug: pageSlug || initialSettings.slug || '',
      description: initialSettings.description || '',
      keywords: initialSettings.keywords || '',
      robotsIndex: initialSettings.robotsIndex !== undefined ? initialSettings.robotsIndex : true,
      robotsFollow: initialSettings.robotsFollow !== undefined ? initialSettings.robotsFollow : true,
      ...initialSettings,
    }),
    [pageId, pageSlug, initialSettings]
  );

  const handleSave = useCallback(
    (pageData: any) => {
      onSave({
        blocks: pageData.blocks ?? [],
        sections: pageData.sections ?? [],
        settings: pageData.settings ?? mergedSettings,
      });
    },
    [onSave, mergedSettings]
  );

  const handlePublish = useCallback(
    (pageData: any) => {
      if (onPublish) {
        onPublish({
          blocks: pageData.blocks ?? [],
          sections: pageData.sections ?? [],
          settings: pageData.settings ?? mergedSettings,
        });
      }
    },
    [onPublish, mergedSettings]
  );

  return (
    <PageBuilder
      key={pageId || 'pb-wrap'}
      pageId={pageId}
      initialPage={{
        blocks: initialBlocks,
        sections: initialSections,
        settings: mergedSettings,
        title: mergedSettings.title,
        slug: mergedSettings.slug,
      }}
      onSave={handleSave}
      onPublish={onPublish ? handlePublish : undefined}
    />
  );
}
