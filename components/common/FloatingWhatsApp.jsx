import { getPhone } from "@/actions/main";
import { useLocale } from "@/i18n/provider";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function FloatingWhatsApp({
  message = "Hello! I'm interested in your products",
  position = "bottom-right",
}) {
  const locale = useLocale();
  const [hasScrollTopPadding, setHasScrollTopPadding] = useState(false);

  const { data: phones, isLoading: phoneLoading } = useQuery({
    queryKey: ["phones"],
    queryFn: getPhone,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const phoneNumber = phones?.[0]?.mobile;

  // Check if ScrollTop button has type-1 class (padding bottom)
  useEffect(() => {
    const checkScrollTopPadding = () => {
      const scrollTopElement = document.getElementById("scroll-top");
      if (scrollTopElement) {
        setHasScrollTopPadding(scrollTopElement.classList.contains("type-1"));
      }
    };

    // Initial check
    checkScrollTopPadding();

    // Check when DOM changes (in case ScrollTop is added dynamically)
    const observer = new MutationObserver(checkScrollTopPadding);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(
      locale === "ar" ? "مرحبا! أنا مهتم بمنتجاتكم" : message
    );
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(
      /[^0-9]/g,
      ""
    )}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const getPositionClasses = () => {
    const isRTL = locale === "ar";

    switch (position) {
      case "bottom-left":
        return isRTL ? "bottom-0 end-0" : "bottom-0 start-0";
      case "bottom-right":
      default:
        return isRTL ? "bottom-0 start-0" : "bottom-0 end-0";
    }
  };

  const getPositionStyles = () => {
    const isRTL = locale === "ar";
    const baseStyles = {
      zIndex: 1050,
    };

    switch (position) {
      case "bottom-left":
        return {
          ...baseStyles,
          [isRTL ? "marginRight" : "marginLeft"]: "20px",
          // CSS custom properties for responsive bottom margin
          "--desktop-bottom": "20px",
          "--mobile-bottom": "40px", // Increased for mobile
        };
      case "bottom-right":
      default:
        // Position WhatsApp button above scroll-to-top button
        // ScrollTop is at 92px (normal) or 140px (with padding bottom)
        const scrollTopBottom = hasScrollTopPadding ? 140 : 92;
        const buttonHeight = 48;
        const gap = 12; // Reduced gap for better visual balance
        const whatsAppBottom = scrollTopBottom + gap;

        // Increase bottom margin for mobile
        const mobileWhatsAppBottom = hasScrollTopPadding ? 100 : 140; // Increased for mobile

        return {
          ...baseStyles,
          [isRTL ? "marginLeft" : "marginRight"]: "20px", // Align with scroll button
          // Add responsive styles using CSS custom properties
          "--desktop-bottom": `${whatsAppBottom}px`,
          "--mobile-bottom": `${mobileWhatsAppBottom}px`,
        };
    }
  };

  return (
    <div
      className={`position-fixed whatsapp-container ${getPositionClasses()}`}
      style={getPositionStyles()}
    >
      <button
        onClick={handleWhatsAppClick}
        className="btn btn-success rounded-circle d-flex align-items-center justify-content-center shadow-lg whatsapp-button"
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: "var(--whatsapp-cl, #25D366)",
          border: "none",
          transition: "all 0.3s ease",
          transform: "scale(1)",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "scale(1.1)";
          e.target.style.boxShadow = "0 8px 25px rgba(37, 211, 102, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.2)";
        }}
        aria-label={
          locale === "ar" ? "تواصل عبر واتساب" : "Contact via WhatsApp"
        }
        title={locale === "ar" ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
      >
        <i className="icon-whatsapp text-white" style={{ fontSize: "20px" }} />
      </button>

      <style>{`
        .whatsapp-container {
          margin-bottom: var(--desktop-bottom, 20px);
        }

        .whatsapp-button {
          width: 48px !important;
          height: 48px !important;
        }

        @media (max-width: 767px) {
          .whatsapp-container {
            margin-bottom: var(--mobile-bottom, 40px) !important;
          }

          .whatsapp-button {
            width: 40px !important;
            height: 40px !important;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
