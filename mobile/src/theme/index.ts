import { StyleSheet } from 'react-native';

// ─── Color Palette ───────────────────────────────────────────
export const Colors = {
  // Backgrounds
  cream: '#F8F7FF',
  white: '#FFFFFF',
  lightBlue: '#F0F6FF',
  lightGreen: '#F0FFF4',
  lightYellow: '#FFFBEB',
  lightRed: '#FFF5F5',
  lightOrange: '#FFF8F0',
  lightPurple: '#F3EEFF',

  // Brand — purple/pink/teal
  purple: '#7C3AED',
  purpleLight: '#EDE9FF',
  purpleMid: '#A855F7',
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  teal: '#14B8A6',
  tealLight: '#CCFBF1',

  // Legacy accents (keep for AR/error screens)
  lavender: '#B8A9E8',
  lavenderLight: '#E8E0FF',
  softBlue: '#A3C4F3',
  softGreen: '#7BC67E',
  softGreenLight: '#D4EDDA',
  softPink: '#F2A7B3',
  softYellow: '#FFE3A3',
  softOrange: '#FFBD85',
  softRed: '#E87C7C',
  softRedLight: '#FDDEDE',
  gold: '#D4A843',

  // Text
  textDark: '#1A1A2E',
  textGray: '#6B6B8A',
  textLight: '#9B9BB8',
  textWhite: '#FFFFFF',

  // Borders / Misc
  borderLight: '#EBEBF5',
  borderBlue: '#A3C4F3',
  shadow: '#00000010',
  dimOverlay: 'rgba(0,0,0,0.4)',
  redOverlay: 'rgba(220,60,60,0.25)',

  // Gradients (for use with LinearGradient)
  gradientPurplePink: ['#7C3AED', '#EC4899'] as [string, string],
  gradientTeal: ['#14B8A6', '#06B6D4'] as [string, string],
  gradientHero: ['#6D28D9', '#7C3AED', '#EC4899'] as [string, string, string],
} as const;

// ─── Typography ──────────────────────────────────────────────
export const Typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textDark,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textDark,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textGray,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textLight,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textWhite,
  },
});

// ─── Spacing ─────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────
export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;
