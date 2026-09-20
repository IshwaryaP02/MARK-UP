import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import { useApp } from './AppContext';

type Theme = 'Classic' | 'Frosted' | 'Aqua' | 'Blue' | 'Grey' | 'Olive' | 'Sunset' | 'Midnight';

interface CustomizationContextType {
  theme: Theme;
  wallpaperUrl: string | null;
  setTheme: (theme: Theme) => void;
  setWallpaperUrl: (url: string | null) => void;
  savePreferences: (theme: Theme, url: string | null) => Promise<void>;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

const themes = {
  Classic: {
    bg: 'var(--color-bg)',
    surface: 'var(--color-surface)',
    text: 'var(--color-text)',
    primary: 'var(--color-primary)',
    border: 'var(--color-border)',
  },
  Frosted: {
    bg: 'rgba(255, 255, 255, 0.1)',
    surface: 'rgba(255, 255, 255, 0.6)',
    text: '#111827',
    primary: '#3b82f6',
    border: 'rgba(255, 255, 255, 0.3)',
  },
  Midnight: {
    bg: 'rgba(15, 23, 42, 0.9)',
    surface: 'rgba(30, 41, 59, 0.8)',
    text: '#f8fafc',
    primary: '#8b5cf6',
    border: 'rgba(51, 65, 85, 0.5)',
  },
  Aqua: {
    bg: 'rgba(224, 242, 254, 0.9)',
    surface: 'rgba(255, 255, 255, 0.8)',
    text: '#0c4a6e',
    primary: '#0284c7',
    border: 'rgba(186, 230, 253, 0.5)',
  },
  Sunset: {
    bg: 'rgba(254, 240, 138, 0.2)',
    surface: 'rgba(255, 255, 255, 0.8)',
    text: '#7c2d12',
    primary: '#ea580c',
    border: 'rgba(253, 186, 116, 0.5)',
  }
};

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('app_theme') as Theme) || 'Classic';
  });
  const [wallpaperUrl, setWallpaperUrlState] = useState<string | null>(() => {
    const saved = localStorage.getItem('app_wallpaper');
    return saved && saved !== '' ? saved : null;
  });

  // Sync from server user profile when it loads
  useEffect(() => {
    if (currentUser) {
      if ((currentUser as any).theme) setThemeState((currentUser as any).theme as Theme);
      if ((currentUser as any).wallpaper_url) setWallpaperUrlState((currentUser as any).wallpaper_url);
    }
  }, [currentUser]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setWallpaperUrl = (url: string | null) => {
    setWallpaperUrlState(url);
  };

  const savePreferences = async (newTheme: Theme, newUrl: string | null) => {
    setThemeState(newTheme);
    setWallpaperUrlState(newUrl);
    // Persist to backend via /auth/me which works for all roles
    try {
      await apiClient.updateMe({ theme: newTheme, wallpaper_url: newUrl });
    } catch (e) {
      console.error('Could not save preferences to server', e);
    }
    // Always save locally as a fallback
    localStorage.setItem('app_theme', newTheme);
    localStorage.setItem('app_wallpaper', newUrl || '');
  };

  // Apply CSS Variables based on Theme and Wallpaper
  useEffect(() => {
    const root = document.documentElement;
    const selectedTheme = themes[theme as keyof typeof themes] || themes.Classic;
    
    // Set custom CSS properties to root to override default tailwind colors dynamically
    root.style.setProperty('--app-surface', selectedTheme.surface);
    root.style.setProperty('--app-text', selectedTheme.text);
    root.style.setProperty('--app-primary', selectedTheme.primary);
    root.style.setProperty('--app-border', selectedTheme.border);
    
    // Handle Wallpaper
    if (wallpaperUrl) {
      document.body.style.backgroundImage = `url(${wallpaperUrl})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundColor = 'transparent';
    } else {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = selectedTheme.bg;
    }

    if (theme === 'Frosted' || theme === 'Midnight' || theme === 'Aqua' || theme === 'Sunset') {
      root.classList.add('glass-mode');
    } else {
      root.classList.remove('glass-mode');
    }

    // Inject CSS to override hardcoded Tailwind colors and enable the dynamic theme
    let styleEl = document.getElementById('custom-theme-overrides');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'custom-theme-overrides';
      document.head.appendChild(styleEl);
    }

    if (theme === 'Classic' && !wallpaperUrl) {
      styleEl.innerHTML = ''; // Revert to original tailwind
    } else {
      const isGlass = ['Frosted', 'Midnight', 'Aqua', 'Sunset'].includes(theme);
      styleEl.innerHTML = `
        /* Override backgrounds */
        .bg-white, .dark\\:bg-\\[\\#0A0A0A\\], .bg-\\[\\#F7F9FC\\], .dark\\:bg-\\[\\#000000\\], .bg-white\\/50 {
          background-color: ${selectedTheme.surface} !important;
          ${isGlass ? 'backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important;' : ''}
        }
        
        /* Override borders */
        .border-\\[\\#E2E8F0\\], .dark\\:border-zinc-800, .border-gray-200, .border-gray-300, .border-gray-100 {
          border-color: ${selectedTheme.border} !important;
        }
        
        /* Override texts (Primary) */
        .text-\\[\\#0F172A\\], .dark\\:text-zinc-100, .text-gray-900, .text-gray-800 {
          color: ${selectedTheme.text} !important;
        }

        /* Override brand colors (Blue) */
        .bg-\\[\\#2563EB\\], .bg-blue-600, .dark\\:bg-blue-600 {
          background-color: ${selectedTheme.primary} !important;
        }
        .text-\\[\\#2563EB\\], .text-blue-600, .dark\\:text-blue-400, .dark\\:text-\\[\\#3B82F6\\] {
          color: ${selectedTheme.primary} !important;
        }
        .border-\\[\\#2563EB\\], .border-blue-600 {
          border-color: ${selectedTheme.primary} !important;
        }

        /* Sidebar override */
        aside, nav, .bottom-nav {
          background-color: ${selectedTheme.surface} !important;
          border-color: ${selectedTheme.border} !important;
          ${isGlass ? 'backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important;' : ''}
        }
        
        /* Wallpaper Overlay */
        ${wallpaperUrl && theme === 'Classic' ? `
          body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(5px);
            z-index: -1;
          }
          .dark body::before {
            background: rgba(0, 0, 0, 0.6);
          }
        ` : ''}
      `;
    }
  }, [theme, wallpaperUrl]);

  return (
    <CustomizationContext.Provider value={{ theme, wallpaperUrl, setTheme, setWallpaperUrl, savePreferences }}>
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = () => {
  const context = useContext(CustomizationContext);
  if (!context) throw new Error('useCustomization must be used within a CustomizationProvider');
  return context;
};
