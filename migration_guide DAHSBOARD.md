# Migration Guide: Patient Dashboard

This guide explains how to transfer the `PatientDashboard` component into your larger project using Cursor.

## 1. Prerequisites

Ensure your target project has the following dependencies installed. Run this command in your target project's terminal:

```bash
npm install lucide-react recharts
```

*Note: `react` and `tailwindcss` are assumed to be already installed.*

## 2. Copy the Component

1.  **Create the file**: In your target project, create a new file, for example: `src/components/dashboard/PatientDashboard.tsx`.
2.  **Copy Content**: Copy the **entire content** of `c:/Users/Lenovo/Downloads/dashboard patient/src/PatientDashboard.tsx` into this new file.

## 3. Tailwind CSS Compatibility

The dashboard uses standard Tailwind CSS utility classes.

*   **If your target project uses Tailwind v3**: It should work out of the box. Ensure your `tailwind.config.js` includes the path to your new component in the `content` array.
*   **If your target project uses Tailwind v4**: Ensure you have the `@import "tailwindcss";` in your main CSS file.

## 4. Integration

Import and use the component in your desired page or layout:

```tsx
import PatientDashboard from './components/dashboard/PatientDashboard';

function App() {
  return (
    <div>
      <PatientDashboard />
    </div>
  );
}
```

## 5. Using Cursor to Help

You can use Cursor's "Composer" (Cmd+I or Ctrl+I) to help with the integration.

**Prompt for Cursor:**
> "I have copied a `PatientDashboard` component into `src/components/dashboard/PatientDashboard.tsx`. Please help me integrate it into my `App.tsx` (or your specific router file). Also, check if I need to install any missing dependencies based on the imports in `PatientDashboard.tsx`."

## 6. Troubleshooting Styles

If the dashboard looks unstyled:
1.  Verify that the file path to `PatientDashboard.tsx` is covered by your `tailwind.config.js` `content` array (for v3).
2.  Ensure you have the correct fonts or reset styles if your project has global overrides.
