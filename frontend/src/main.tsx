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

// Global error handler - Log errors but don't prevent them
window.addEventListener('error', (event) => {
  console.error('❌ Global error caught:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  // Don't prevent default to see errors in console
  // event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection caught:', event.reason);
  console.error('Rejection details:', event.reason);
  // Don't prevent default to see errors in console
  // event.preventDefault();
});

console.log('🚀 React app starting...');
createRoot(document.getElementById("root")!).render(<App />);
