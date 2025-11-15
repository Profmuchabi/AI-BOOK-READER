import { VoiceOption } from './types';

export const LIBRARY_STORAGE_KEY = 'audiobook_library';
export const SETTINGS_STORAGE_KEY = 'audiobook_settings';

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Zephyr', name: 'Zephyr (Male, Friendly)' },
  { id: 'Puck', name: 'Puck (Male, Calm)' },
  { id: 'Kore', name: 'Kore (Female, Clear)' },
  { id: 'Charon', name: 'Charon (Male, Deep)' },
  { id: 'Fenrir', name: 'Fenrir (Male, Assertive)' },
];

export const WELCOME_BOOK_CONTENT = `Welcome to your AI Audiobook Library.

This application uses advanced text-to-speech technology to read any text you provide in a natural, human-like voice.

To get started, click the "Add Book" button to upload a file from your device. We support .txt, .pdf, .epub, and .docx formats. The reader will automatically remember your position in each book, so you can switch between them and always continue where you left off.

You can change the narrator's voice, switch between light and dark themes, and enable background playback in the settings menu.

Enjoy your listening experience!`;