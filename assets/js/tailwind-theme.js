tailwind.config = {
  darkMode: "class",
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
        "section-padding": "64px"
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
  }
};
