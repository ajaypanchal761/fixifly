import { Phone } from "lucide-react";

const FloatingCallButton = () => {
  const handleCallClick = () => {
    // Desktop browsers will trigger the default calling app or show options
    window.location.href = "tel:02269647030";
  };

  return (
    <button
      type="button"
      onClick={handleCallClick}
      className="flex fixed bottom-16 md:bottom-6 right-4 md:right-6 z-[70] items-center justify-center gap-2 rounded-full bg-blue-600 md:px-4 md:py-3 w-14 h-14 md:w-auto md:h-auto text-white shadow-xl hover:bg-blue-700 transition-colors duration-200"
    >
      <Phone className="w-6 h-6 md:w-5 md:h-5" />
      <span className="hidden md:inline text-sm font-semibold">Call Support</span>
    </button>
  );
};

export default FloatingCallButton;




