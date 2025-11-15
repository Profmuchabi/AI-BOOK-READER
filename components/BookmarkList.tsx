import React from 'react';
import { Bookmark, X } from 'lucide-react';

interface BookmarkListProps {
  bookmarks: number[];
  paragraphs: string[];
  onJumpTo: (index: number) => void;
  onRemove: (index: number) => void;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({ bookmarks, paragraphs, onJumpTo, onRemove }) => {
    return (
        <div className="flex flex-col h-full">
            {bookmarks.length > 0 ? (
                <ul className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                    {bookmarks.map(index => (
                        <li key={index} className="group flex items-center justify-between gap-2 bg-light-surface dark:bg-dark-surface p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <button onClick={() => onJumpTo(index)} className="text-left flex-1 text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text-primary dark:group-hover:text-dark-text-primary transition-colors truncate">
                                <span className="text-xs font-mono text-primary/80 dark:text-secondary/80 mr-2">{index + 1}.</span>
                                {paragraphs[index]}
                            </button>
                            <button onClick={() => onRemove(index)} aria-label="Remove bookmark" className="p-1 text-gray-500 hover:text-red-500 transition-colors flex-shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-light-text-secondary dark:text-dark-text-secondary italic p-4">
                    <Bookmark size={32} className="mb-4 text-gray-400" />
                    <p className="font-semibold">No Bookmarks Yet</p>
                    <p className="text-sm">Click the bookmark icon next to any paragraph to save it here.</p>
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