import { useState, useEffect } from 'react';
import { Settings, Theme } from '../types';
import { SETTINGS_STORAGE_KEY, VOICE_OPTIONS } from '../constants';

const getInitialSettings = (): Settings => {
    const defaultSettings: Settings = {
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT,
        voice: VOICE_OPTIONS[0].id,
        backgroundPlay: true,
        fontSize: 'medium',
    };

    try {
        const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            return { ...defaultSettings, ...parsed }; // Merging handles missing keys
        }
    } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }

    // Default settings
    return defaultSettings;
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(getInitialSettings);

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings to localStorage", e);
        }
    }, [settings]);

    return { settings, setSettings };
};