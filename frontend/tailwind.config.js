/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base colors - Warm & Calm palette
        background: '#FBF9F6',
        surface: '#FFFFFF',
        'text-primary': '#2D3748',
        'text-secondary': '#718096',
        
        // Accent colors - Semantic anchors
        'accent-anchor': '#3182CE',      // Trust blue - fixed commitments
        'accent-intention': '#319795',    // Calm teal - flexible intentions
        'accent-ai': '#7C3AED',          // Intuition violet - AI suggestions
        'accent-warning': '#D97706',     // Warm amber - NOT red
        'accent-rest': '#10B981',        // Healing green - recovery time
        
        // Slate palette for depth
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        // Serif for reflective moments (hero cards)
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        // Sans-serif for UI controls
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Monospace for time/numbers
        mono: ['Fira Code', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      spacing: {
        // Generous spacing for calm layout
        'sidebar-left': '20%',
        'sidebar-right': '32%',
        'center': '48%',
      },
      maxWidth: {
        'sidebar-left': '280px',
        'sidebar-right': '400px',
      },
      minWidth: {
        'sidebar-left': '200px',
        'sidebar-right': '320px',
      },
    },
  },
  plugins: [],
}
