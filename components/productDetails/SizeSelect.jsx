import React, { useState, useEffect } from "react";
import { getTranslation, isRTL } from "@/utils/translations";

export default function SizeSelect({
  sizes = [],
  locale = "en",
  activeSize = "",
  setActiveSize = null,
}) {
  const getInitialSize = (items) => {
    if (!items || items.length === 0) return "";
    const first = items[0];
    return typeof first === "object" ? first.size || first.value || first.name || "" : first;
  };

  const [selectedSizeDefault, setSelectedSizeDefault] = useState(() =>
    getInitialSize(sizes)
  );
  const isRtl = isRTL(locale);

  // Update default size when sizes change
  useEffect(() => {
    if (sizes.length > 0 && !selectedSizeDefault) {
      const initial = getInitialSize(sizes);
      setSelectedSizeDefault(initial);
      if (!activeSize && setActiveSize) {
        setActiveSize(initial);
      }
    }
  }, [sizes]);

  const currentSize = activeSize || selectedSizeDefault;

  const handleChange = (size) => {
    setSelectedSizeDefault(size);
    if (setActiveSize) {
      setActiveSize(size);
    }
  };

  // Don't render if no sizes available
  if (!sizes || sizes.length === 0) {
    return null;
  }

  // Find active size item to display its price in the label
  const activeItem = sizes.find((s) => {
    const val = typeof s === "object" ? s.size || s.value || s.name : s;
    return val === currentSize;
  });

  const activeEgp = activeItem && typeof activeItem === "object" ? Number(activeItem.price) || 0 : 0;
  const activeUsd =
    activeItem && typeof activeItem === "object"
      ? Number(activeItem.price_usd) || (activeEgp > 0 ? +(activeEgp / 50).toFixed(2) : 0)
      : 0;

  return (
    <div className="variant-picker-item" dir={isRtl ? "rtl" : "ltr"}>
      <div className="d-flex justify-content-between align-items-center mb_12">
        <div className="variant-picker-label">
          <span className="fw-6">{locale === "ar" ? "المقاس المحدد:" : "Selected size:"}</span>
          <span
            className="text-title variant-picker-label-value fw-6 text-primary"
            style={{ textTransform: "uppercase", marginInlineStart: "6px" }}
          >
            {currentSize || (locale === "ar" ? "اختر المقاس" : "Select size")}
          </span>
          {activeEgp > 0 && (
            <span
              className="size-label-price text-secondary"
              style={{ marginInlineStart: "8px", fontSize: "0.9em" }}
            >
              — {locale === "ar" ? `ج.م ${activeEgp.toFixed(2)}` : `EGP ${activeEgp.toFixed(2)}`}
              {activeUsd > 0 && ` ($${activeUsd.toFixed(2)} USD)`}
            </span>
          )}
        </div>
      </div>

      <div className="variant-picker-values gap12 d-flex flex-wrap">
        {sizes.map((sizeItem, index) => {
          const sizeValue =
            typeof sizeItem === "object"
              ? sizeItem.size || sizeItem.value || sizeItem.name || ""
              : sizeItem;
          const sizeId =
            typeof sizeItem === "object" && sizeItem.id !== undefined
              ? sizeItem.id
              : index;

          const sizeEgp = typeof sizeItem === "object" ? Number(sizeItem.price) || 0 : 0;
          const sizeUsd =
            typeof sizeItem === "object"
              ? Number(sizeItem.price_usd) || (sizeEgp > 0 ? +(sizeEgp / 50).toFixed(2) : 0)
              : 0;

          const isSelected = currentSize === sizeValue;

          return (
            <div
              key={sizeId}
              onClick={() => handleChange(sizeValue)}
              style={{ cursor: "pointer" }}
            >
              <input
                type="radio"
                id={`size-${sizeId}`}
                checked={isSelected}
                readOnly
                style={{ display: "none" }}
              />
              <label
                className={`style-text size-btn d-inline-flex flex-column align-items-center justify-content-center ${
                  isSelected ? "active" : ""
                }`}
                htmlFor={`size-${sizeId}`}
                data-value={sizeValue}
                style={{
                  minWidth: "72px",
                  padding: "8px 16px",
                  height: "auto",
                  lineHeight: "1.2",
                  borderRadius: "8px",
                  border: isSelected ? "2px solid #000" : "1px solid #dee2e6",
                  backgroundColor: isSelected ? "#f8f9fa" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <span
                  className="text-title fw-6"
                  style={{
                    textTransform: "uppercase",
                    fontSize: "0.95rem",
                    color: isSelected ? "#000" : "#333",
                  }}
                >
                  {sizeValue}
                </span>
                {sizeEgp > 0 && (
                  <span
                    className="size-price text-secondary mt-1"
                    style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}
                  >
                    {locale === "ar" ? `${sizeEgp} ج.م` : `${sizeEgp} EGP`}
                    {sizeUsd > 0 && ` ($${sizeUsd})`}
                  </span>
                )}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
