// PWA Service Worker Registration - OneSignal removed
export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      // Register main service worker only
      navigator.serviceWorker.register("/sw.js")
        .then((registration) => {
          console.log("✅ Main Service Worker registered:", registration);
        })
        .catch(err => {
          console.error("❌ Service Worker registration failed:", err);
        });
    });
  } else {
    console.log("❌ Service Worker not supported in this browser");
  }
}
  