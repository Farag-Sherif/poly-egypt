import React, { useMemo, useCallback } from "react";
import Image from "@/src/compat/AppImage";
import Link from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import CountdownTimer from "../common/Countdown";
import { useContextElement } from "@/context/Context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavorites, updateFavorites } from "@/actions/products";
import { useUserStore } from "@/store/userStore";
import { useLocale } from "@/i18n/provider";

function ProductCard1({
  product: productData,
  gridClass = "",
  parentClass = "card-product wow fadeInUp",
  isNotImageRatio = false,
  radiusClass = "",
}) {
  const locale = useLocale();
  const product = productData || {};
  const currentImage = product.imgSrc;

  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const router = useRouter();

  const { mutate: updateFavorite, isPending: isUpdatingFavorite } = useMutation(
    {
      mutationFn: (productId) => updateFavorites(productId),
      onSuccess: (response) => {
        // Check if the response indicates success
        if (response?.status === "success" || response?.message === "success") {
          // Optionally refetch favorites after successful update
          queryClient.invalidateQueries(["favorites"]);
        } else {
          console.error("Favorite update failed:", response);
          alert(
            locale === "ar"
              ? "فشل في تحديث المفضلة"
              : "Failed to update favorites"
          );
        }
      },
      onError: (error) => {
        console.error("Error updating favorites:", error);
        alert(
          locale === "ar"
            ? "حدث خطأ أثناء تحديث المفضلة"
            : "Error updating favorites"
        );
      },
    }
  );

  const { data: favorites, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => getFavorites(),
    enabled: !!user, // Only fetch favorites when user is logged in
    onError: (error) => {
      console.error("Error fetching favorites:", error);
    },
  });

  const { setQuickAddItem, addProductToCart, isAddedToCartProducts } =
    useContextElement();

  const USD_RATE = 50;

  // Helper function to calculate prices with discount, sizes, and multi-currency
  const calculatePrices = (product) => {
    // Check if product has sizes with prices
    const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
    let startingEgpPrice = null;
    let startingUsdPrice = null;
    let hasSizePrices = false;

    if (sizes.length > 0) {
      const validSizePrices = sizes
        .map((s) => ({
          egp: Number(s.price) || 0,
          usd: Number(s.price_usd) || 0,
        }))
        .filter((p) => p.egp > 0 || p.usd > 0);

      if (validSizePrices.length > 0) {
        hasSizePrices = true;
        validSizePrices.sort((a, b) => {
          const aPrice = a.egp > 0 ? a.egp : a.usd * USD_RATE;
          const bPrice = b.egp > 0 ? b.egp : b.usd * USD_RATE;
          return aPrice - bPrice;
        });
        const minSize = validSizePrices[0];
        startingEgpPrice = minSize.egp > 0 ? minSize.egp : minSize.usd * USD_RATE;
        startingUsdPrice = minSize.usd > 0 ? minSize.usd : +(minSize.egp / USD_RATE).toFixed(2);
      }
    }

    const rawEgp = Number(product?.price) || 0;
    const rawUsd = Number(product?.price_usd) || 0;

    const baseEgp = startingEgpPrice !== null ? startingEgpPrice : (rawEgp > 0 ? rawEgp : (rawUsd > 0 ? rawUsd * USD_RATE : 0));
    const baseUsd = startingUsdPrice !== null ? startingUsdPrice : (rawUsd > 0 ? rawUsd : (rawEgp > 0 ? +(rawEgp / USD_RATE).toFixed(2) : 0));

    const discountPercent = Number(product?.discount) || 0;
    const hasDiscount = discountPercent > 0;
    const currentEgp = hasDiscount ? baseEgp * (1 - discountPercent / 100) : baseEgp;
    const currentUsd = hasDiscount ? baseUsd * (1 - discountPercent / 100) : baseUsd;
    const originalEgp = hasDiscount ? baseEgp : null;
    const originalUsd = hasDiscount ? baseUsd : null;

    return {
      currentEgp,
      currentUsd,
      originalEgp,
      originalUsd,
      hasDiscount,
      hasSizePrices,
      hasAnyPrice: baseEgp > 0 || baseUsd > 0,
    };
  };

  // Get calculated prices memoized
  const {
    currentEgp,
    currentUsd,
    originalEgp,
    originalUsd,
    hasDiscount,
    hasSizePrices,
    hasAnyPrice,
  } = useMemo(
    () => calculatePrices(product),
    [product?.price, product?.price_usd, product?.discount, product?.sizes]
  );

  const productDetailUrl = useMemo(
    () =>
      product?.title
        ? `/product-detail/${product.id}-${encodeURIComponent(product.title)}`
        : `/product-detail/${product?.id || ""}`,
    [product?.id, product?.title]
  );

  // Helper function to check if product is in favorites
  const isProductInFavorites = useCallback(
    (productId) => {
      if (!favorites || isLoadingFavorites) return false;

      // Check if favorites is an array
      if (!Array.isArray(favorites)) {
        console.warn("Favorites data is not an array:", favorites);
        return false;
      }

      const isInFavorites = favorites.some(
        (fav) =>
          fav.id === productId || fav.productId === productId || fav === productId
      );

      return isInFavorites;
    },
    [favorites, isLoadingFavorites]
  );

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(() => {
    // Check if user is authenticated
    if (!user) {
      alert(locale === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please login first");
      router.push("/login");
      return;
    }

    if (!isUpdatingFavorite && product?.id) {
      updateFavorite(product.id);
    }
  }, [user, locale, router, isUpdatingFavorite, product?.id, updateFavorite]);

  // Handle quick add to cart
  const handleQuickAddToCart = useCallback(() => {
    // Create a complete product object for the cart
    const productForCart = {
      id: product.id,
      title: product.title,
      name: product.title,
      imgSrc: currentImage,
      image_path: currentImage,
      price: currentEgp,
      originalPrice: originalEgp || currentEgp,
      dollarPrice: currentUsd,
      originalDollarPrice: originalUsd || currentUsd,
      weight: product.weight,
      selectedSize: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0]?.size : null,
      size: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0]?.size : null,
      selectedColor: Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0]?.color : null,
      color: Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0]?.color : null,
      sizes: product.sizes,
      colors: product.colors,
      cartId: `${product.id}`,
    };

    addProductToCart(productForCart);
  }, [
    product,
    currentImage,
    currentEgp,
    originalEgp,
    currentUsd,
    originalUsd,
    addProductToCart,
  ]);

  // Handle add to cart - directly add without confirmation
  const handleAddToCart = useCallback(() => {
    // Create a complete product object for the cart
    const productForCart = {
      id: product.id,
      title: product.title,
      name: product.title,
      imgSrc: currentImage,
      image_path: currentImage,
      price: currentEgp,
      originalPrice: originalEgp || currentEgp,
      dollarPrice: currentUsd,
      originalDollarPrice: originalUsd || currentUsd,
      weight: product.weight,
      selectedSize: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0]?.size : null,
      size: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0]?.size : null,
      selectedColor: Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0]?.color : null,
      color: Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0]?.color : null,
      sizes: product.sizes,
      colors: product.colors,
      cartId: `${product.id}`,
    };

    addProductToCart(productForCart);
  }, [
    product,
    currentImage,
    currentEgp,
    originalEgp,
    currentUsd,
    originalUsd,
    addProductToCart,
  ]);

  return (
    <div
      className={`${parentClass} ${gridClass} ${
        product?.isOnSale ? "on-sale" : ""
      }`}
    >
      <div
        className={`card-product-wrapper ${
          isNotImageRatio ? "aspect-ratio-0" : ""
        } ${radiusClass} `}
      >
        <Link
          href={productDetailUrl}
          className="product-img"
        >
          {currentImage && currentImage.trim() !== "" && (
            <Image
              className="lazyload img-product"
              src={currentImage}
              alt={product.title}
              width={600}
              height={800}
            />
          )}

          {product.imgHover && product.imgHover.trim() !== "" && (
            <Image
              className="lazyload img-hover"
              src={product.imgHover}
              alt={product.title}
              width={600}
              height={800}
            />
          )}
        </Link>

        {/* Hot Sale Banner */}
        {product?.hotSale && (
          <div className="marquee-product bg-main">
            <div className="marquee-wrapper">
              <div className="initial-child-container">
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
              </div>
            </div>
            <div className="marquee-wrapper">
              <div className="initial-child-container">
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
                <div className="marquee-child-item">
                  <p className="font-2 text-btn-uppercase fw-6 text-white">
                    {locale === "ar"
                      ? `عرض ساخن خصم ${product?.salePercentage}%`
                      : `Hot Sale ${product?.salePercentage}% OFF`}
                  </p>
                </div>
                <div className="marquee-child-item">
                  <span className="icon icon-lightning text-critical" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sale Badge */}
        {product?.isOnSale && (
          <div className="on-sale-wrap">
            <span className="on-sale-item">
              {locale === "ar"
                ? `${product?.discount}%`
                : `${product?.discount}%`}
            </span>
          </div>
        )}

        {/* Countdown */}
        {product?.countdown && (
          <div className="variant-wrap countdown-wrap">
            <div className="variant-box">
              <div
                className="js-countdown"
                data-timer={product?.countdown}
                data-labels="D :,H :,M :,S"
              >
                <CountdownTimer />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="list-product-btn">
          <a
            onClick={handleFavoriteToggle}
            className={`box-icon wishlist btn-icon-action ${
              isUpdatingFavorite ? "loading" : ""
            }`}
            style={{
              pointerEvents: isUpdatingFavorite ? "none" : "auto",
              opacity: isUpdatingFavorite ? 0.6 : 1,
            }}
          >
            {isUpdatingFavorite ? (
              <span className="icon icon-loading" />
            ) : (
              <span
                className={`icon ${
                  isProductInFavorites(product?.id)
                    ? "icon-heart-fill"
                    : "icon-heart"
                }`}
              />
            )}
            <span className="tooltip">
              {isUpdatingFavorite
                ? locale === "ar"
                  ? "جاري التحديث..."
                  : "Updating..."
                : isProductInFavorites(product?.id)
                ? locale === "ar"
                  ? "إزالة من المفضلة"
                  : "Remove from Favorites"
                : locale === "ar"
                ? "أضف إلى المفضلة"
                : "Add to Favorites"}
            </span>
          </a>
        </div>

        <div className="list-btn-main">
          <a className="btn-main-product" onClick={handleAddToCart}>
            {isAddedToCartProducts(product?.id)
              ? locale === "ar"
                ? "تم الإضافة بالفعل"
                : "Already Added"
              : locale === "ar"
              ? "أضف إلى السلة"
              : "ADD TO CART"}
          </a>
        </div>
      </div>

      <div className="card-product-info">
        <Link href={productDetailUrl} className="title link">
          {product.title}
        </Link>
        <span className="price d-flex flex-wrap align-items-center gap-1">
          {hasDiscount && originalEgp && (
            <span
              className="old-price"
              style={{
                textDecoration: "line-through",
                opacity: 0.65,
                fontSize: "0.88em",
                marginInlineEnd: "6px",
              }}
            >
              {locale === "ar"
                ? `ج.م ${originalEgp.toFixed(2)}`
                : `EGP ${originalEgp.toFixed(2)}`}
              {originalUsd > 0 && (
                <span className="text-secondary" style={{ fontSize: "0.85em", marginInlineStart: "4px" }}>
                  (${originalUsd.toFixed(2)})
                </span>
              )}
            </span>
          )}
          {hasAnyPrice ? (
            <span className="current-price-group d-inline-flex align-items-center flex-wrap">
              {hasSizePrices && (
                <span
                  className="text-secondary fw-normal"
                  style={{ fontSize: "0.85em", marginInlineEnd: "4px" }}
                >
                  {locale === "ar" ? "يبدأ من " : "From "}
                </span>
              )}
              <span className="fw-6 text-primary">
                {locale === "ar"
                  ? `ج.م ${currentEgp.toFixed(2)}`
                  : `EGP ${currentEgp.toFixed(2)}`}
              </span>
              <span
                className="text-secondary"
                style={{ fontSize: "0.85em", marginInlineStart: "4px" }}
              >
                (${currentUsd.toFixed(2)})
              </span>
            </span>
          ) : (
            <span className="text-secondary" style={{ fontSize: "0.88em" }}>
              {locale === "ar" ? "السعر عند الطلب" : "Price on request"}
            </span>
          )}
        </span>
        {product?.weight && (
          <div className="product-weight">
            <span className="weight-label">
              {locale === "ar" ? "الحجم:" : "Size:"}{" "}
            </span>
            <span className="weight-value">{product.weight}</span>
          </div>
        )}
      </div>

      <style>{`
        .old-price {
          text-decoration: line-through;
          color: #999;
          margin-right: 8px;
        }

        .product-weight {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #666;
        }

        .weight-label {
          font-weight: 500;
        }

        .weight-value {
          font-weight: 400;
          color: #333;
        }
      `}</style>
    </div>
  );
}

function arePropsEqual(prevProps, nextProps) {
  return (
    prevProps.product?.id === nextProps.product?.id &&
    prevProps.product?.price === nextProps.product?.price &&
    prevProps.product?.discount === nextProps.product?.discount &&
    prevProps.isNotImageRatio === nextProps.isNotImageRatio &&
    prevProps.gridClass === nextProps.gridClass
  );
}

export default React.memo(ProductCard1, arePropsEqual);
