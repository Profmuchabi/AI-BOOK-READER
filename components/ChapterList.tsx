import React from 'react';
import { ListTree, BookMarked } from 'lucide-react';
import { Chapter } from '../types';

interface ChapterListProps {
  chapters: Chapter[];
  currentParagraphIndex: number;
  onJumpTo: (index: number) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({ chapters, currentParagraphIndex, onJumpTo }) => {
    
    const getCurrentChapterIndex = () => {
        let currentChapter = -1;
        for (let i = 0; i < chapters.length; i++) {
            if (chapters[i].startParagraphIndex <= currentParagraphIndex) {
                currentChapter = i;
            } else {
                break;
            }
        }
        return currentChapter;
    };

    const currentChapterIdx = getCurrentChapterIndex();

    return (
        <div className="flex flex-col h-full">
            {chapters.length > 0 ? (
                <ul className="space-y-1 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                    {chapters.map((chapter, index) => {
                        const isCurrent = index === currentChapterIdx;
                        return (
                            <li key={index}>
                                <button 
                                    onClick={() => onJumpTo(chapter.startParagraphIndex)} 
                                    className={`w-full text-left p-2 rounded-md transition-colors text-sm flex items-start gap-3 ${
                                        isCurrent 
                                            ? 'bg-primary/20 dark:bg-primary/30 text-light-text-primary dark:text-dark-text-primary font-semibold' 
                                            : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-surface'
                                    }`}
                                >
                                    <span className={`mt-1 flex-shrink-0 ${isCurrent ? 'text-primary' : ''}`}>
                                        <BookMarked size={14} />
                                    </span>
                                    <span className="flex-1 line-clamp-2">
                                        {chapter.title}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-light-text-secondary dark:text-dark-text-secondary italic p-4">
                    <ListTree size={32} className="mb-4 text-gray-400" />
                    <p className="font-semibold">No Chapters Found</p>
                    <p className="text-sm">Chapters could not be automatically detected for this book.</p>
                </div>
            )}
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
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6b7280;
                }
            `}</style>
        </div>
    );
};
