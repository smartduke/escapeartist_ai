import type { Config } from 'tailwindcss';
import type { DefaultColors } from 'tailwindcss/types/generated/colors';

const themeDark = (colors: DefaultColors) => ({
  50: '#111827',  // Primary background - Deep blue-gray
  100: '#1e293b', // Secondary - Rich slate
  200: '#334155', // Accent - Medium slate
});

const themeLight = (colors: DefaultColors) => ({
  50: '#ffffff',  // Primary background - White
  100: '#f8fbff', // Secondary - Bright cool white (248, 251, 255)
  200: '#f1f5f9', // Accent - Soft cool gray
});

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderColor: ({ colors }) => {
        return {
          light: themeLight(colors),
          dark: themeDark(colors),
        };
      },
      colors: ({ colors }) => {
        const colorsDark = themeDark(colors);
        const colorsLight = themeLight(colors);

        return {
          dark: {
            primary: colorsDark[50],
            secondary: colorsDark[100],
            ...colorsDark,
          },
          light: {
            primary: colorsLight[50],
            secondary: colorsLight[100],
            ...colorsLight,
          },
        };
      },
      fontFamily: {
        montserrat: ["var(--font-montserrat)"],
        poppins: ["var(--font-poppins)"],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
