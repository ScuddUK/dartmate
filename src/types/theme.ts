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
    id: 'mono',
    name: 'Monochrome',
    colors: {
      // Text emphasis
      primary: '#111111',       // near-black for primary accents
      secondary: '#333333',     // dark gray for hover/secondary accents
      accent: '#000000',        // pure black for strong accents/buttons
      // Surfaces
      background: '#f7f7f7',    // off-white page background
      surface: '#f2f2f2',       // light gray panels/cards
      // Text colors
      text: '#111111',
      textSecondary: '#333333',
      // Status (kept grayscale per request)
      success: '#222222',
      warning: '#2a2a2a',
      error: '#2f2f2f',
      // Borders
      border: '#dddddd'
    }
  }
];

export const defaultTheme = themes[0];