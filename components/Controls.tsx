import React from 'react';
import { Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';
import { PlaybackState } from '../types';

interface ControlsProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isLoading: boolean;
}

const ControlButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  ariaLabel: string;
}> = ({ onClick, disabled = false, children, className = '', ariaLabel }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={`p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-dark-surface focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);


export const Controls: React.FC<ControlsProps> = ({ playbackState, onPlay, onPause, onStop, onPrevious, onNext, isLoading }) => {
  const isPlaying = playbackState === PlaybackState.PLAYING;
  
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <ControlButton
        onClick={onPrevious}
        disabled={isLoading}
        className="text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600"
        ariaLabel="Previous Paragraph"
      >
        <SkipBack className="w-7 h-7" />
      </ControlButton>
      
      <ControlButton
        onClick={onStop}
        disabled={isLoading || playbackState === PlaybackState.STOPPED}
        className="text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600"
        ariaLabel="Stop and Reset"
      >
        <Square className="w-7 h-7" />
      </ControlButton>

      <ControlButton
        onClick={isPlaying ? onPause : onPlay}
        disabled={isLoading}
        className="bg-primary text-white p-5 rounded-full shadow-lg hover:bg-secondary transform hover:scale-105"
        ariaLabel={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
            <Pause className="w-8 h-8" fill="currentColor" />
        ) : (
            <Play className="w-8 h-8 ml-1" fill="currentColor" />
        )}
      </ControlButton>

      <ControlButton
        onClick={onNext}
        disabled={isLoading}
        className="text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600"
        ariaLabel="Next Paragraph"
      >
        <SkipForward className="w-7 h-7" />
      </ControlButton>
    </div>
  );
};
