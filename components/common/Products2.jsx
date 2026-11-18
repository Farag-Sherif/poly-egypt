import { getProducts } from "@/actions/products";
import ProductCard1 from "@/components/productCards/ProductCard1";
import { products } from "@/data/products";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n/provider";
import React from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export default function Products2({
  title = "الأكثر مبيعاً",
  parentClass = "",
}) {
  const locale = useLocale();
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(1),
  });

  const transformProduct = (product) => {
    return {
      id: product.id,
      title: product.name,
      imgSrc: product.image_path,
      imgHover:
        product.media && product.media[1]
          ? product.media[1].image_path
          : product.media && product.media[0]
          ? product.media[0].image_path
          : product.image_path,
      price: product.price,
      discount: product.discount,
      isOnSale: product.discount > 0,
      weight: product.weight,
      isAvailable: product.is_available === 1,
    };
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <section className={parentClass}>
      <div className="container">
        <div className="heading-section text-center wow fadeInUp">
          <h3 className="heading">
            {locale === "ar" ? "الأكثر مبيعاً" : "Top Trending"}
          </h3>
          <p className="subheading text-secondary">
            {locale === "ar"
              ? "تصفح أفضل المنتجات الأكثر مبيعاً: الاختيارات الأكثر شعبية بين المستخدمين."
              : "Browse our Top Trending: the hottest picks loved by all."}
          </p>
        </div>
        <Swiper
          className="swiper tf-sw-latest"
          dir="ltr"
          spaceBetween={15}
          breakpoints={{
            0: { slidesPerView: 2, spaceBetween: 15 },

            768: { slidesPerView: 3, spaceBetween: 30 },
            1200: { slidesPerView: 4, spaceBetween: 30 },
          }}
          modules={[Pagination]}
          pagination={{
            clickable: true,
            el: ".spd4",
          }}
        >
          {apiResponse?.map((product, i) => (
            <SwiperSlide key={i} className="swiper-slide">
              <ProductCard1 product={transformProduct(product)} />
            </SwiperSlide>
          ))}

          <div className="sw-pagination-latest spd4  sw-dots type-circle justify-content-center" />
        </Swiper>
      </div>
    </section>
  );
}
