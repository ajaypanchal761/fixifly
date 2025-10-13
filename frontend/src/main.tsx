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

// Register Service Worker for PWA functionality - COMMENTED OUT FOR WEBVIEW TESTING
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }

console.log('🚀 React app starting...');
createRoot(document.getElementById("root")!).render(<App />);
