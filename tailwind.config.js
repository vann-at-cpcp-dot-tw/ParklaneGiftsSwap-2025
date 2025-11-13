/** @type {import('tailwindcss').Config} */

const customColors = [
  'major',
  'minor',
  'success',
  'error',
  'warning',
].reduce((acc, colorKey, inde)=>{
  return {
    ...acc,
    [colorKey]: {
      DEFAULT: `var(--color-${colorKey})`,
      50: `var(--color-${colorKey}-50)`,
      100: `var(--color-${colorKey}-100)`,
      200: `var(--color-${colorKey}-200)`,
      300: `var(--color-${colorKey}-300)`,
      400: `var(--color-${colorKey}-400)`,
      500: `var(--color-${colorKey}-500)`,
      600: `var(--color-${colorKey}-600)`,
      700: `var(--color-${colorKey}-700)`,
      800: `var(--color-${colorKey}-800)`,
      900: `var(--color-${colorKey}-900)`,
    }
  }
}, {})

module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  corePlugins: {
    container: false, // use custom container setting in row-col.sass
    animation: false, // use animate.cc
  },
  theme: {
    container: {
      center: true,
      padding: "2rem",
    },
    screens: {
      "xs": '0px',
      "sm": '576px',
      "md": '768px',
      "lg": '992px',
      "xl": '1200px',
      "2xl": '1400px',
      "3xl": '1600px',
      "4xl": '1920px',
      "_sm": { "max": '575px' },
      "_md": { "max": '767px' },
      "_lg": { "max": '991px' },
      "_xl": { "max": '1199px'},
      "_2xl": { "max": '1399px' },
      "_3xl": { "max": '1599px'},
      "_4xl": { "max": '1919px' },
    },
    extend: {
      height: {
        screen: ['100vh /* fallback for Opera, IE and etc. */', '100dvh'],
      },
      colors: {
        ...customColors,
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontWeight: {
        100: '100',
        200: '200',
        300: '300',
        400: '400',
        500: '500',
        600: '600',
        700: '700',
        800: '800',
        900: '900',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}