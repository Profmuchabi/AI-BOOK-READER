import React, { useState, useEffect, useCallback } from 'react';
import { LibraryView } from './components/LibraryView';
import { ReaderView } from './components/ReaderView';
import { Book } from './types';
import { LIBRARY_STORAGE_KEY, WELCOME_BOOK_CONTENT } from './constants';
import { parseBookFile } from './utils/fileParser';
import { useSettings } from './hooks/useSettings';
import { Loader } from 'lucide-react';
import { clearBookAudio } from './services/db';

const getInitialLibrary = (): Book[] => {
  try {
    const savedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (savedLibrary) {
      return JSON.parse(savedLibrary);
    }
  } catch (e) {
    console.error("Failed to parse library from localStorage", e);
    localStorage.removeItem(LIBRARY_STORAGE_KEY);
  }
  // If no library, create a welcome book
  return [{
    id: 'welcome-book',
    title: 'Welcome to AI Audiobook Reader!',
    content: WELCOME_BOOK_CONTENT,
    currentParagraphIndex: 0,
    lastOpened: Date.now()
  }];
};


const App: React.FC = () => {
  const [library, setLibrary] = useState<Book[]>(getInitialLibrary);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const { settings, setSettings } = useSettings();

  useEffect(() => {
    // Apply theme class to the root element
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    // Simulate initialization
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Save library to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
    } catch (e) {
      console.error("Failed to save library to localStorage", e);
    }
  }, [library]);

  const handleSelectBook = useCallback((bookId: string, autoPlay = false) => {
    setSelectedBookId(bookId);
    setAutoPlayNext(autoPlay);
    // Update lastOpened timestamp
    setLibrary(prevLibrary => 
      prevLibrary.map(book => 
        book.id === bookId ? { ...book, lastOpened: Date.now() } : book
      )
    );
  }, []);

  const handleAddBook = async (file: File) => {
    setIsParsing(true);
    try {
      const { title, content } = await parseBookFile(file);
      if (content) {
        const newBook: Book = {
          id: `${Date.now()}-${file.name}`,
          title,
          content,
          currentParagraphIndex: 0,
          lastOpened: Date.now()
        };
        setLibrary(prevLibrary => [newBook, ...prevLibrary]);
        handleSelectBook(newBook.id);
      } else {
        alert("Could not extract any text from the file.");
      }
    } catch (error: any) {
        console.error("Error adding book:", error);
        alert(`Error adding book: ${error.message}`);
    } finally {
        setIsParsing(false);
    }
  };
  
  const handleUpdateBook = useCallback((updatedBook: Book) => {
    setLibrary(prevLibrary =>
      prevLibrary.map(book => (book.id === updatedBook.id ? updatedBook : book))
    );
  }, []);

  const handleDeleteBook = useCallback((bookId: string) => {
    if (window.confirm("Are you sure you want to delete this book and its cached audio?")) {
        setLibrary(prevLibrary => prevLibrary.filter(book => book.id !== bookId));
        clearBookAudio(bookId);
        if(selectedBookId === bookId){
            setSelectedBookId(null);
        }
    }
  }, [selectedBookId]);

  const handleBackToLibrary = () => {
    setSelectedBookId(null);
  };
  
  const handleFinishBook = useCallback(() => {
    const sortedLibrary = [...library].sort((a, b) => b.lastOpened - a.lastOpened);
    const currentBookIndex = sortedLibrary.findIndex(b => b.id === selectedBookId);

    // Don't loop if there's only one book or the book isn't found
    if (currentBookIndex === -1 || sortedLibrary.length <= 1) {
        return;
    }

    const nextBookIndex = (currentBookIndex + 1) % sortedLibrary.length;
    const nextBook = sortedLibrary[nextBookIndex];
    handleSelectBook(nextBook.id, true);
  }, [library, selectedBookId, handleSelectBook]);

  const handleAutoPlayConsumed = useCallback(() => {
    setAutoPlayNext(false);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <Loader className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const selectedBook = library.find(book => book.id === selectedBookId);

  return (
    <div className="min-h-screen bg-light-bg text-light-text-primary dark:bg-dark-bg dark:text-dark-text-primary font-sans transition-colors duration-300 bg-gray-50 dark:bg-gray-900">
      {selectedBook ? (
        <ReaderView 
            key={selectedBook.id}
            book={selectedBook}
            onUpdateBook={handleUpdateBook}
            onBack={handleBackToLibrary}
            settings={settings}
            onSettingsChange={setSettings}
            onFinishBook={handleFinishBook}
            autoPlay={autoPlayNext}
            onAutoPlayConsumed={handleAutoPlayConsumed}
        />
      ) : (
        <LibraryView 
            library={library}
            onSelectBook={handleSelectBook}
            onAddBook={handleAddBook}
            onDeleteBook={handleDeleteBook}
            isParsing={isParsing}
            setSettings={setSettings}
            settings={settings}
        />
      )}
    </div>
  );
};

export default App;