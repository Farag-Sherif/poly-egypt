import { Swiper, SwiperSlide } from "swiper/react";
import Image from "@/src/compat/AppImage";
import Link from "@/i18n/navigation";
import { Pagination } from "swiper/modules";
import { useLocale } from "@/i18n/provider";
import { useQuery } from "@tanstack/react-query";
import { getSlider } from "@/actions/slider";
import "@/styles/hero-slider.css";

export default function Hero() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { data: sliders, isLoading } = useQuery({
    queryKey: ["slider"],
    queryFn: () => getSlider(),
  });

  // Show loading state or fallback
  if (isLoading) {
    return (
      <div className="tf-slideshow slider-default slider-effect-fade">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "796px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Filter only web type sliders and ensure we have data

  return (
    <div className="tf-slideshow slider-default slider-effect-fade">
      <Swiper
        dir={isRtl ? "ltr" : "ltr"}
        centeredSlides={false}
        spaceBetween={0}
        loop={true}
        autoplay={false}
        breakpoints={{
          1024: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 1,
          },
          640: {
            slidesPerView: 1,
          },
          0: {
            slidesPerView: 1,
          },
        }}
        className="swiper tf-sw-slideshow"
        modules={[Pagination]}
        pagination={{
          clickable: true,
          el: ".spd18",
        }}
      >
        {sliders.map((slider, index) => (
          <SwiperSlide key={slider.id}>
            <div className="wrap-slider">
              <Image
                alt={`slider-${slider.id}`}
                src={slider.image_path}
                width={1920}
                height={796}
                className="hero-slider-image"
              />
              <div className="box-content">
                <div className="content-slider">
                  <div className="box-title-slider">
                    <div className="fade-item fade-item-1 heading title-display text-white">
                      {slider.title}
                    </div>
                    <p className="fade-item fade-item-2 body-text-1 text-white">
                      {slider.description}
                    </p>
                  </div>
                  <div className="fade-item fade-item-3 box-btn-slider">
                    <Link
                      href={`/collections`}
                      className="tf-btn btn-fill btn-white"
                    >
                      <span className="text">
                        {isRtl ? " تصفح المجموعات" : "Explore Collections"}
                      </span>
                      <i className="icon icon-arrowUpRight" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="wrap-pagination">
        <div className="container">
          <div className="sw-dots sw-pagination-slider type-circle white-circle-line justify-content-center spd18" />
        </div>
      </div>
    </div>
  );
}
