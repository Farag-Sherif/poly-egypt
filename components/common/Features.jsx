import React from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useLocale } from "@/i18n/provider";
import { getChoices } from "@/actions/main";
import { useQuery } from "@tanstack/react-query";
import Image from "@/src/compat/AppImage";

// Default fallback icons if API icons are unavailable
const DEFAULT_ICONS = {
  1: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  2: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
      <path d="M21 3v5h-5"></path>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
      <path d="M8 16H3v5"></path>
    </svg>
  ),
  3: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  ),
  4: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="m9 12 2 2 4-4"></path>
    </svg>
  ),
  5: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="m10 15 5-3-5-3v6Z"></path>
    </svg>
  ),
};

export default function Features({ parentClass = "flat-spacing" }) {
  const locale = useLocale();

  const {
    data: choices,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["choices"],
    queryFn: getChoices,
  });

  // Transform API data to component format
  const iconboxItems =
    choices?.map((choice) => {
      const translation =
        choice.translations?.find((t) => t.locale === locale) ||
        choice.translations?.[0];
      return {
        id: choice.id,
        icon: choice.icon_path,
        title: translation?.title || choice.title,
        description: translation?.description || choice.description,
      };
    }) || [];

  if (isLoading) {
    return (
      <section className={parentClass}>
        <div className="container">
          <div className="text-center py-4">
            <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !choices?.length) {
    return null;
  }

  return (
    <section className={parentClass}>
      <div className="container">
        <Swiper
          dir="ltr"
          className="swiper tf-sw-iconbox"
          spaceBetween={15}
          breakpoints={{
            1200: { slidesPerView: 4 },
            768: { slidesPerView: 3 },
            576: { slidesPerView: 2 },
            0: { slidesPerView: 1 },
          }}
          modules={[Pagination]}
          pagination={{
            clickable: true,
            el: ".spd2",
          }}
        >
          {iconboxItems.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="tf-icon-box">
                <div className="icon-box d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                  {item.icon ? (
                    <Image
                      src={item.icon}
                      alt={item.title}
                      className="icon"
                      width={40}
                      height={40}
                      style={{ width: "40px", height: "40px", objectFit: "contain" }}
                    />
                  ) : (
                    DEFAULT_ICONS[item.id] || DEFAULT_ICONS[4]
                  )}
                </div>
                <div className="content text-center">
                  <h6>{item.title}</h6>
                  <p className="text-secondary">{item.description}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
          <div className="sw-pagination-iconbox spd2 sw-dots type-circle justify-content-center" />
        </Swiper>
      </div>
    </section>
  );
}
