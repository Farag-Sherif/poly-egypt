import { Swiper, SwiperSlide } from "swiper/react";
import Image from "@/src/compat/AppImage";
import Link from "@/i18n/navigation";
import { Pagination } from "swiper/modules";
import LookbookProduct from "@/components/common/LookbookProduct";
import { useEffect, useState } from "react";
import { getLookbookProducts } from "@/actions/main";
import { useQuery } from "@tanstack/react-query";

export default function LookBook() {
  const [hoveredItem, setHoveredItem] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["lookbookProducts"],
    queryFn: getLookbookProducts,
  });

  console.log("lookbookProducts full response:", data);
  console.log("lookbookProducts error:", error);

  if (isLoading) {
    return (
      <section
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div>Loading...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div>Error loading lookbook: {error.message}</div>
      </section>
    );
  }

  if (!data || (!data.image && !data.data)) {
    console.log("No data available:", data);
    return (
      <section
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div>No lookbook data available</div>
      </section>
    );
  }

  // Enhanced function to determine optimal card position
  const getCardPosition = (x, y) => {
    const cardWidth = 280; // Estimated card width
    const cardHeight = 200; // Estimated card height
    const padding = 20; // Distance from point
    const edgeThreshold = 25; // Percentage threshold for edge detection

    let left = padding;
    let top = -cardHeight / 2;
    let transform = "translateY(-50%)";

    // Determine which edges the point is near
    const nearLeft = x < edgeThreshold;
    const nearRight = x > 100 - edgeThreshold;
    const nearTop = y < edgeThreshold;
    const nearBottom = y > 100 - edgeThreshold;

    // Handle corner cases first (most restrictive)
    if (nearTop && nearLeft) {
      // Top-left corner: show card bottom-right
      left = padding;
      top = padding;
      transform = "none";
    } else if (nearTop && nearRight) {
      // Top-right corner: show card bottom-left
      left = -cardWidth - padding;
      top = padding;
      transform = "none";
    } else if (nearBottom && nearLeft) {
      // Bottom-left corner: show card top-right
      left = padding;
      top = -cardHeight - padding;
      transform = "none";
    } else if (nearBottom && nearRight) {
      // Bottom-right corner: show card top-left
      left = -cardWidth - padding;
      top = -cardHeight - padding;
      transform = "none";
    }
    // Handle edge cases
    else if (nearTop) {
      // Near top edge: show card below
      left = -cardWidth / 2;
      top = padding;
      transform = "none";
    } else if (nearBottom) {
      // Near bottom edge: show card above
      left = -cardWidth / 2;
      top = -cardHeight - padding;
      transform = "none";
    } else if (nearLeft) {
      // Near left edge: show card to the right
      left = padding;
      top = -cardHeight / 2;
      transform = "translateY(-50%)";
    } else if (nearRight) {
      // Near right edge: show card to the left
      left = -cardWidth - padding;
      top = -cardHeight / 2;
      transform = "translateY(-50%)";
    }
    // Center positioning (default)
    else {
      // Prefer showing on the right side for center points
      if (x < 50) {
        // Point is on left half, show card on right
        left = padding;
        top = -cardHeight / 2;
        transform = "translateY(-50%)";
      } else {
        // Point is on right half, show card on left
        left = -cardWidth - padding;
        top = -cardHeight / 2;
        transform = "translateY(-50%)";
      }
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      transform,
      cardWidth: `${cardWidth}px`,
    };
  };

  // Handle both possible data structures
  const lookbookData = data.data || data;
  const imageUrl = lookbookData.image || data.image;
  const points = lookbookData.points || data.points;

  console.log("Final image URL:", imageUrl);
  console.log("Final points:", points);

  return (
    <section>
      <Swiper
        className="flat-sw-pagination swiper tf-sw-lookbook sw-lookbook-wrap"
        dir="ltr"
        spaceBetween={0}
        slidesPerView={1}
        modules={[Pagination]}
        pagination={{
          clickable: true,
          el: ".spd20",
        }}
      >
        <SwiperSlide className="swiper-slide">
          <div className="banner-lookbook position-relative">
            {imageUrl ? (
              <Image
                className="lazyload"
                alt="lookbook banner"
                src={imageUrl}
                width={1920}
                height={600}
                style={{ width: "100%", height: "auto" }}
                onError={(e) => {
                  console.error("Image failed to load:", imageUrl);
                  console.error("Error details:", e);
                }}
                onLoad={() => {
                  console.log("Image loaded successfully:", imageUrl);
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "600px",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p>No image available</p>
              </div>
            )}

            {/* Dynamic positioned points */}
            {points?.map((point) => {
              const cardPosition = getCardPosition(point.x, point.y);

              return (
                <div
                  key={point.id}
                  className="lookbook-item"
                  style={{
                    position: "absolute",
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHoveredItem(point.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="tf-pin-btn">
                    <span />
                  </div>

                  {/* Product card on hover */}
                  {hoveredItem === point.id && (
                    <div
                      className="lookbook-product-card position-absolute"
                      style={{
                        left: cardPosition.left,
                        top: cardPosition.top,
                        transform: cardPosition.transform,
                        zIndex: 1000,
                        backgroundColor: "white",
                        border: "1px solid #e5e5e5",
                        borderRadius: "12px",
                        padding: "16px",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
                        width: cardPosition.cardWidth,
                        opacity: 0,
                        animation: "fadeInScale 0.3s ease forwards",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <LookbookProduct
                        product={{
                          id: point.id,
                          title: point.title,
                          price: point.price,
                          imgSrc:
                            point.item.image_path ||
                            "/images/products/default.jpg", // fallback image
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SwiperSlide>

        <div className="sw-pagination-lookbook sw-dots type-circle white-circle-line justify-content-center spd20" />
      </Swiper>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .lookbook-item {
          transition: all 0.3s ease;
        }

        .lookbook-item:hover .tf-pin-btn {
          transform: scale(1.2);
          transition: transform 0.3s ease;
        }

        .tf-pin-btn {
          position: relative;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .tf-pin-btn::before {
          content: "";
          position: absolute;
          width: 12px;
          height: 12px;
          background: #000;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .tf-pin-btn span {
          position: absolute;
          width: 24px;
          height: 24px;
          border: 2px solid rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          animation: ripple 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .lookbook-product-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, opacity;
        }

        // .lookbook-product-card::before {
        //   content: "";
        //   position: absolute;
        //   top: -8px;
        //   left: 50%;
        //   transform: translateX(-50%);
        //   width: 0;
        //   height: 0;
        //   border-left: 8px solid transparent;
        //   border-right: 8px solid transparent;
        //   border-bottom: 8px solid white;
        //   filter: drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.1));
        // }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .lookbook-product-card {
            width: 240px !important;
            padding: 12px;
            font-size: 14px;
          }

          .tf-pin-btn {
            width: 35px;
            height: 35px;
          }

          .tf-pin-btn::before {
            width: 10px;
            height: 10px;
          }
        }

        @media (max-width: 480px) {
          .lookbook-product-card {
            width: 200px !important;
            padding: 10px;
            font-size: 12px;
          }

          .tf-pin-btn {
            width: 30px;
            height: 30px;
          }

          .tf-pin-btn::before {
            width: 8px;
            height: 8px;
          }
        }
      `}</style>
    </section>
  );
}
