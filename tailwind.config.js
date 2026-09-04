/**
 * Production Tailwind build config.
 * Mirrors the theme extension that used to be loaded at runtime via
 * assets/js/tailwind-theme.js against the Play CDN (v3.4.17, forms +
 * container-queries plugins) before the site switched to this compiled
 * build. That file has been removed since this config fully replaces it.
 */
module.exports = {
  darkMode: "class",
  content: ["./*.html"],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        surface: "#ffffff",
        "surface-soft": "#f4f4f4",
        "text-main": "#2d2d2d",
        "text-muted": "#6a6a6a",
        "construction-orange": "#f26522",
        "construction-orange-dark": "#d94f12",
        "asphalt-black": "#1a1a1a",
        "concrete-gray": "#f4f4f4",
        "caution-yellow": "#ffd200",
        outline: "#dddddd",
        "plus-magenta": "#92174d",
        "luxe-purple": "#460479",
        "info-blue": "#428bff"
      },
      spacing: {
        gutter: "24px",
        "stack-sm": "12px",
        "stack-md": "24px",
        "stack-lg": "48px",
        "section-padding": "64px",
        // Bare-number spacing values used in the markup (e.g. h-135) assume
        // Tailwind v4's dynamic spacing scale (n * 0.25rem). The production
        // CDN actually serves v3.4.17, which has no such scale, so those
        // classes silently no-op. Declared explicitly here so the compiled
        // build matches the intended design instead of reproducing the bug.
        135: "33.75rem"
      },
      fontFamily: {
        display: [
          "Inter",
          "Circular",
          "-apple-system",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "sans-serif"
        ],
        body: [
          "Inter",
          "Circular",
          "-apple-system",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "sans-serif"
        ]
      },
      boxShadow: {
        panel:
          "rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0"
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")]
};
