import Image from "@/src/compat/AppImage";
import { useEffect, useRef, useState } from "react";
import { useContextElement } from "@/context/Context";

const optionsData = [
  {
    code: "EGP",
    value: "eg",
    thumbnail: "/images/country/eg.svg",
    text: "EGP",
    title: "EGP ج.م | Egypt",
  },
  {
    code: "USD",
    value: "us",
    thumbnail: "/images/country/us.svg",
    text: "USD",
    title: "USD $ | United States",
  },
];

export default function CurrencySelect({ topStart = false, light = false }) {
  const { currency = "EGP", setCurrency } = useContextElement() || {};
  const [isDDOpen, setIsDDOpen] = useState(false);
  const languageSelect = useRef();

  const selectedOption =
    optionsData.find((opt) => opt.code === currency) || optionsData[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        languageSelect.current &&
        !languageSelect.current.contains(event.target)
      ) {
        setIsDDOpen(false); // Close the dropdown if click is outside
      }
    };
    // Add the event listener when the component mounts
    document.addEventListener("click", handleClickOutside);

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={languageSelect}
      className={`dropdown bootstrap-select image-select center style-default type-currencies ${
        light ? "color-white" : ""
      } dropup`}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          setIsDDOpen((pre) => !pre);
        }}
        className={`btn dropdown-toggle btn-light ${isDDOpen ? "show" : ""}`}
        title={selectedOption.title}
      >
        <div className="filter-option">
          <div className="filter-option-inner">
            <div className="filter-option-inner-inner">
              <Image
                src={selectedOption.thumbnail}
                width="640"
                height="480"
                alt={selectedOption.text}
              />
              {selectedOption.text}
            </div>
          </div>
        </div>
      </button>
      <div
        className={`dropdown-menu ${isDDOpen ? "show" : ""}`}
        style={{
          maxHeight: "899.688px",
          overflow: "hidden",
          minHeight: 0,
          position: "absolute",
          inset: topStart ? "" : "auto auto 0px 0px",
          margin: 0,
          transform: `translate(0px, ${topStart ? 22 : -20}px)`,
        }}
        data-popper-placement={`${!topStart ? "top" : "bottom"}-start`}
      >
        <div
          className="inner show"
          style={{ maxHeight: "869.688px", overflowY: "auto", minHeight: 0 }}
        >
          <ul
            className="dropdown-menu inner show"
            role="presentation"
            style={{ marginTop: 0, marginBottom: 0 }}
          >
            {optionsData.map((elm, i) => (
              <li
                onClick={() => {
                  if (setCurrency) {
                    setCurrency(elm.code);
                  }
                  setIsDDOpen(false);
                }}
                key={i}
                style={{ cursor: "pointer" }}
              >
                <a
                  className={`dropdown-item ${
                    selectedOption.code === elm.code ? "active selected" : ""
                  }`}
                >
                  <span className="text">
                    <Image
                      src={elm.thumbnail}
                      width="640"
                      height="480"
                      alt={elm.text}
                    />
                    {elm.text}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
