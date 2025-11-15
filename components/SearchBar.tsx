import React from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  resultCount: number;
  activeResultIndex: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onNext,
  onPrevious,
  resultCount,
  activeResultIndex,
}) => {
  return (
    <div className="flex flex-col gap-2 p-1">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-light-text-secondary dark:text-dark-text-secondary" />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search text in book..."
                className="w-full bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-secondary dark:placeholder-dark-text-secondary rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />
        </div>
        {searchQuery && (
            <div className="flex items-center justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                <span>
                    {resultCount > 0 
                        ? `${resultCount} match${resultCount > 1 ? 'es' : ''}`
                        : 'No matches found'
                    }
                </span>
                {resultCount > 0 && (
                    <div className="flex items-center gap-1">
                         <span className="w-16 text-center text-xs font-mono">
                            {activeResultIndex > -1 ? `${activeResultIndex + 1} / ${resultCount}` : ''}
                        </span>
                        <button onClick={onPrevious} aria-label="Previous match" className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50" disabled={resultCount < 2}>
                            <ChevronUp className="w-5 h-5" />
                        </button>
                        <button onClick={onNext} aria-label="Next match" className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50" disabled={resultCount < 2}>
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};