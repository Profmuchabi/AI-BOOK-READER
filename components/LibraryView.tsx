import React from 'react';
import { Book, Settings } from '../types';
import { BookPlus, Trash2, BookOpen, Loader, Settings as SettingsIcon, Play } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

interface LibraryViewProps {
  library: Book[];
  onSelectBook: (bookId: string, autoPlay?: boolean) => void;
  onAddBook: (file: File) => void;
  onDeleteBook: (bookId:string) => void;
  isParsing: boolean;
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const BookCard: React.FC<{ book: Book; onSelect: () => void; onDelete: (e: React.MouseEvent) => void; onReadAloud: (e: React.MouseEvent) => void; }> = ({ book, onSelect, onDelete, onReadAloud }) => {
    const paragraphs = React.useMemo(() => book.content.split('\n').filter(p => p.trim().length > 0), [book.content]);
    const totalParagraphs = paragraphs.length;
    
    let progress = 0;
    if (totalParagraphs > 0) {
        progress = Math.min(100, Math.round(((book.currentParagraphIndex + 1) / totalParagraphs) * 100));
    }

    const isFinished = progress >= 100;

    return (
        <div 
            onClick={onSelect}
            className="group relative bg-light-surface dark:bg-dark-surface rounded-xl shadow-md overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 border border-gray-200 dark:border-gray-700 hover:border-primary"
        >
            <div className="p-5 flex flex-col h-full">
                <div className="flex-grow">
                    <div className="flex justify-between items-start mb-3">
                         <div className="p-2 bg-primary/10 rounded-lg">
                            <BookOpen className="w-6 h-6 text-primary" />
                         </div>
                        <button 
                            onClick={onDelete} 
                            aria-label={`Delete ${book.title}`}
                            className="absolute top-3 right-3 text-gray-400 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10 p-1 bg-light-surface dark:bg-dark-surface rounded-full"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mb-2 line-clamp-2 leading-tight">{book.title}</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-3">{paragraphs[0] || "No content."}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex items-center gap-4">
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-semibold ${isFinished ? 'text-green-500' : 'text-primary'}`}>
                                {isFinished ? 'Completed' : `Progress`}
                            </span>
                            <span className="text-xs font-mono text-light-text-secondary dark:text-dark-text-secondary">
                                {progress}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${isFinished ? 'bg-green-500' : 'bg-primary'}`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                    <button 
                        onClick={onReadAloud} 
                        aria-label={`Read ${book.title} aloud`}
                        className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary text-white rounded-full transition-all duration-300 hover:bg-secondary hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-dark-surface shadow-lg"
                    >
                        <Play className="w-6 h-6 ml-1" fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const LibraryView: React.FC<LibraryViewProps> = ({ library, onSelectBook, onAddBook, onDeleteBook, isParsing, settings, setSettings }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

    const handleAddClick = () => {
        if (!isParsing) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onAddBook(file);
        }
        if(event.target) {
            event.target.value = '';
        }
    };
    
    const sortedLibrary = [...library].sort((a, b) => b.lastOpened - a.lastOpened);
    
    const acceptedFileTypes = ".txt,.pdf,.epub,.docx";

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-primary"/>
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary text-center sm:text-left">My Library</h1>
                </div>
                <div className='flex items-center gap-2'>
                     <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-3 rounded-lg transition-colors duration-200 ease-in-out bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary"
                        aria-label="Open settings"
                    >
                        <SettingsIcon className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={handleAddClick} 
                        disabled={isParsing}
                        className="flex items-center justify-center bg-primary hover:bg-secondary text-white font-bold py-3 px-5 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 shadow-md disabled:bg-gray-500 disabled:cursor-wait disabled:scale-100"
                    >
                        {isParsing ? (
                            <>
                                <Loader className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <BookPlus className="mr-2 h-5 w-5" />
                                Add New Book
                            </>
                        )}
                    </button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={acceptedFileTypes}
                    className="hidden"
                    aria-hidden="true"
                    disabled={isParsing}
                />
            </header>
            
            {sortedLibrary.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {sortedLibrary.map(book => (
                        <BookCard
                            key={book.id}
                            book={book}
                            onSelect={() => onSelectBook(book.id, false)}
                            onReadAloud={(e) => { 
                                e.stopPropagation(); 
                                onSelectBook(book.id, true); 
                            }}
                            onDelete={(e) => { 
                                e.stopPropagation(); 
                                onDeleteBook(book.id); 
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 mt-10 text-light-text-secondary dark:text-dark-text-secondary bg-light-surface dark:bg-dark-surface/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Your library is empty.</h2>
                    <p>Click "Add New Book" to upload your first story.</p>
                </div>
            )}
             <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
            />
        </div>
    );
};