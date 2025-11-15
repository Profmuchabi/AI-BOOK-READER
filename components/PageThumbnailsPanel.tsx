import React, { useMemo, useEffect, useRef } from 'react';
import { Settings } from '../types';

interface Page {
  pageNumber: number;
  startParagraphIndex: number;
  paragraphs: string[];
}

interface PageThumbnailsPanelProps {
  paragraphs: string[];
  currentParagraphIndex: number;
  onJumpTo: (index: number) => void;
  fontSize: Settings['fontSize'];
  isOpen: boolean;
}

const CHARS_PER_PAGE: Record<Settings['fontSize'], number> = {
  small: 1800,
  medium: 1500,
  large: 1200,
};

export const PageThumbnailsPanel: React.FC<PageThumbnailsPanelProps> = ({
  paragraphs,
  currentParagraphIndex,
  onJumpTo,
  fontSize,
  isOpen,
}) => {
  const activeThumbnailRef = useRef<HTMLLIElement>(null);

  const pages = useMemo<Page[]>(() => {
    if (paragraphs.length === 0) return [];

    const pagesArray: Page[] = [];
    let currentPage: Page = { pageNumber: 1, startParagraphIndex: 0, paragraphs: [] };
    let currentCharCount = 0;
    const maxChars = CHARS_PER_PAGE[fontSize];

    paragraphs.forEach((p, index) => {
      if (currentCharCount > 0 && currentCharCount + p.length > maxChars) {
        pagesArray.push(currentPage);
        currentPage = { pageNumber: pagesArray.length + 1, startParagraphIndex: index, paragraphs: [] };
        currentCharCount = 0;
      }
      currentPage.paragraphs.push(p);
      currentCharCount += p.length;
    });

    if (currentPage.paragraphs.length > 0) {
      pagesArray.push(currentPage);
    }

    return pagesArray;
  }, [paragraphs, fontSize]);

  const currentPageNumber = useMemo(() => {
    const page = pages.find((p, index) => {
      const nextPageIndex = pages[index + 1]?.startParagraphIndex ?? Infinity;
      return currentParagraphIndex >= p.startParagraphIndex && currentParagraphIndex < nextPageIndex;
    });
    return page?.pageNumber ?? 1;
  }, [pages, currentParagraphIndex]);

  useEffect(() => {
    if (isOpen && activeThumbnailRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isOpen, currentPageNumber]);
  
  const fontSizeClasses = {
    small: 'text-[4px] leading-[5px]',
    medium: 'text-[5px] leading-[6px]',
    large: 'text-[6px] leading-[7px]',
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-48 bg-light-surface dark:bg-dark-bg border-r border-gray-200 dark:border-gray-700 flex-shrink-0 h-full overflow-y-auto p-2 custom-scrollbar transition-all duration-300">
      <h3 className="text-sm font-semibold text-center mb-2 text-light-text-secondary dark:text-dark-text-secondary">Pages</h3>
      <ul className="space-y-3">
        {pages.map((page) => {
          const isCurrent = page.pageNumber === currentPageNumber;
          return (
            <li key={page.pageNumber} ref={isCurrent ? activeThumbnailRef : null}>
              <button
                onClick={() => onJumpTo(page.startParagraphIndex)}
                className={`w-full p-2 rounded-md border-2 transition-colors duration-200 ${
                  isCurrent
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface hover:border-secondary'
                }`}
              >
                <div className={`h-32 overflow-hidden text-left text-gray-700 dark:text-gray-400 ${fontSizeClasses[fontSize]}`}>
                  {page.paragraphs.map((p, i) => (
                    <p key={i} className="mb-1">{p}</p>
                  ))}
                </div>
                <span className="block text-center text-xs mt-1 text-light-text-secondary dark:text-dark-text-secondary font-medium">
                  {page.pageNumber}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <style>{`
          .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #9ca3af;
              border-radius: 3px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #4b5563;
          }
      `}</style>
    </aside>
  );
};
