const BannerAd = () => {
  const logos = [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Dell_logo_2016_black.svg/1024px-Dell_logo_2016_black.svg.png",
      alt: "Dell logo"
    },
    {
      src: "https://cdn-icons-png.flaticon.com/512/882/882851.png",
      alt: "HP logo"
    },
    {
      src: "https://i.pinimg.com/736x/0c/25/2c/0c252cff1a5a2ea7ecdac8a0e2d28f04.jpg",
      alt: "acer logo"
    },
    {
      src: "https://www.nicepng.com/png/detail/537-5372655_lenovo-logo-black-transparent-high-resolution-lenovo-logo.png",
      alt: "Lenovo logo"
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      alt: "Apple logo"
    },
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfnB2zILhqYfWnYN2Sd9DtifR5WFw8yNF0AQ&s",
      alt: "Asus logo"
    },
    {
      src: "https://www.citypng.com/public/uploads/preview/black-mi-xiaomi-icon-logo-701751695132559mre9capqh3.png",
      alt: "MI logo"
    },
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRw9wzz7V_uU_HWCcRO3R5VZrTvuWsNtOKIDg&s",
      alt: "Epson logo"
    },
    {
      src: "https://cdn.prod.website-files.com/663c7a1fecb0d1ccf0f0aeef/66d02e5e512b3b91c8e021d4_Logo%3DSamsung.svg",
      alt: "Samsung logo"
    },
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoAOWSNBamK7QVH6F5RBHcISYRHWiC3Xm2Sw&s",
      alt: "Canon logo"
    },
    {
      src: "https://cdn.worldvectorlogo.com/logos/brother-logo.svg",
      alt: "Brother logo"
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Infinix_logo.svg/512px-Infinix_logo.svg.png",
      alt: "Infinix logo"
    }
  ];

  return (
    <section className="py-8 bg-white relative overflow-hidden" data-aos="fade-up" data-aos-delay="100">
      <div className="ticker-scroll-area w-full overflow-hidden">
        <div className="scroll-container items-center animate-ticker-scroll">
          {/* First set of logos */}
          {logos.map((logo, index) => (
            <div key={`first-${index}`} className="logo-wrap flex-shrink-0 flex items-center justify-center px-4 md:px-8">
              <img 
                src={logo.src} 
                alt={logo.alt}
                className="h-6 md:h-8 w-auto opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 max-h-6 md:max-h-8"
                loading="lazy"
              />
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {logos.map((logo, index) => (
            <div key={`second-${index}`} className="logo-wrap flex-shrink-0 flex items-center justify-center px-4 md:px-8">
              <img 
                src={logo.src} 
                alt={logo.alt}
                className="h-6 md:h-8 w-auto opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 max-h-6 md:max-h-8"
                loading="lazy"
              />
            </div>
          ))}
          {/* Third set for extra smoothness */}
          {logos.map((logo, index) => (
            <div key={`third-${index}`} className="logo-wrap flex-shrink-0 flex items-center justify-center px-4 md:px-8">
              <img 
                src={logo.src} 
                alt={logo.alt}
                className="h-6 md:h-8 w-auto opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 max-h-6 md:max-h-8"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BannerAd;
