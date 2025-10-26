export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const themes: Theme[] = [
  {
    id: 'classic',
    name: 'Classic Gold',
    colors: {
      primary: '#fbbf24', // dart-gold
      secondary: '#f59e0b',
      accent: '#d97706',
      background: '#111827', // dart-dark
      surface: '#1f2937',
      text: '#ffffff',
      textSecondary: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      border: '#4b5563'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#1e40af',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#ffffff',
      textSecondary: '#cbd5e1',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      border: '#475569'
    }
  },
  {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#047857',
      background: '#064e3b',
      surface: '#065f46',
      text: '#ffffff',
      textSecondary: '#d1fae5',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      border: '#047857'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#c2410c',
      background: '#431407',
      surface: '#7c2d12',
      text: '#ffffff',
      textSecondary: '#fed7aa',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      border: '#c2410c'
    }
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    colors: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#6d28d9',
      background: '#2e1065',
      surface: '#4c1d95',
      text: '#ffffff',
      textSecondary: '#e9d5ff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      border: '#6d28d9'
    }
  },
  {
    id: 'crimson',
    name: 'Crimson Red',
    colors: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      accent: '#991b1b',
      background: '#450a0a',
      surface: '#7f1d1d',
      text: '#ffffff',
      textSecondary: '#fecaca',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      border: '#991b1b'
    }
  }
];

export const defaultTheme = themes[0]; // Classic Gold