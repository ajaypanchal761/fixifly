import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// Initialize AOS - COMMENTED OUT FOR WEBVIEW TESTING
// AOS.init({
//   duration: 800,
//   easing: 'ease-in-out',
//   once: true,
//   offset: 100
// });

// Global error handler to prevent unhandled errors from showing in console
window.addEventListener('error', (event) => {
  console.log('Global error caught:', event.error);
  // Prevent the error from showing in console
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.log('Unhandled promise rejection caught:', event.reason);
  // Prevent the error from showing in console
  event.preventDefault();
});

console.log('🚀 React app starting...');
createRoot(document.getElementById("root")!).render(<App />);
