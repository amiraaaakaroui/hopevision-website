import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Explicitly include the dashboard component
    './src/components/dashboard/**/*.{js,ts,jsx,tsx}',
  ],
} satisfies Config;

