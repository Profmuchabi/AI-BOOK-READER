import React, { useEffect, useRef } from 'react';
import { Settings } from '../types';

interface BookViewProps {
  paragraphs: string[];
  currentParagraphIndex: number;
  onParagraphClick: (index: number) => void;
  fontSize: Settings['fontSize'];
}

export const BookView: React.FC<BookViewProps> = ({ paragraphs, currentParagraphIndex, onParagraphClick, fontSize }) => {
  const activeParaRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (activeParaRef.current) {
      activeParaRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentParagraphIndex]);

  const fontSizeClasses = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl',
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8 custom-scrollbar">
      <article className={`prose dark:prose-invert max-w-none leading-relaxed text-light-text-primary dark:text-dark-text-primary ${fontSizeClasses[fontSize]}`}>
        {paragraphs.map((p, index) => {
          const isCurrent = index === currentParagraphIndex;

          let paraClassName = 'cursor-pointer transition-all duration-300 rounded-md p-2';
          
          if (isCurrent) {
            paraClassName += ' bg-primary/20 dark:bg-primary/30 text-light-text-primary dark:text-dark-text-primary font-semibold';
          } else {
            paraClassName += ' text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-surface hover:text-light-text-primary dark:hover:text-dark-text-primary';
          }
          
          return (
             <p
                key={index}
                ref={isCurrent ? activeParaRef : null}
                onClick={() => onParagraphClick(index)}
                className={paraClassName}
              >
                {p}
              </p>
          );
        })}
        {paragraphs.length === 0 && (
            <div className="text-center text-light-text-secondary dark:text-dark-text-secondary italic mt-10">
                <p>Your story awaits.</p>
                <p className="text-sm">Paste some text into the editor on the left to begin.</p>
            </div>
        )}
      </article>
      <style>{`
          .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #4b5563;
              border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #6b7280;
          }
      `}</style>
    </div>
  );
};