import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Initialize theme - Force light theme
const initializeTheme = () => {
  // Force light theme regardless of saved preference
  const theme = "light";

  document.documentElement.classList.remove("dark");
  localStorage.setItem("theme", theme);
};

// Initialize theme before rendering
initializeTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
