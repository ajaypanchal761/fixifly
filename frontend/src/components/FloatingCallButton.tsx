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
      className="hidden md:flex fixed bottom-6 right-6 z-[70] items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-xl hover:bg-blue-700 transition-colors duration-200"
    >
      <Phone className="w-5 h-5" />
      <span className="text-sm font-semibold">Call Support</span>
    </button>
  );
};

export default FloatingCallButton;


