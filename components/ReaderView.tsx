import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookView } from './BookView';
import { Controls } from './Controls';
import { SettingsModal } from './SettingsModal';
import { PageThumbnailsPanel } from './PageThumbnailsPanel';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';
import { getGeneratedArtworkURI } from '../utils/artwork';
import { PlaybackState, Book, Settings } from '../types';
import { Loader, AlertCircle, ArrowLeft, BookText, Edit, Settings as SettingsIcon, CheckCircle, Save, PanelLeft } from 'lucide-react';
import { initDB, storeAudio, getAudio, getCachedParagraphs } from '../services/db';

interface ReaderViewProps {
    book: Book;
    onUpdateBook: (book: Book) => void;
    onBack: () => void;
    settings: Settings;
    onSettingsChange: (settings: Settings) => void;
    onFinishBook: () => void;
    autoPlay: boolean;
    onAutoPlayConsumed: () => void;
}

const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

export const ReaderView: React.FC<ReaderViewProps> = ({ book, onUpdateBook, onBack, settings, onSettingsChange, onFinishBook, autoPlay, onAutoPlayConsumed }) => {
  const [bookText, setBookText] = useState<string>(book.content);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(book.currentParagraphIndex);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.STOPPED);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [cachedIndices, setCachedIndices] = useState(new Set<number>());
  const [isThumbnailSidebarOpen, setIsThumbnailSidebarOpen] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackStateRef = useRef<PlaybackState>(playbackState);
  const generationControllerRef = useRef<AbortController | null>(null);
  const playParagraphRef = useRef<((index: number) => Promise<void>) | null>(null);
  const cachingStatsRef = useRef({ startTime: 0, initialCachedCount: 0 });
  const positionIntervalRef = useRef<number | null>(null);
  const playbackPositionRef = useRef({ duration: 0, startTime: 0, accumulatedElapsedTime: 0 });
  
  // Save progress effect
  useEffect(() => {
    const handler = setTimeout(() => {
        onUpdateBook({ ...book, currentParagraphIndex, content: bookText });
    }, 500);
    return () => clearTimeout(handler);
  }, [currentParagraphIndex, bookText, book, onUpdateBook]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      try {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        setError("Your browser does not support audio playback.");
      }
    }
    return audioContextRef.current;
  }, []);

  useEffect(() => {
    playbackStateRef.current = playbackState;
  }, [playbackState]);

  useEffect(() => {
    const processedParagraphs = bookText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    setParagraphs(processedParagraphs);
  }, [bookText]);

  // DB initialization and initial cache check
  useEffect(() => {
    initDB();
    if (paragraphs.length > 0) {
        getCachedParagraphs(book.id).then(setCachedIndices);
    }
  }, [book.id, paragraphs.length]);
  
  // Background Caching Engine
  useEffect(() => {
    const controller = new AbortController();
    const CONCURRENT_REQUESTS = 8; // Number of parallel caching requests for "super speeds"

    const startCaching = async () => {
        // This check uses the initial `cachedIndices` from the closure, which is what we want.
        if (!paragraphs.length || cachedIndices.size >= paragraphs.length) {
            if (cachingStatsRef.current.startTime !== 0) {
                cachingStatsRef.current = { startTime: 0, initialCachedCount: 0 };
            }
            return;
        }

        if (cachingStatsRef.current.startTime === 0) {
            cachingStatsRef.current = {
                startTime: performance.now(),
                initialCachedCount: cachedIndices.size
            };
        }

        const forwardQueue: number[] = [];
        for (let i = currentParagraphIndex; i < paragraphs.length; i++) {
            forwardQueue.push(i);
        }
        const backwardQueue: number[] = [];
        for (let i = currentParagraphIndex - 1; i >= 0; i--) {
            backwardQueue.push(i);
        }
        
        const queue = [...forwardQueue, ...backwardQueue]
          .filter(index => !cachedIndices.has(index));

        const worker = async () => {
            while (true) {
                if (controller.signal.aborted) return;
                
                const index = queue.shift();
                if (index === undefined) {
                    return; // Queue is empty, worker is done
                }

                try {
                    const textToRead = paragraphs[index];
                    if (textToRead) {
                        const audioDataB64 = await generateSpeech(textToRead, settings.voice, controller.signal);
                        if (controller.signal.aborted) return;

                        const audioDataBytes = decode(audioDataB64);
                        await storeAudio(book.id, index, audioDataBytes);
                        if (controller.signal.aborted) return;

                        setCachedIndices(prev => new Set(prev).add(index));
                    }
                } catch (e: any) {
                    if (e.name !== 'AbortError') {
                        console.error(`Failed to background-cache paragraph ${index}:`, e);
                        setError("Offline caching failed. Check connection.");
                        controller.abort();
                    }
                }
            }
        };

        const workerPromises = Array(CONCURRENT_REQUESTS).fill(0).map(worker);
        await Promise.all(workerPromises);
    };
    
    startCaching();

    return () => controller.abort();
  }, [book.id, paragraphs, settings.voice, currentParagraphIndex]);


  const stopPlayback = useCallback((newState: PlaybackState = PlaybackState.STOPPED) => {
    if (generationControllerRef.current) {
        generationControllerRef.current.abort();
        generationControllerRef.current = null;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
     if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        positionIntervalRef.current = null;
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.setPositionState(null);
      navigator.mediaSession.metadata = null;
    }
    setPlaybackState(newState);
  }, []);
  
  const playParagraph = useCallback(async (index: number) => {
    if (index < 0 || index >= paragraphs.length) {
      stopPlayback(PlaybackState.STOPPED);
      if (index >= paragraphs.length && paragraphs.length > 0) {
        onFinishBook();
      }
      setCurrentParagraphIndex(Math.max(0, Math.min(index, paragraphs.length -1)));
      return;
    }

    stopPlayback(PlaybackState.PLAYING);

    setIsLoading(true);
    setError(null);
    setCurrentParagraphIndex(index);
    
    const controller = new AbortController();
    generationControllerRef.current = controller;

    try {
      const textToRead = paragraphs[index];
      if (!textToRead) {
        if(playbackStateRef.current === PlaybackState.PLAYING) playParagraphRef.current?.(index + 1);
        return;
      }

      let audioDataBytes: Uint8Array | null = await getAudio(book.id, index);

      if (!audioDataBytes) {
        const audioDataB64 = await generateSpeech(textToRead, settings.voice, controller.signal);
        audioDataBytes = decode(audioDataB64);
        await storeAudio(book.id, index, audioDataBytes);
        setCachedIndices(prev => new Set(prev).add(index));
      } else if (!cachedIndices.has(index)) {
        setCachedIndices(prev => new Set(prev).add(index));
      }
      
      if (controller.signal.aborted) return;

      const context = getAudioContext();
      if (!context) return;
      if (context.state === 'suspended') await context.resume();

      const audioBuffer = await decodeAudioData(audioDataBytes, context, 24000, 1);
      
      if (controller.signal.aborted) return;

      if ('mediaSession' in navigator && settings.backgroundPlay) {
          navigator.mediaSession.metadata = new MediaMetadata({
              title: paragraphs[index] || 'Current Paragraph',
              artist: book.title,
              album: 'AI Audiobook Reader',
              artwork: [
                { src: getGeneratedArtworkURI(96), sizes: '96x96', type: 'image/svg+xml' },
                { src: getGeneratedArtworkURI(128), sizes: '128x128', type: 'image/svg+xml' },
                { src: getGeneratedArtworkURI(192), sizes: '192x192', type: 'image/svg+xml' },
                { src: getGeneratedArtworkURI(256), sizes: '256x256', type: 'image/svg+xml' },
                { src: getGeneratedArtworkURI(512), sizes: '512x512', type: 'image/svg+xml' },
              ]
          });
          navigator.mediaSession.playbackState = 'playing';
      }

      playbackPositionRef.current = { duration: audioBuffer.duration, startTime: context.currentTime, accumulatedElapsedTime: 0 };
      if (positionIntervalRef.current) clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = window.setInterval(() => {
          const pos = playbackPositionRef.current;
          const currentContext = getAudioContext();
          if (!currentContext || playbackStateRef.current !== PlaybackState.PLAYING) return;

          const elapsedTime = (currentContext.currentTime - pos.startTime) + pos.accumulatedElapsedTime;
          if ('mediaSession' in navigator && settings.backgroundPlay) {
            navigator.mediaSession.setPositionState({
                duration: pos.duration,
                playbackRate: 1,
                position: Math.min(elapsedTime, pos.duration),
            });
          }
      }, 500);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.onended = () => {
        audioSourceRef.current = null;
        if (positionIntervalRef.current) clearInterval(positionIntervalRef.current);
        if (playbackStateRef.current === PlaybackState.PLAYING) {
          playParagraphRef.current?.(index + 1);
        }
      };
      source.start(0);
      audioSourceRef.current = source;
      setIsLoading(false);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Speech generation was cancelled.");
      } else {
        console.error("Failed to play paragraph:", err);
        setError(err.message || 'An unknown error occurred during playback.');
        setPlaybackState(PlaybackState.STOPPED);
      }
      setIsLoading(false);
    }
  }, [paragraphs, stopPlayback, book.id, book.title, settings.voice, settings.backgroundPlay, getAudioContext, cachedIndices, onFinishBook]);

  useEffect(() => {
    playParagraphRef.current = playParagraph;
  }, [playParagraph]);
  
  const handlePlay = useCallback(() => {
    const indexToPlay = currentParagraphIndex >= paragraphs.length ? 0 : currentParagraphIndex;
    playParagraph(indexToPlay);
  }, [currentParagraphIndex, paragraphs.length, playParagraph]);

  const handlePause = useCallback(() => {
    const context = getAudioContext();
    if (context?.state === 'running') {
      context.suspend();
      const elapsedTime = context.currentTime - playbackPositionRef.current.startTime;
      playbackPositionRef.current.accumulatedElapsedTime += elapsedTime;
    }
    if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        positionIntervalRef.current = null;
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    setPlaybackState(PlaybackState.PAUSED);
  }, [getAudioContext]);

  const handleResume = useCallback(() => {
    const context = getAudioContext();
    if (context?.state === 'suspended') {
      context.resume();
      playbackPositionRef.current.startTime = context.currentTime;
      
      if ('mediaSession' in navigator && settings.backgroundPlay) {
          positionIntervalRef.current = window.setInterval(() => {
              const pos = playbackPositionRef.current;
              const currentContext = getAudioContext();
              if (!currentContext || playbackStateRef.current !== PlaybackState.PLAYING) return;

              const elapsedTime = (currentContext.currentTime - pos.startTime) + pos.accumulatedElapsedTime;
              navigator.mediaSession.setPositionState({
                  duration: pos.duration,
                  playbackRate: 1,
                  position: Math.min(elapsedTime, pos.duration),
              });
          }, 500);
          navigator.mediaSession.playbackState = 'playing';
      }
    }
    setPlaybackState(PlaybackState.PLAYING);
  }, [getAudioContext, settings.backgroundPlay]);
  
  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => {
        handlePlay();
        onAutoPlayConsumed();
      }, 100); 
      return () => clearTimeout(timer);
    }
  }, [autoPlay, handlePlay, onAutoPlayConsumed]);

  // Media Session Action Handlers
  useEffect(() => {
    if (!('mediaSession' in navigator) || !settings.backgroundPlay) {
        return;
    }
    
    const onPlay = playbackState === PlaybackState.PAUSED ? handleResume : handlePlay;

    navigator.mediaSession.setActionHandler('play', onPlay);
    navigator.mediaSession.setActionHandler('pause', handlePause);
    navigator.mediaSession.setActionHandler('stop', () => stopPlayback());
    navigator.mediaSession.setActionHandler('previoustrack', () => playParagraph(currentParagraphIndex - 1));
    navigator.mediaSession.setActionHandler('nexttrack', () => playParagraph(currentParagraphIndex + 1));
    
    return () => {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [handlePlay, handlePause, handleResume, stopPlayback, playParagraph, currentParagraphIndex, playbackState, settings.backgroundPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
        }
    }
  }, []);

  const handleStop = useCallback(() => stopPlayback(PlaybackState.STOPPED), [stopPlayback]);
  const handleNext = useCallback(() => playParagraph(currentParagraphIndex + 1), [currentParagraphIndex, playParagraph]);
  const handlePrevious = useCallback(() => playParagraph(currentParagraphIndex - 1), [currentParagraphIndex, playParagraph]);
  
  const handleParagraphClick = useCallback((index: number) => {
    setCurrentParagraphIndex(index);
    if (playbackState === PlaybackState.PLAYING) {
        playParagraph(index)
    }
  }, [playParagraph, playbackState]);

  const handleSaveEdit = () => {
    setIsEditing(false);
  };
  
  const isBookReady = cachedIndices.size === paragraphs.length && paragraphs.length > 0;
  const progress = paragraphs.length > 0 ? ((currentParagraphIndex + 1) / paragraphs.length) * 100 : 0;
  
  const getCachingStatus = () => {
    if (isBookReady) return { text: 'Ready for offline playback', title: 'Book is fully cached for offline use.'};
    if (paragraphs.length === 0) return { text: 'No content to prepare', title: 'The book has no text content.'};
    
    const cachingProgress = Math.round((cachedIndices.size / paragraphs.length) * 100);
    const paragraphsToCache = paragraphs.length - cachedIndices.size;
    const { startTime, initialCachedCount } = cachingStatsRef.current;

    let etrString = '';
    let text = `Caching... (${cachedIndices.size}/${paragraphs.length})`;
    let title = `Caching offline audio: ${cachedIndices.size} of ${paragraphs.length} paragraphs complete.`;

    if (startTime > 0) {
        const elapsedMs = performance.now() - startTime;
        const newlyCachedCount = cachedIndices.size - initialCachedCount;

        if (newlyCachedCount > 3) {
            const avgTimePerParagraphMs = elapsedMs / newlyCachedCount;
            const etrMs = paragraphsToCache * avgTimePerParagraphMs;
            const etrSeconds = Math.round(etrMs / 1000);

            if (etrSeconds > 60) {
                const minutes = Math.floor(etrSeconds / 60);
                const seconds = etrSeconds % 60;
                etrString = `~${minutes}m ${seconds.toString().padStart(2, '0')}s`;
            } else if (etrSeconds > 1) {
                etrString = `~${etrSeconds}s`;
            } else if (etrMs > 0) {
                etrString = `<1s`;
            }
            
            if (etrString) {
                text = `Caching... ${cachingProgress}% (${etrString} left)`;
                title += ` Estimated time remaining: ${etrString}.`;
            } else {
                text = `Caching... ${cachingProgress}%`;
            }
        }
    } else {
        text = 'Preparing to cache...';
    }

    return { text, title };
  };

  const cachingStatus = getCachingStatus();

  return (
    <div className="flex flex-col h-screen bg-light-bg dark:bg-dark-bg">
      <header className="flex-shrink-0 bg-light-surface dark:bg-dark-surface shadow-sm p-3 flex items-center justify-between z-20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Back to library">
              <ArrowLeft size={24} />
            </button>
            <button 
                onClick={() => setIsThumbnailSidebarOpen(!isThumbnailSidebarOpen)} 
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
                aria-label="Toggle page thumbnails"
            >
                <PanelLeft size={20} />
            </button>
        </div>
        <div className="text-center flex-1 mx-4 min-w-0">
            <h1 className="text-lg font-bold truncate text-light-text-primary dark:text-dark-text-primary">{book.title}</h1>
             <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{currentParagraphIndex + 1} / {paragraphs.length} paragraphs</p>
        </div>
        <div className="flex items-center gap-2">
            {isEditing ? (
                 <button onClick={handleSaveEdit} className="p-2 rounded-full bg-primary text-white hover:bg-secondary transition-colors" aria-label="Save changes">
                    <Save size={20}/>
                </button>
             ) : (
                <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Edit book text">
                    <Edit size={20} />
                </button>
             )}
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Open settings">
                <SettingsIcon size={20} />
            </button>
        </div>
      </header>
       <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
          <div className="bg-primary h-1" style={{ width: `${progress}%` }}></div>
       </div>
      
      <div className="flex flex-1 overflow-hidden">
        <PageThumbnailsPanel 
            isOpen={isThumbnailSidebarOpen}
            paragraphs={paragraphs}
            currentParagraphIndex={currentParagraphIndex}
            onJumpTo={handleParagraphClick}
            fontSize={settings.fontSize}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
            {isEditing ? (
                 <div className="flex-1 flex flex-col p-2">
                    <textarea 
                        value={bookText}
                        onChange={(e) => setBookText(e.target.value)}
                        className="w-full h-full bg-light-surface dark:bg-dark-surface p-4 rounded-md resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                 </div>
            ) : (
                <BookView 
                    paragraphs={paragraphs}
                    currentParagraphIndex={currentParagraphIndex}
                    onParagraphClick={handleParagraphClick}
                    fontSize={settings.fontSize}
                />
            )}
        </main>
      </div>
      
      <footer className="flex-shrink-0 bg-light-surface dark:bg-dark-surface shadow-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm w-full sm:w-64">
            {isBookReady ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : paragraphs.length > 0 ? (
                <Loader className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
            ) : (
                <BookText className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0" />
            )}
            <span className="text-light-text-secondary dark:text-dark-text-secondary truncate" title={cachingStatus.title}>
                {cachingStatus.text}
            </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Controls 
            playbackState={playbackState}
            onPlay={playbackState === PlaybackState.PAUSED ? handleResume : handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        </div>
        <div className="w-full sm:w-64" />
      </footer>

      {error && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-20">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </div>
  );
};