/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './mcp-app.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Use CSS custom properties for host theme integration
        primary: 'var(--mcp-primary, #3b82f6)',
        'primary-hover': 'var(--mcp-primary-hover, #2563eb)',
        surface: 'var(--mcp-surface, #ffffff)',
        'surface-secondary': 'var(--mcp-surface-secondary, #f3f4f6)',
        text: 'var(--mcp-text-primary, #111827)',
        'text-primary': 'var(--mcp-text-primary, #111827)',
        'text-secondary': 'var(--mcp-text-secondary, #6b7280)',
        border: 'var(--mcp-border, #e5e7eb)',
        'border-focus': 'var(--mcp-border-focus, #3b82f6)',
      },
    },
  },
  plugins: [],
};
