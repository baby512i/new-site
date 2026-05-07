const root = document.documentElement;
const themeButton = document.getElementById("theme-toggle");
const mobileThemeButton = document.getElementById("mobile-theme-toggle");
const darkIcon = document.getElementById("theme-toggle-icon-dark");
const lightIcon = document.getElementById("theme-toggle-icon-light");
const mobileDarkIcon = document.getElementById("mobile-theme-toggle-icon-dark");
const mobileLightIcon = document.getElementById("mobile-theme-toggle-icon-light");

const setThemeIcon = () => {
  const isDark = root.classList.contains("dark");
  darkIcon?.classList.toggle("hidden", !isDark);
  lightIcon?.classList.toggle("hidden", isDark);
  mobileDarkIcon?.classList.toggle("hidden", !isDark);
  mobileLightIcon?.classList.toggle("hidden", isDark);
};

const toggleTheme = () => {
  const isDark = root.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  setThemeIcon();
};

setThemeIcon();
themeButton?.addEventListener("click", toggleTheme);
mobileThemeButton?.addEventListener("click", toggleTheme);
