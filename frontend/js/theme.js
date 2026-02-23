// theme.js
(function () {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  const icon = toggleBtn.querySelector("i");
  const root = document.documentElement;

  const STORAGE_KEY = "theme"; // "light" | "dark"

  /* Detect preferred theme */
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

  /* Apply theme */
  function applyTheme(theme) {
    const isDark = theme === "dark";

    root.setAttribute("data-theme", theme);
    toggleBtn.setAttribute("aria-pressed", String(isDark));

    // Icon swap
    if (icon) {
      icon.classList.toggle("fa-moon", !isDark);
      icon.classList.toggle("fa-sun", isDark);
    }

    localStorage.setItem(STORAGE_KEY, theme);
  }

  /* Init */
  applyTheme(initialTheme);

  /* Toggle handler */
  toggleBtn.addEventListener("click", () => {
    const current =
      root.getAttribute("data-theme") === "dark" ? "dark" : "light";

    applyTheme(current === "dark" ? "light" : "dark");
  });

  /* Sync with OS changes */
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
})();
