import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { saveMobileFCMToken } from "./services/pushNotificationService";
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// Initialize AOS - COMMENTED OUT FOR WEBVIEW TESTING
// AOS.init({
//   duration: 800,
//   easing: 'ease-in-out',
//   once: true,
//   offset: 100
// });

// Global function for Flutter to call and save FCM token
// Flutter can call: window.saveFCMTokenMobile(token, phone)
(window as any).saveFCMTokenMobile = async (token: string, phone: string): Promise<boolean> => {
  console.log('📱 Flutter called saveFCMTokenMobile:', { token: token?.substring(0, 30) + '...', phone });
  try {
    // Clean phone number (remove +91 if present)
    const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '');
    const success = await saveMobileFCMToken(token, cleanPhone);
    if (success) {
      console.log('✅ FCM token saved successfully via Flutter bridge');
    } else {
      console.warn('⚠️ Failed to save FCM token via Flutter bridge');
    }
    return success;
  } catch (error) {
    console.error('❌ Error saving FCM token via Flutter bridge:', error);
    return false;
  }
};

// WebView message listener for Razorpay integration
window.addEventListener("message", function (event) {
  try {
    // Check if message is for starting Razorpay
    if (event.data === "start_razorpay" || (event.data && event.data.type === "start_razorpay")) {
      console.log('📱 Received start_razorpay message from WebView:', event.data);
      
      // Get order data from event detail or data
      const orderData = (event as any).detail || event.data?.orderData || event.data;
      
      if (orderData && orderData.orderId) {
        // Import razorpay service dynamically
        import('./services/razorpayService').then((module) => {
          const razorpayService = module.default;
          razorpayService.openRazorpayCheckout(orderData);
        }).catch((error) => {
          console.error('❌ Error loading razorpay service:', error);
          alert('Failed to load payment gateway. Please refresh the page.');
        });
      } else {
        console.error('❌ Invalid order data received:', orderData);
        alert('Invalid payment data. Please try again.');
      }
    }
  } catch (error) {
    console.error('❌ Error handling WebView message:', error);
  }
});

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
