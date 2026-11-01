import { Platform } from 'react-native';

/** Colours taken from the club logo. */
export const colors = {
  background: '#F4E7C9',
  surface: '#FBF5E8',
  border: '#E2CFA8',
  text: '#3E2410',
  textMuted: '#7A5B40',
  primary: '#5D3416',
  primaryText: '#FBF5E8',
  accent: '#BB8348',
  error: '#A23B2A',
  errorSurface: '#F6DDD3',
  success: '#4F7A3A',
};

export const fonts = {
  /** Serif to match the logo's lettering. Used for titles only. */
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 8, md: 12, lg: 20 };
