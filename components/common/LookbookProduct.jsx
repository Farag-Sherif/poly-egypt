import { useLocale } from "@/i18n/provider";
import Image from "@/src/compat/AppImage";
import { Link } from "@/i18n/navigation";
import React from "react";

export default function LookbookProduct({ product, styleClass = "style-row" }) {
  const locale = useLocale();
  return (
    <Link
      href={`/product-detail/${product.id}-${product.title}`}
      className={`loobook-product ${styleClass} `}
    >
      <div className="img-style">
        <Image alt="img" src={product.imgSrc} width={151} height={151} />
      </div>
      <div className="content">
        <div className="info">
          <Link
            href={`/product-detail/${product.id}-${product.title}`}
            className="text-title text-line-clamp-1 link"
          >
            {product.title}
          </Link>
          {product.price !== 0 && (
            <div className="price text-button">
              {locale === "ar"
                ? `${product.price.toFixed(2)} ج.م`
                : `${product.price.toFixed(2)} EGP`}
            </div>
          )}
        </div>
        {/* <a
          href="#quickView"
          onClick={() => setQuickViewItem(product)}
          data-bs-toggle="modal"
          className="btn-lookbook btn-line"
        >
          Quick View
        </a> */}
      </div>
    </Link>
  );
}
