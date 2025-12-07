import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global error handlers to prevent unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  // Prevent the error from appearing in the console as uncaught
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.warn('Global error:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);
