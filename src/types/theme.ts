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
    id: 'dartmate',
    name: 'Dart Mate',
    colors: {
      primary: '#0B4AA1',
      secondary: '#F2B705',
      accent: '#FFCC00',
      background: '#F5F9FF',
      surface: '#FFFFFF',
      text: '#07162D',
      textSecondary: '#2A3B55',
      success: '#1F8A70',
      warning: '#F2B705',
      error: '#D72638',
      border: '#D6E2F2'
    }
  }
];

export const defaultTheme = themes[0];
