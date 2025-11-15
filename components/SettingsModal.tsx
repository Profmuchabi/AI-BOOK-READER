import React from 'react';
import { X, Sun, Moon } from 'lucide-react';
import { Settings, Theme } from '../types';
import { VoiceSelector } from './VoiceSelector';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

const ToggleSwitch: React.FC<{
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ label, enabled, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-light-text-primary dark:text-dark-text-primary">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
      <div className={`block w-14 h-8 rounded-full transition ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
  </label>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleVoiceChange = (voice: string) => {
    onSettingsChange({ ...settings, voice });
  };
  
  const handleThemeChange = (theme: Theme) => {
    onSettingsChange({ ...settings, theme });
  };

  const handleBackgroundPlayChange = (backgroundPlay: boolean) => {
    onSettingsChange({ ...settings, backgroundPlay });
  };

  const handleFontSizeChange = (fontSize: Settings['fontSize']) => {
    onSettingsChange({ ...settings, fontSize });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-light-bg dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md p-6 relative transition-transform transform scale-95 duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: 'scale(1)' }} // Trigger transition on open
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="settings-title" className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Close settings">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Theme Selector */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-light-text-primary dark:text-dark-text-primary">Theme</h3>
            <div className="flex gap-2 p-1 bg-light-surface dark:bg-dark-bg rounded-lg">
              <button 
                onClick={() => handleThemeChange(Theme.LIGHT)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${settings.theme === Theme.LIGHT ? 'bg-primary text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <Sun size={16} /> Light
              </button>
              <button 
                onClick={() => handleThemeChange(Theme.DARK)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${settings.theme === Theme.DARK ? 'bg-primary text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <Moon size={16} /> Dark
              </button>
            </div>
          </div>
          
          {/* Font Size Selector */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-light-text-primary dark:text-dark-text-primary">Font Size</h3>
            <div className="flex gap-2 p-1 bg-light-surface dark:bg-dark-bg rounded-lg">
              <button 
                onClick={() => handleFontSizeChange('small')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${settings.fontSize === 'small' ? 'bg-primary text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                Small
              </button>
              <button 
                onClick={() => handleFontSizeChange('medium')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${settings.fontSize === 'medium' ? 'bg-primary text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                Medium
              </button>
               <button 
                onClick={() => handleFontSizeChange('large')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${settings.fontSize === 'large' ? 'bg-primary text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                Large
              </button>
            </div>
          </div>

          {/* Voice Selector */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-light-text-primary dark:text-dark-text-primary">Narrator Voice</h3>
            <VoiceSelector selectedVoice={settings.voice} onVoiceChange={handleVoiceChange} />
          </div>

          {/* Background Play */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-light-text-primary dark:text-dark-text-primary">Playback</h3>
            <div className="bg-light-surface dark:bg-dark-bg p-4 rounded-lg">
                <ToggleSwitch 
                    label="Background Play" 
                    enabled={settings.backgroundPlay}
                    onChange={handleBackgroundPlayChange}
                />
                 <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
                    Allow audio to continue playing when the app is in the background or the screen is locked.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};