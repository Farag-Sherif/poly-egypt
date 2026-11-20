import React, { useEffect, useMemo, useState } from "react";
import Slider1 from "../sliders/Slider1";
import QuantitySelect from "../QuantitySelect";
import ColorSelect from "../ColorSelect";
import SizeSelect from "../SizeSelect";
import Image from "@/src/compat/AppImage";
import { useContextElement } from "@/context/Context";
import ProductStikyBottom from "../ProductStikyBottom";
import { getTranslation, isRTL } from "@/utils/translations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavorites, updateFavorites } from "@/actions/products";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "@/i18n/navigation";

export default function Details1({ product, locale = "en" }) {
  const [quantity, setQuantity] = useState(1);

  const {
    addProductToCart,
    isAddedToCartProducts,
    cartProducts,
    updateQuantity,
    currency = "EGP",
  } = useContextElement() || {};

  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const router = useRouter();
  const isRtl = isRTL(locale);

  // Parse and normalize available sizes
  const availableSizes = useMemo(() => {
    const raw =
      product?.sizes ||
      product?.product_sizes ||
      product?.variations?.filter?.((v) => v.size) ||
      [];
    if (Array.isArray(raw)) return raw;
    return [];
  }, [product]);

  // Size selection state
  const [activeSize, setActiveSize] = useState(() => {
    if (availableSizes && availableSizes.length > 0) {
      const first = availableSizes[0];
      return typeof first === "object"
        ? first.size || first.value || first.name || ""
        : first;
    }
    return "";
  });

  // Sync active size if sizes change
  useEffect(() => {
    if (availableSizes && availableSizes.length > 0) {
      const currentExists = availableSizes.some((s) => {
        const val = typeof s === "object" ? s.size || s.value || s.name : s;
        return val === activeSize;
      });
      if (!activeSize || !currentExists) {
        const first = availableSizes[0];
        setActiveSize(
          typeof first === "object"
            ? first.size || first.value || first.name || ""
            : first
        );
      }
    }
  }, [availableSizes]);

  // Find the selected size object to extract custom per-size prices
  const selectedSizeObj = useMemo(() => {
    if (!availableSizes || availableSizes.length === 0 || !activeSize) {
      return null;
    }
    return (
      availableSizes.find((s) => {
        const val = typeof s === "object" ? s.size || s.value || s.name : s;
        return val === activeSize;
      }) || availableSizes[0] || null
    );
  }, [availableSizes, activeSize]);

  // Parse and normalize available colors
  const availableColors = useMemo(() => {
    const raw =
      product?.colors ||
      product?.product_colors ||
      product?.variations?.filter?.((v) => v.color) ||
      product?.color ||
      [];
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if (typeof raw === "string" && raw.trim()) return [{ color: raw.trim() }];

    // If product is luminous or has sizes, provide standard luminous lighting color options
    if (
      product?.category?.name?.includes("Luminous") ||
      product?.name?.includes("LED") ||
      product?.name?.includes("Luminous") ||
      (Array.isArray(product?.sizes) && product.sizes.length > 0)
    ) {
      return [
        { id: 1, name: locale === "ar" ? "أبيض دافئ" : "Warm White", color: "#fff3cc" },
        { id: 2, name: locale === "ar" ? "أبيض ناصع" : "Cool White", color: "#ffffff" },
        { id: 3, name: locale === "ar" ? "RGB متعدد الألوان" : "RGB Multi-color", color: "#00ffff" },
        { id: 4, name: locale === "ar" ? "أصفر هادئ" : "Soft Yellow", color: "#ffeb3b" },
      ];
    }
    return [];
  }, [product, locale]);

  // Color selection state
  const [activeColor, setActiveColor] = useState(() => {
    if (availableColors && availableColors.length > 0) {
      const first = availableColors[0];
      return typeof first === "object"
        ? first.color || first.value || first.name || ""
        : first;
    }
    return "";
  });

  // Sync active color if colors change
  useEffect(() => {
    if (availableColors && availableColors.length > 0) {
      const currentExists = availableColors.some((c) => {
        const val = typeof c === "object" ? c.color || c.value || c.name : c;
        return val === activeColor;
      });
      if (!activeColor || !currentExists) {
        const first = availableColors[0];
        setActiveColor(
          typeof first === "object"
            ? first.color || first.value || first.name || ""
            : first
        );
      }
    }
  }, [availableColors]);

  // Find the selected color object to extract custom images if present
  const selectedColorObj = useMemo(() => {
    if (!availableColors || availableColors.length === 0 || !activeColor) {
      return null;
    }
    return (
      availableColors.find((c) => {
        const val = typeof c === "object" ? c.color || c.value || c.name : c;
        return val === activeColor;
      }) || null
    );
  }, [availableColors, activeColor]);

  const currentColorImage =
    selectedColorObj?.image_path ||
    selectedColorObj?.imgSrc ||
    selectedColorObj?.image ||
    null;

  // Currency & Multi-Currency calculation (1 USD ≈ 50 EGP)
  const USD_RATE = 50;

  // Selected size prices override if present
  const sizeEgp = Number(selectedSizeObj?.price) || 0;
  const sizeUsd = Number(selectedSizeObj?.price_usd) || 0;

  const productRawEgp =
    typeof product?.price === "number"
      ? product.price
      : typeof product?.price_egp === "number"
      ? product.price_egp
      : typeof product?.egp_price === "number"
      ? product.egp_price
      : Number(product?.price) || 0;

  const productRawUsd =
    typeof product?.dollar_price === "number"
      ? product.dollar_price
      : typeof product?.price_dollar === "number"
      ? product.price_dollar
      : typeof product?.usd_price === "number"
      ? product.usd_price
      : typeof product?.price_usd === "number"
      ? product.price_usd
      : typeof product?.dollarPrice === "number"
      ? product.dollarPrice
      : Number(
          product?.dollar_price ||
            product?.price_dollar ||
            product?.usd_price ||
            product?.price_usd ||
            product?.dollarPrice
        ) || 0;

  // If a size is selected with its own price, use that size's price!
  const rawEgpPrice = sizeEgp > 0 ? sizeEgp : productRawEgp;
  const rawUsdPrice = sizeUsd > 0 ? sizeUsd : productRawUsd;

  const egpPrice =
    rawEgpPrice > 0
      ? rawEgpPrice
      : rawUsdPrice > 0
      ? rawUsdPrice * USD_RATE
      : 0;

  const usdPrice =
    rawUsdPrice > 0
      ? rawUsdPrice
      : rawEgpPrice > 0
      ? +(rawEgpPrice / USD_RATE).toFixed(2)
      : 0;

  const discount = Number(product?.discount) || 0;
  const egpFinalPrice =
    discount > 0 ? egpPrice * (1 - discount / 100) : egpPrice;
  const usdFinalPrice =
    discount > 0 ? usdPrice * (1 - discount / 100) : usdPrice;

  // Helper to format both prices based on active currency
  const formatDualPrice = (egpVal, usdVal) => {
    const egpStr = `${locale === "ar" ? "ج.م" : "EGP"} ${egpVal.toFixed(2)}`;
    const usdStr = `$${usdVal.toFixed(2)} USD`;

    return (
      <span className="dual-price-display d-inline-flex align-items-baseline gap-2">
        <span className="fw-6 text-primary">{egpStr}</span>{" "}
        <span
          dir="ltr"
          className="text-secondary"
          style={{
            fontSize: "0.85em",
            fontWeight: "normal",
            unicodeBidi: "isolate",
            display: "inline-block",
          }}
        >
          ({usdStr})
        </span>
      </span>
    );
  };

  const isAdded = isAddedToCartProducts?.(product?.id, activeColor, activeSize);
  const cartItem = cartProducts?.find(
    (elm) =>
      elm.id == product?.id &&
      (!activeColor || elm.selectedColor === activeColor) &&
      (!activeSize || elm.selectedSize === activeSize)
  );
  const currentQuantity = isAdded && cartItem ? cartItem.quantity : quantity;

  const { mutate: updateFavorite, isPending: isUpdatingFavorite } = useMutation(
    {
      mutationFn: (productId) => updateFavorites(productId),
      onSuccess: () => {
        queryClient.invalidateQueries(["favorites"]);
      },
    }
  );

  const { data: favorites, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => getFavorites(),
    enabled: !!user,
  });

  // Helper function to check if product is in favorites
  const isProductInFavorites = (productId) => {
    if (!favorites || isLoadingFavorites) return false;
    if (!Array.isArray(favorites)) {
      console.warn("Favorites data is not an array:", favorites);
      return false;
    }
    return favorites.some(
      (fav) =>
        fav.id === productId || fav.productId === productId || fav === productId
    );
  };

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isUpdatingFavorite) {
      updateFavorite(product.id);
    }
  };

  return (
    <section className="flat-spacing" dir={isRtl ? "rtl" : "ltr"}>
      <div className="tf-main-product section-image-zoom">
        <div className="container">
          <div className="row">
            {/* Product default */}
            <div className="col-md-6">
              <div className="tf-product-media-wrap sticky-top">
                <Slider1
                  firstItem={currentColorImage || product.image_path}
                  media={product.media}
                  colors={availableColors}
                  activeColor={activeColor}
                  setActiveColor={setActiveColor}
                />
              </div>
            </div>
            {/* tf-product-info-list */}
            <div className="col-md-6">
              <div className="tf-product-info-wrap position-relative mw-100p-hidden ">
                <div className="tf-zoom-main" />
                <div className="tf-product-info-list other-image-zoom">
                  <div className="tf-product-info-heading">
                    <div className="tf-product-info-name">
                      <div className="text text-btn-uppercase">
                        {product.category?.name ||
                          getTranslation("category", locale)}
                      </div>
                      <h3 className="name">{product.name}</h3>

                      <div className="sub">
                        <div className="tf-product-info-rate">
                          <div className="list-star">
                            <i className="icon icon-star" />
                            <i className="icon icon-star" />
                            <i className="icon icon-star" />
                            <i className="icon icon-star" />
                            <i className="icon icon-star" />
                          </div>
                          <div className="text text-caption-1">
                            (134 {getTranslation("reviews", locale)})
                          </div>
                        </div>
                        <div className="tf-product-info-sold">
                          <i className="icon icon-lightning" />
                          <div className="text text-caption-1">
                            {product.is_available
                              ? getTranslation("available", locale)
                              : getTranslation("outOfStock", locale)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="tf-product-info-desc">
                      <div className="tf-product-info-price">
                        {egpPrice > 0 || usdPrice > 0 ? (
                          discount > 0 ? (
                            <>
                              <h5 className="price-on-sale font-2">
                                {formatDualPrice(egpFinalPrice, usdFinalPrice)}
                              </h5>
                              <div className="compare-at-price font-2">
                                {formatDualPrice(egpPrice, usdPrice)}
                              </div>
                              <div className="badges-on-sale text-btn-uppercase">
                                -{discount}%
                              </div>
                            </>
                          ) : (
                            <h5 className="price-on-sale font-2">
                              {formatDualPrice(egpPrice, usdPrice)}
                            </h5>
                          )
                        ) : (
                          <h5 className="price-on-sale font-2 text-secondary" style={{ fontSize: "1.1rem" }}>
                            {locale === "ar" ? "السعر عند الطلب" : "Price on request"}
                          </h5>
                        )}
                      </div>
                      {product.weight && (
                        <div className="tf-product-info-weight">
                          <p className="text-caption-1">
                            <span className="weight-label">
                              {locale === "ar" ? "الحجم:" : "Size:"}
                            </span>{" "}
                            <span className="weight-value">
                              {product.weight}
                            </span>
                          </p>
                        </div>
                      )}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: product.description,
                        }}
                        className="product-description"
                      />
                    </div>
                  </div>
                  <div className="tf-product-info-choose-option">
                    {/* Size selection */}
                    {availableSizes && availableSizes.length > 0 && (
                      <SizeSelect
                        sizes={availableSizes}
                        activeSize={activeSize}
                        setActiveSize={setActiveSize}
                        locale={locale}
                      />
                    )}

                    {/* Lighting Color selection */}
                    {availableColors && availableColors.length > 0 && (
                      <ColorSelect
                        activeColor={activeColor}
                        setActiveColor={setActiveColor}
                        colors={availableColors}
                        locale={locale}
                      />
                    )}

                    <div className="tf-product-info-quantity">
                      <div className="title mb_12">
                        {getTranslation("quantity", locale)}:
                      </div>
                      <QuantitySelect
                        quantity={currentQuantity}
                        setQuantity={(qty) => {
                          if (isAdded) {
                            updateQuantity(product?.id, qty);
                          } else {
                            setQuantity(qty);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <div className="tf-product-info-by-btn mb_10">
                        <a
                          onClick={() => {
                            // Create a complete product object for the cart with selectedColor, selectedSize, and multi-currency
                            const productForCart = {
                              id: product.id,
                              name: product.name,
                              title: product.name,
                              image_path:
                                currentColorImage || product.image_path,
                              imgSrc: currentColorImage || product.image_path,
                              price: egpFinalPrice,
                              originalPrice: egpPrice,
                              dollarPrice: usdFinalPrice,
                              originalDollarPrice: usdPrice,
                              discount: discount,
                              category: product.category,
                              weight: selectedSizeObj?.size
                                ? `${locale === "ar" ? "المقاس: " : "Size: "}${selectedSizeObj.size}`
                                : product.weight,
                              selectedColor: activeColor,
                              color: activeColor,
                              selectedSize: activeSize,
                              size: activeSize,
                              quantity: quantity,
                              cartId: `${product.id}${
                                activeColor ? `-${activeColor}` : ""
                              }${activeSize ? `-${activeSize}` : ""}`,
                            };

                            addProductToCart(productForCart, quantity, true);
                          }}
                          className="btn-style-2 flex-grow-1 text-btn-uppercase fw-6 btn-add-to-cart"
                        >
                          <span>
                            {isAdded
                              ? getTranslation("alreadyAdded", locale)
                              : getTranslation("addToCart", locale) + " -"}
                          </span>
                          {(egpPrice !== 0 || usdPrice !== 0) && (
                            <span
                              className="tf-qty-price total-price d-inline-flex align-items-center gap-1"
                              style={{ marginInlineStart: "6px" }}
                            >
                              <span>
                                {locale === "ar" ? "ج.م" : "EGP"}{" "}
                                {(egpFinalPrice * currentQuantity).toFixed(2)}
                              </span>{" "}
                              <span
                                dir="ltr"
                                style={{
                                  fontSize: "0.85em",
                                  opacity: 0.9,
                                  unicodeBidi: "isolate",
                                }}
                              >
                                ($
                                {(usdFinalPrice * currentQuantity).toFixed(2)}{" "}
                                USD)
                              </span>
                            </span>
                          )}
                        </a>
                        <a
                          onClick={handleFavoriteToggle}
                          className={`box-icon hover-tooltip text-caption-2 wishlist btn-icon-action ${
                            isUpdatingFavorite ? "loading" : ""
                          }`}
                          style={{
                            pointerEvents: isUpdatingFavorite ? "none" : "auto",
                          }}
                        >
                          <span
                            className={`icon ${
                              isProductInFavorites(product?.id)
                                ? "icon-heart-fill"
                                : "icon-heart"
                            }`}
                          />
                          <span className="tooltip text-caption-2">
                            {isProductInFavorites(product?.id)
                              ? getTranslation("alreadyWishlisted", locale)
                              : getTranslation("wishlist", locale)}
                          </span>
                        </a>
                      </div>
                    </div>
                    <div className="tf-product-info-help">
                      <div className="tf-product-info-extra-link">
                        <a className="tf-product-extra-icon">
                          <div className="icon">
                            <i className="icon-shipping" />
                          </div>
                          <p className="text-caption-1">
                            {getTranslation("deliveryReturn", locale)}
                          </p>
                        </a>
                      </div>
                      <div className="tf-product-info-time">
                        <div className="icon">
                          <i className="icon-timer" />
                        </div>
                        <p className="text-caption-1">
                          {getTranslation("estimatedDelivery", locale)}
                          :&nbsp;&nbsp;
                          <span>
                            {getTranslation("internationalDays", locale)}
                          </span>
                        </p>
                      </div>
                      <div className="tf-product-info-return">
                        <div className="icon">
                          <i className="icon-arrowClockwise" />
                        </div>
                        <p className="text-caption-1">
                          {getTranslation("returnPolicy", locale)}{" "}
                          <span>{getTranslation("returnDays", locale)}</span>{" "}
                          {getTranslation("returnPolicyDesc", locale)}
                        </p>
                      </div>
                    </div>
                    <div className="tf-product-info-guranteed">
                      <div className="text-title">
                        {getTranslation("guaranteedCheckout", locale)}:
                      </div>
                      <div className="tf-payment">
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-1.png"
                            width={100}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-2.png"
                            width={100}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-3.png"
                            width={100}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-4.png"
                            width={98}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-5.png"
                            width={102}
                            height={64}
                          />
                        </a>
                        <a href="#">
                          <Image
                            alt=""
                            src="/images/payment/img-6.png"
                            width={98}
                            height={64}
                          />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /tf-product-info-list */}
          </div>
        </div>
      </div>
      <ProductStikyBottom />
    </section>
  );
}
