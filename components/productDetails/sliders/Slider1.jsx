import Drift from "drift-zoom";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import { useEffect, useMemo, useRef, useState } from "react";
import { Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "@/src/compat/AppImage";

export default function Slider1({
  activeColor = "",
  setActiveColor = () => {},
  firstItem,
  productImage,
  media = [],
  colors = [],
}) {
  // Create stable image items from API data
  const items = useMemo(() => {
    const list = [];
    const seenSrcs = new Set();

    const addImg = (src, color = "default", alt = "Product Image") => {
      if (!src || typeof src !== "string" || seenSrcs.has(src)) return;
      seenSrcs.add(src);
      list.push({
        id: list.length + 1,
        src,
        alt,
        width: 713,
        height: 713,
        color,
      });
    };

    // 1. Add main product image
    const mainImg = firstItem || productImage;
    if (mainImg) {
      addImg(mainImg, "default", "Product Image");
    }

    // 2. Add media images
    if (Array.isArray(media) && media.length > 0) {
      media.forEach((mediaItem, index) => {
        const mSrc = mediaItem?.image_path || mediaItem?.image || mediaItem?.src;
        if (mSrc) {
          addImg(mSrc, "default", `Product Image ${index + 2}`);
        }
      });
    }

    // 3. Add color variant images
    if (Array.isArray(colors) && colors.length > 0) {
      colors.forEach((colorItem) => {
        const colorImg =
          colorItem?.image_path || colorItem?.imgSrc || colorItem?.image;
        const colorVal =
          colorItem?.color || colorItem?.value || colorItem?.name || "";

        if (colorImg) {
          const existingItem = list.find((item) => item.src === colorImg);
          if (existingItem) {
            existingItem.color = colorVal;
          } else {
            addImg(colorImg, colorVal, `Color ${colorVal}`);
          }
        }
      });
    }

    if (list.length === 0) {
      list.push({
        id: 1,
        src: "/images/products/default-product.jpg",
        alt: "Default Product Image",
        width: 713,
        height: 713,
        color: "default",
      });
    }

    return list;
  }, [firstItem, productImage, media, colors]);

  useEffect(() => {
    let driftInstances = [];
    const isDesktop =
      typeof window !== "undefined" &&
      window.innerWidth >= 1200 &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!isDesktop) return;

    const imageZoom = () => {
      const driftAll = document.querySelectorAll(".tf-image-zoom");
      const pane = document.querySelector(".tf-zoom-main");
      if (!pane) return;

      driftAll.forEach((el) => {
        try {
          const drift = new Drift(el, {
            zoomFactor: 2,
            paneContainer: pane,
            inlinePane: false,
            handleTouch: false,
            hoverBoundingBox: true,
            containInline: true,
          });
          driftInstances.push(drift);
        } catch (e) {
          // ignore drift init error
        }
      });
    };

    imageZoom();
    const zoomElements = document.querySelectorAll(".tf-image-zoom");

    const handleMouseOver = (event) => {
      const parent = event.target.closest(".section-image-zoom");
      if (parent) {
        parent.classList.add("zoom-active");
      }
    };

    const handleMouseLeave = (event) => {
      const parent = event.target.closest(".section-image-zoom");
      if (parent) {
        parent.classList.remove("zoom-active");
      }
    };

    zoomElements.forEach((element) => {
      element.addEventListener("mouseover", handleMouseOver);
      element.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      zoomElements.forEach((element) => {
        element.removeEventListener("mouseover", handleMouseOver);
        element.removeEventListener("mouseleave", handleMouseLeave);
      });
      driftInstances.forEach((d) => {
        try {
          d.destroy?.();
        } catch (e) {}
      });
    };
  }, [items]);

  const lightboxRef = useRef(null);
  useEffect(() => {
    let lightbox = null;
    try {
      lightbox = new PhotoSwipeLightbox({
        gallery: "#gallery-swiper-started",
        children: ".item",
        pswpModule: () => import("photoswipe"),
      });
      lightbox.init();
      lightboxRef.current = lightbox;
    } catch (e) {
      console.warn("PhotoSwipe init error:", e);
    }

    return () => {
      try {
        lightbox?.destroy();
      } catch (e) {}
    };
  }, []);

  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);

  // Safely slide to matching color when activeColor changes
  useEffect(() => {
    if (!activeColor || !swiperRef.current || swiperRef.current.destroyed) return;

    const slideIndex = items.findIndex(
      (item) => item.color && item.color !== "default" && item.color === activeColor
    );

    if (slideIndex !== -1 && slideIndex !== activeIndex) {
      try {
        swiperRef.current.slideTo(slideIndex);
        setActiveIndex(slideIndex);
      } catch (err) {
        console.warn("Swiper slide error:", err);
      }
    }
  }, [activeColor, items]);

  return (
    <div className={`thumbs-slider ${items.length <= 1 ? "single-image-mode" : ""}`}>
      {items.length > 1 && (
        <Swiper
          className="swiper tf-product-media-thumbs other-image-zoom"
          dir="ltr"
          direction="vertical"
          spaceBetween={10}
          slidesPerView={Math.min(6, items.length)}
          onSwiper={setThumbsSwiper}
          modules={[Thumbs]}
          initialSlide={0}
          breakpoints={{
            0: {
              direction: "horizontal",
              slidesPerView: Math.min(4, items.length),
            },
            820: {
              direction: "horizontal",
              slidesPerView: Math.min(5, items.length),
            },
            920: {
              direction: "horizontal",
              slidesPerView: Math.min(6, items.length),
            },
            1020: {
              direction: "horizontal",
              slidesPerView: Math.min(6, items.length),
            },
            1200: {
              direction: "vertical",
              slidesPerView: Math.min(6, items.length),
            },
          }}
        >
          {items.map((slide, index) => (
            <SwiperSlide
              className="swiper-slide stagger-item"
              data-color={slide.color}
              key={slide.id || index}
            >
              <div className="item">
                <Image
                  className="lazyload"
                  data-src={slide.src}
                  alt={slide.alt}
                  src={slide.src}
                  width={slide.width}
                  height={slide.height}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <Swiper
        dir="ltr"
        className="swiper tf-product-media-main"
        id="gallery-swiper-started"
        spaceBetween={10}
        slidesPerView={1}
        touchReleaseOnEdges={true}
        resistanceRatio={0.85}
        touchAngle={45}
        nested={false}
        touchStartPreventDefault={false}
        thumbs={{
          swiper:
            thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}
        modules={[Thumbs]}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={(swiper) => {
          try {
            const idx = swiper.activeIndex;
            setActiveIndex(idx);
            const slideColor = items[idx]?.color;
            if (
              slideColor &&
              slideColor !== "default" &&
              slideColor !== activeColor &&
              typeof setActiveColor === "function"
            ) {
              setActiveColor(slideColor);
            }
          } catch (err) {
            console.warn("Swiper onSlideChange error:", err);
          }
        }}
      >
        {items.map((slide, index) => (
          <SwiperSlide
            key={slide.id || index}
            className="swiper-slide"
            data-color={slide.color}
          >
            <a
              href={slide.src}
              target="_blank"
              className="item"
              data-pswp-width={slide.width}
              data-pswp-height={slide.height}
            >
              <Image
                className="tf-image-zoom lazyload"
                data-zoom={slide.src}
                data-src={slide.src}
                alt={slide.alt}
                src={slide.src}
                width={slide.width}
                height={slide.height}
                draggable="false"
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}