import { getBestItems } from "@/actions/products";
import ProductCard1 from "@/components/productCards/ProductCard1";
import { products12 } from "@/data/products";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n/provider";
import { Swiper, SwiperSlide } from "swiper/react";

export default function Products() {
  const locale = useLocale();
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getBestItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform API data to match ProductCard1 expected format
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
    <section className="flat-spacing">
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
          spaceBetween={15}
          dir="ltr"
          className="swiper tf-sw-latest"
          breakpoints={{
            0: { slidesPerView: 2, spaceBetween: 15 },

            768: { slidesPerView: 3, spaceBetween: 30 },
            1200: { slidesPerView: 4, spaceBetween: 30 },
          }}
        >
          {products?.map((product, index) => (
            <SwiperSlide key={index}>
              <ProductCard1 product={transformProduct(product)} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
