import React from 'react';
import { VOICE_OPTIONS } from '../constants';

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceChange }) => {
  return (
    <div className="relative">
      <select
        value={selectedVoice}
        onChange={(e) => onVoiceChange(e.target.value)}
        className="appearance-none bg-light-surface dark:bg-dark-surface border border-gray-300 dark:border-gray-600 text-light-text-primary dark:text-dark-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-3 pr-10 py-2 cursor-pointer"
        aria-label="Select a voice"
      >
        {VOICE_OPTIONS.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-light-text-secondary dark:text-dark-text-secondary">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};