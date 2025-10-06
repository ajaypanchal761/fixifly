// Simple register to enable PWA mode
export function register() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/OneSignalSDKWorker.js")
          .then(() => console.log("✅ Service Worker registered"))
          .catch(err => console.error("SW registration failed:", err));
      });
    }
  }
  