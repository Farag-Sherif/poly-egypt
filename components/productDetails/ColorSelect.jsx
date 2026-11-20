import React, { useState, useEffect } from "react";
import { isRTL } from "@/utils/translations";

const COLOR_NAMES_MAP = {
  "#c73d3d": { ar: "أحمر", en: "Red" },
  "#ff0000": { ar: "أحمر", en: "Red" },
  "#0000ff": { ar: "أزرق", en: "Blue" },
  "#00ff00": { ar: "أخضر", en: "Green" },
  "#00ffff": { ar: "سماوي (Cyan)", en: "Cyan" },
  "#ffffff": { ar: "أبيض ناصع", en: "Cool White" },
  "#fff3cc": { ar: "أبيض دافئ", en: "Warm White" },
  "#fff4e0": { ar: "أبيض دافئ", en: "Warm White" },
  "#fff1d0": { ar: "أبيض دافئ", en: "Warm White" },
  "#ffeb3b": { ar: "أصفر هادئ", en: "Soft Yellow" },
  "#ffa500": { ar: "برتقالي", en: "Orange" },
  "#800080": { ar: "بنفسجي", en: "Purple" },
  "#ff69b4": { ar: "وردي", en: "Pink" },
};

export default function ColorSelect({
  activeColor = "",
  setActiveColor,
  colors = [],
  locale = "en",
}) {
  const getInitialColor = (items) => {
    if (!items || items.length === 0) return "";
    const first = items[0];
    return typeof first === "object"
      ? first.color || first.value || first.name || ""
      : first;
  };

  const [activeColorDefault, setActiveColorDefault] = useState(() =>
    getInitialColor(colors)
  );
  const isRtl = isRTL(locale);

  // Update default color when colors change
  useEffect(() => {
    if (colors && colors.length > 0) {
      const initial = getInitialColor(colors);
      setActiveColorDefault(initial);
      if (!activeColor && setActiveColor) {
        setActiveColor(initial);
      }
    }
  }, [colors]);

  const handleSelectColor = (colorValue) => {
    setActiveColorDefault(colorValue);
    if (setActiveColor) {
      setActiveColor(colorValue);
    }
  };

  const currentActiveColor = activeColor || activeColorDefault;

  const getFriendlyColorName = (val) => {
    if (!val) return "";
    const lower = String(val).toLowerCase();
    if (COLOR_NAMES_MAP[lower]) {
      return COLOR_NAMES_MAP[lower][locale] || COLOR_NAMES_MAP[lower].en;
    }
    return val;
  };

  // Don't render if no colors available
  if (!colors || colors.length === 0) {
    return null;
  }

  const activeColorLabel = getFriendlyColorName(currentActiveColor);

  return (
    <div className="variant-picker-item" dir={isRtl ? "rtl" : "ltr"}>
      <div className="variant-picker-label mb_12">
        <span className="fw-6">{locale === "ar" ? "لون الإضاءة:" : "Lighting Color:"}</span>
        <span
          className="text-title variant-picker-label-value value-currentColor fw-6 text-primary"
          style={{ textTransform: "capitalize", marginInlineStart: "6px" }}
        >
          {activeColorLabel || (locale === "ar" ? "اختر اللون" : "Select Color")}
        </span>
      </div>
      <div className="variant-picker-values">
        {colors.map((colorItem, index) => {
          const colorValue =
            typeof colorItem === "object"
              ? colorItem.color || colorItem.value || colorItem.name || ""
              : colorItem;
          const colorDisplay =
            typeof colorItem === "object"
              ? colorItem.hex ||
                colorItem.color ||
                colorItem.value ||
                colorItem.name ||
                "#ccc"
              : colorItem;
          const colorId =
            colorItem.id !== undefined && colorItem.id !== null
              ? colorItem.id
              : index;
          const colorLabel =
            typeof colorItem === "object"
              ? colorItem.name || getFriendlyColorName(colorValue) || colorValue
              : getFriendlyColorName(colorValue) || colorValue;

          const isSelected =
            currentActiveColor &&
            (currentActiveColor === colorValue ||
              currentActiveColor === colorItem);

          return (
            <React.Fragment key={colorId}>
              <input
                id={`color-${colorId}`}
                type="radio"
                readOnly
                checked={isSelected}
              />
              <label
                onClick={() => {
                  handleSelectColor(colorValue);
                }}
                className={`hover-tooltip tooltip-bot radius-60 color-btn ${
                  isSelected ? "active" : ""
                }`}
                htmlFor={`color-${colorId}`}
                style={{ cursor: "pointer" }}
              >
                <span
                  className="btn-checkbox"
                  style={{
                    backgroundColor: colorDisplay,
                    border:
                      colorDisplay === "#ffffff" ||
                      colorDisplay?.toLowerCase?.() === "white"
                        ? "1px solid #ddd"
                        : "1px solid transparent",
                    boxShadow: isSelected ? "0 0 0 2px #000" : "none",
                  }}
                />
                <span className="tooltip">{colorLabel}</span>
              </label>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
