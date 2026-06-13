import { sliderData2 } from "@/data/heroSlides";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "@/src/compat/AppImage";
import Link from "@/i18n/navigation";
import { Pagination } from "swiper/modules";
import { useQuery } from "@tanstack/react-query";
import { getSlider } from "@/actions/slider";
import { useLocale } from "@/i18n/provider";

export default function Hero() {
  const locale = useLocale();
  const isRTL = locale === "ar";

  const { data: sliders, isLoading } = useQuery({
    queryKey: ["slider"],
    queryFn: () => getSlider(),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <section className="tf-slideshow slider-default slider-effect-fade">
      <Swiper
        slidesPerView={1}
        centeredSlides={false}
        spaceBetween={0}
        loop={true}
        autoplay={false}
        dir={isRTL ? "rtl" : "ltr"}
        modules={[Pagination]}
        pagination={{
          clickable: true,
          el: ".spd19",
        }}
        className="swiper tf-sw-slideshow"
      >
        {sliders?.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="wrap-slider">
              <Image
                alt="fashion-slideshow"
                src={slide.image_path}
                width={1920}
                height={803}
                className="hero-slider-image"
              />
              <div className="box-content">
                <div className="content-slider">
                  <div className="box-title-slider">
                    <div className="fade-item fade-item-1 heading title-display text-white">
                      {slide.title}
                    </div>
                    <p className="fade-item fade-item-2 body-text-1 text-white">
                      {slide.description}
                    </p>
                  </div>
                  <div className="fade-item fade-item-3 box-btn-slider">
                    <Link
                      href={`/collections`}
                      className="tf-btn btn-fill btn-white"
                    >
                      <span className="text">
                        {isRTL ? " تصفح المجموعات" : "Explore Collections"}
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
          <div className="sw-dots sw-pagination-slider type-circle white-circle-line justify-content-center spd19" />
        </div>
      </div>
    </section>
  );
}
