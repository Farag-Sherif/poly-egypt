import React, { useState, useEffect } from "react";
import { isRTL } from "@/utils/translations";

const formatMoney = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0";
  const num = Number(amount);
  return num % 1 === 0
    ? num.toLocaleString("en-US")
    : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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
    <div className="poly-size-select-wrap" dir={isRtl ? "rtl" : "ltr"}>
      <div className="d-flex justify-content-between align-items-center mb_12">
        <div className="variant-picker-label d-flex align-items-center flex-wrap gap-2">
          <span className="fw-6 text-dark" style={{ fontSize: "0.95rem" }}>
            {locale === "ar" ? "المقاس المحدد:" : "Selected size:"}
          </span>
          <span
            className="variant-picker-label-value fw-7 text-primary"
            style={{ textTransform: "uppercase", fontSize: "0.95rem" }}
          >
            {currentSize || (locale === "ar" ? "اختر المقاس" : "Select size")}
          </span>
          {activeEgp > 0 && (
            <span
              className="text-secondary fw-5 d-inline-flex align-items-center gap-1"
              style={{ fontSize: "0.9rem" }}
            >
              <span>— {locale === "ar" ? `${formatMoney(activeEgp)} ج.م` : `${formatMoney(activeEgp)} EGP`}</span>
              {activeUsd > 0 && (
                <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
                  (${formatMoney(activeUsd)} USD)
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="poly-size-chips-list">
        {sizes.map((sizeItem, index) => {
          const sizeValue =
            typeof sizeItem === "object"
              ? sizeItem.size || sizeItem.value || sizeItem.name || ""
              : sizeItem;
          const sizeId =
            typeof sizeItem === "object" && sizeItem.id !== undefined
              ? sizeItem.id
              : index;

          const isSelected = currentSize === sizeValue;

          return (
            <button
              key={sizeId}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`poly-size-btn ${isSelected ? "is-selected" : ""}`}
              onClick={() => handleChange(sizeValue)}
              title={sizeValue}
            >
              <span className="poly-size-btn-text">{sizeValue}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .poly-size-select-wrap {
          margin-bottom: 20px;
        }
        .poly-size-chips-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .poly-size-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 50px;
          height: 44px;
          padding: 0 16px;
          background: #ffffff;
          border: 1.5px solid #dbe2ea;
          border-radius: 10px;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          font-family: inherit;
          text-decoration: none;
          outline: none;
        }
        .poly-size-btn:hover {
          border-color: #0d6efd;
          background-color: #f0f7ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(13, 110, 253, 0.12);
        }
        .poly-size-btn:hover .poly-size-btn-text {
          color: #0d6efd;
        }
        .poly-size-btn.is-selected {
          border-color: #0d6efd;
          background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.35);
        }
        .poly-size-btn-text {
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          color: #1e293b;
          transition: color 0.15s ease;
        }
        .poly-size-btn.is-selected .poly-size-btn-text {
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}
