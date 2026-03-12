import { createContext, useContext, useState, useEffect, type ReactNode, type FC } from 'react';
import { Theme, themes, defaultTheme } from '../types/theme';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

  // Monochrome default: no theme switching/persistence
  useEffect(() => {
    setCurrentTheme(defaultTheme);
  }, []);

  // Apply theme colors to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-border', colors.border);
    // Provide a subtle alpha variant for highlighting current player/panels
    root.style.setProperty('--color-primary-alpha', 'rgba(11, 74, 161, 0.12)');
  }, [currentTheme]);

  const setTheme = (_theme: Theme) => {
    // No-op: theme switching disabled
    setCurrentTheme(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
