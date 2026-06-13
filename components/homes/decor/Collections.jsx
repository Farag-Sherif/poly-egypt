import { collections7 } from "@/data/collections";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "@/i18n/navigation";
import Image from "@/src/compat/AppImage";
import { Navigation } from "swiper/modules";
import { getCategories } from "@/actions/categories";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "@/i18n/provider";

export default function Collections() {
  const t = useTranslations("categories");
  const locale = useLocale();
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  if (isLoading) {
    return (
      <section className="flat-spacing">
        <div className="container">
          <div className="heading-section text-center">
            <h3 className="heading">{t("shop_by_skin_concern")}</h3>
            <p className="subheading text-secondary">
              {t("fresh_styles_subtitle")}
            </p>
          </div>
          <div className="tf-grid-layout tf-col-2 md-col-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="collection-position-2 style-6">
                <div
                  className="img-style animate-pulse bg-gray-200"
                  style={{ height: 615 }}
                ></div>
                <div className="content">
                  <div className="cls-btn">
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flat-spacing">
      <div className="container-full2">
        <div className="heading-section text-center wow fadeInUp">
          <h3 className="heading">
            {locale === "ar" ? "تصفح المجموعات" : "Shop by Collections"}
          </h3>
          <p className="subheading">
            {locale === "ar"
              ? "تصفح أحدث المجموعات والمنتجات"
              : "Browse our Top Trending: the hottest picks loved by all."}
          </p>
        </div>
        <div className="flat-sw-navigation wow fadeInUp" data-wow-delay="0.1s">
          <Swiper
            spaceBetween={15}
            breakpoints={{
              0: { slidesPerView: 1 },
              480: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
            className="swiper tf-sw-collection"
            modules={[Navigation]}
            navigation={{
              prevEl: ".snbp7",
              nextEl: ".snbn7",
            }}
            dir="ltr"
          >
            {categories?.map((collection, index) => (
              <SwiperSlide key={index}>
                <div className="collection-position-2 style-7 hover-img">
                  <Link href={`/collections`} className="img-style">
                    <Image
                      className="lazyload"
                      data-src={collection.logo_path}
                      alt={`banner-cls-${index + 1}`}
                      src={collection.logo_path}
                      width={657}
                      height={875}
                    />
                  </Link>
                  <div className="content text-center">
                    <h4 className="title">
                      <Link href={`/collections`} className="link text-white">
                        {collection.name}
                      </Link>
                    </h4>
                    {/* <span className="text-title text-white">
                      {collection.productCount}
                    </span> */}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="nav-prev-collection d-flex nav-sw style-line nav-sw-left snbp7">
            <i className="icon icon-arrLeft" />
          </div>
          <div className="nav-next-collection d-flex nav-sw style-line nav-sw-right snbn7">
            <i className="icon icon-arrRight" />
          </div>
        </div>
      </div>
    </section>
  );
}
