/**
 * Design Token & Color Palette Configuration
 * 
 * Central color palette configuration for the customer web application.
 * Changing values here updates programmatic references and mirrors src/index.css tokens.
 */

export const COLOR_PALETTE = {
  // New Customer Theme Palette
  primary_scarlet: {
    DEFAULT: '#D8271E',
    hex: '#D8271E',
    hsl: 'hsla(3, 76%, 48%, 1)',
    rgb: 'rgba(216, 39, 30, 1)',
    100: '#650707',
    200: '#7d0c0c',
    300: '#a11410',
    400: '#bd1d16',
    500: '#D8271E',
    600: '#c42018',
    700: '#a71812',
    800: '#89130d',
    900: '#F2C8B8',
  },
  racing_red: {
    DEFAULT: '#F42E2D',
    hex: '#F42E2D',
    hsl: 'hsla(0, 90%, 57%, 1)',
    rgb: 'rgba(244, 46, 45, 1)',
  },
  almond_silk: {
    DEFAULT: '#F2C8B8',
    hex: '#F2C8B8',
    hsl: 'hsla(17, 69%, 84%, 1)',
    rgb: 'rgba(242, 200, 184, 1)',
  },
  light_coral: {
    DEFAULT: '#E98D8D',
    hex: '#E98D8D',
    hsl: 'hsla(0, 68%, 73%, 1)',
    rgb: 'rgba(233, 141, 141, 1)',
  },
  dark_garnet: {
    DEFAULT: '#650707',
    hex: '#650707',
    hsl: 'hsla(0, 87%, 21%, 1)',
    rgb: 'rgba(101, 7, 7, 1)',
  },

  // Customer UI aliases
  burgundy: {
    DEFAULT: '#D8271E',
    100: '#650707',
    200: '#7d0c0c',
    300: '#a11410',
    400: '#bd1d16',
    500: '#D8271E',
    600: '#c42018',
    700: '#a71812',
    800: '#89130d',
    900: '#F2C8B8',
  },
  scarlet_fire: {
    DEFAULT: '#D8271E',
    500: '#D8271E',
    600: '#c42018',
  },
  vibrant_coral: {
    DEFAULT: '#E98D8D',
  },
  sweet_salmon: {
    DEFAULT: '#F2C8B8',
  },
} as const;

export type ColorPalette = typeof COLOR_PALETTE;
export type PaletteColorKey = keyof ColorPalette;

/**
 * Primary CSS variable mappings for quick inline style usage or programmatic styling
 */
export const THEME_CSS_VARS = {
  primaryScarlet: 'var(--primary-scarlet, #D8271E)',
  racingRed: 'var(--racing-red, #F42E2D)',
  almondSilk: 'var(--almond-silk, #F2C8B8)',
  lightCoral: 'var(--light-coral, #E98D8D)',
  darkGarnet: 'var(--dark-garnet, #650707)',
  primary: 'var(--color-customer-primary, #D8271E)',
} as const;
