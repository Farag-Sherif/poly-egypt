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

          const sizeEgp = typeof sizeItem === "object" ? Number(sizeItem.price) || 0 : 0;
          const sizeUsd =
            typeof sizeItem === "object"
              ? Number(sizeItem.price_usd) || (sizeEgp > 0 ? +(sizeEgp / 50).toFixed(2) : 0)
              : 0;

          const isSelected = currentSize === sizeValue;

          return (
            <button
              key={sizeId}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`poly-size-chip ${isSelected ? "is-selected" : ""}`}
              onClick={() => handleChange(sizeValue)}
            >
              <span className="poly-size-indicator">
                {isSelected && (
                  <svg
                    className="poly-size-check-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span className="poly-size-name">{sizeValue}</span>
              </span>

              {sizeEgp > 0 && (
                <span className="poly-size-price-tag">
                  <span className="poly-size-egp">
                    {locale === "ar" ? `${formatMoney(sizeEgp)} ج.م` : `${formatMoney(sizeEgp)} EGP`}
                  </span>
                  {sizeUsd > 0 && (
                    <span className="poly-size-usd" dir="ltr" style={{ unicodeBidi: "isolate" }}>
                      (${formatMoney(sizeUsd)})
                    </span>
                  )}
                </span>
              )}
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
          gap: 12px;
          align-items: center;
        }
        .poly-size-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          font-family: inherit;
          text-decoration: none;
          outline: none;
        }
        .poly-size-chip:hover {
          border-color: #111827;
          background-color: #f9fafb;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
        }
        .poly-size-chip.is-selected {
          border-color: #111827;
          background-color: #111827;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(17, 24, 39, 0.18);
        }
        .poly-size-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .poly-size-check-icon {
          stroke: #ffffff;
          flex-shrink: 0;
          animation: polyCheckPop 0.2s ease-out;
        }
        @keyframes polyCheckPop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .poly-size-name {
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #111827;
        }
        .poly-size-chip.is-selected .poly-size-name {
          color: #ffffff;
        }
        .poly-size-price-tag {
          display: inline-flex;
          align-items: baseline;
          gap: 5px;
          padding-inline-start: 10px;
          border-inline-start: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        .poly-size-chip.is-selected .poly-size-price-tag {
          border-inline-start-color: rgba(255, 255, 255, 0.25);
        }
        .poly-size-egp {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1f2937;
        }
        .poly-size-chip.is-selected .poly-size-egp {
          color: #ffffff;
        }
        .poly-size-usd {
          font-size: 0.8rem;
          font-weight: 500;
          color: #6b7280;
        }
        .poly-size-chip.is-selected .poly-size-usd {
          color: #d1d5db;
        }
      `}</style>
    </div>
  );
}
