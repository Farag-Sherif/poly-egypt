import React, { useState, useEffect } from "react";
import { getTranslation, isRTL } from "@/utils/translations";

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

  // Don't render if no colors available
  if (!colors || colors.length === 0) {
    return null;
  }

  return (
    <div className="variant-picker-item" dir={isRtl ? "rtl" : "ltr"}>
      <div className="variant-picker-label mb_12">
        {getTranslation("colors", locale)}:
        <span
          className="text-title variant-picker-label-value value-currentColor"
          style={{ textTransform: "capitalize", marginInlineStart: "6px" }}
        >
          {currentActiveColor || getTranslation("selectColor", locale)}
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
              ? colorItem.name || colorItem.color || colorItem.value || colorValue
              : colorValue;

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
