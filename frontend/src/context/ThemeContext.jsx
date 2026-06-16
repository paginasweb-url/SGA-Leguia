import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  getMySettings,
  updateMyPreferences
} from '../services/settings.service';

import { getStoredUser } from '../utils/storage';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'sga_theme_mode';

const isValidTheme = (theme) => {
  return ['light', 'dark', 'system'].includes(theme);
};

const hasActiveSession = () => {
  return Boolean(getStoredUser());
};

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const applyThemeToDocument = (themeMode, { persist = true } = {}) => {
  const mode = isValidTheme(themeMode) ? themeMode : 'system';
  const resolvedTheme = mode === 'system' ? getSystemTheme() : mode;

  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.classList.add(`theme-${resolvedTheme}`);

  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = resolvedTheme;

  if (persist) {
    localStorage.setItem(STORAGE_KEY, mode);
  }

  return resolvedTheme;
};

const clearThemeForPublicPages = () => {
  localStorage.removeItem(STORAGE_KEY);

  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.classList.add('theme-light');

  document.documentElement.dataset.themeMode = 'light';
  document.documentElement.dataset.theme = 'light';

  return 'light';
};

export function ThemeProvider({ children }) {
  const initialHasSession = hasActiveSession();

  const [themeMode, setThemeModeState] = useState(() => {
    if (!initialHasSession) return 'light';

    const savedTheme = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(savedTheme) ? savedTheme : 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (!initialHasSession) return 'light';

    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const initialTheme = isValidTheme(savedTheme) ? savedTheme : 'system';

    return initialTheme === 'system' ? getSystemTheme() : initialTheme;
  });

  const [loadingTheme, setLoadingTheme] = useState(false);

  const applyTheme = (mode, options = {}) => {
    const resolved = applyThemeToDocument(mode, options);

    setThemeModeState(mode);
    setResolvedTheme(resolved);
  };

  const applyPublicLightTheme = () => {
    const resolved = clearThemeForPublicPages();

    setThemeModeState('light');
    setResolvedTheme(resolved);
  };

  const refreshTheme = async () => {
    if (!hasActiveSession()) {
      applyPublicLightTheme();
      return;
    }

    try {
      setLoadingTheme(true);

      const response = await getMySettings();
      const backendTheme = response.data?.preferences?.theme_mode || 'system';

      if (isValidTheme(backendTheme)) {
        applyTheme(backendTheme, { persist: true });
      }
    } catch (error) {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      const fallbackTheme = isValidTheme(savedTheme) ? savedTheme : 'system';

      applyTheme(fallbackTheme, { persist: true });
    } finally {
      setLoadingTheme(false);
    }
  };

  const setThemeMode = async (mode) => {
    if (!isValidTheme(mode)) return;

    if (!hasActiveSession()) {
      applyPublicLightTheme();
      return;
    }

    applyTheme(mode, { persist: true });

    try {
      await updateMyPreferences({
        theme_mode: mode
      });
    } catch (error) {
      console.error('No se pudo guardar el tema:', error);
    }
  };

  useEffect(() => {
    if (!hasActiveSession()) {
      applyPublicLightTheme();
      return;
    }

    applyTheme(themeMode, { persist: true });
    refreshTheme();
  }, []);

  useEffect(() => {
    const handleAuthChanged = () => {
      refreshTheme();
    };

    window.addEventListener('sga-auth-changed', handleAuthChanged);

    return () => {
      window.removeEventListener('sga-auth-changed', handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = () => {
      if (!hasActiveSession()) {
        applyPublicLightTheme();
        return;
      }

      if (themeMode === 'system') {
        const resolved = applyThemeToDocument('system', { persist: true });
        setResolvedTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, [themeMode]);

  const value = useMemo(() => {
    return {
      themeMode,
      resolvedTheme,
      loadingTheme,
      setThemeMode,
      refreshTheme
    };
  }, [themeMode, resolvedTheme, loadingTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }

  return context;
}