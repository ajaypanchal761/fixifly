import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import AOS from 'aos';
import 'aos/dist/aos.css';
import OneSignalFallback from "./components/OneSignalFallback";
import "./utils/testOneSignalDomain"; // Auto-test OneSignal domain configuration
import "./utils/testDomainFix"; // Auto-test domain fix

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true,
  offset: 100
});

createRoot(document.getElementById("root")!).render(
  <OneSignalFallback>
    <App />
  </OneSignalFallback>
);
