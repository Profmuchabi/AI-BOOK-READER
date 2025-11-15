export enum PlaybackState {
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
}

export interface VoiceOption {
  id: string;
  name: string;
}

export interface Book {
  id:string;
  title: string;
  content: string;
  currentParagraphIndex: number;
  lastOpened: number; // Timestamp
}

// FIX: Add missing Chapter interface, which is used by ChapterList.tsx.
export interface Chapter {
  title: string;
  startParagraphIndex: number;
}

export enum Theme {
    LIGHT = 'light',
    DARK = 'dark'
}

export interface Settings {
    theme: Theme;
    voice: string;
    backgroundPlay: boolean;
    fontSize: 'small' | 'medium' | 'large';
}
