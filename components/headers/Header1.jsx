import React, { useEffect } from "react";
import Nav from "./Nav";
import Image from "@/src/compat/AppImage";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "@/i18n/provider";
import CartLength from "../common/CartLength";
import { useUserStore } from "@/store/userStore";
import { logout } from "@/actions/auth";
import { useQuery } from "@tanstack/react-query";
import { getCertificates, getSettings } from "@/actions/main";

export default function Header1({ fullWidth = false }) {
  const { data } = useQuery({
    queryKey: ["catalogueUrl"],
    queryFn: () => getSettings(),
  });

  const catalogueUrl = data?.settings?.about_file;
  const locale = useLocale();
  const { user, fetchUser, clearUser } = useUserStore();
  const t = useTranslations("header");
  const router = useRouter();
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await logout();
    clearUser();
    fetchUser();
    router.push("/login");
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <header
        id="header"
        className={`header-default ${fullWidth ? "header-fullwidth" : ""} `}
      >
        <div className={fullWidth ? "" : "container"}>
          <div className="row wrapper-header align-items-center">
            <div className="col-md-4 col-2 d-xl-none">
              <a
                href="#mobileMenu"
                className="mobile-menu"
                data-bs-toggle="offcanvas"
                aria-controls="mobileMenu"
              >
                <i className="icon icon-categories" />
              </a>
            </div>
            <div className="col-xl-3 col-md-4 col-4">
              <Link href={`/`} className="logo-header">
                <Image
                  alt="logo"
                  className="logo"
                  src={
                    locale === "en"
                      ? "/images/logo/logo-en.png"
                      : "/images/logo/logo.png"
                  }
                  width={100}
                  height={100}
                />
              </Link>
            </div>
            <div className="col-xl-6 d-none d-xl-block">
              <nav className="box-navigation text-center">
                <ul className="box-nav-ul d-flex align-items-center justify-content-center">
                  <Nav />
                </ul>
              </nav>
            </div>
            <div className="col-xl-3 col-md-4 col-6">
              <ul className="nav-icon d-flex justify-content-end align-items-center">
                {/* Search - Hidden on smallest screens, visible on md+ */}
                <li className="nav-search">
                  <a
                    href="#search"
                    data-bs-toggle="modal"
                    className="nav-icon-item"
                  >
                    <svg
                      className="icon"
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                        stroke="#181818"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M21.35 21.0004L17 16.6504"
                        stroke="#181818"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </li>

                {/* User Account - Prioritized for mobile visibility */}
                <li className="nav-account d-block">
                  <a
                    href="#"
                    className="nav-icon-item d-flex align-items-center justify-content-center"
                  >
                    <svg
                      className="icon"
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                        stroke="#181818"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                        stroke="#181818"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                  <div className="dropdown-account dropdown-login">
                    {user ? (
                      <div className="sub-top">
                        <div className="user-info">
                          <h5>{user.fname || t("user")}</h5>
                          <p>{user.email}</p>
                        </div>
                        <ul className="user-menu">
                          <li>
                            <Link href="/my-account">{t("myProfile")}</Link>
                          </li>
                          <li>
                            <Link href="/my-account-orders">
                              {t("myOrders")}
                            </Link>
                          </li>

                          <li>
                            <button
                              onClick={handleLogout}
                              className="logout-btn"
                            >
                              {t("logout")}
                            </button>
                          </li>
                        </ul>
                      </div>
                    ) : (
                      <div className="sub-top">
                        <Link href={`/login`} className="tf-btn btn-reset">
                          {t("login")}
                        </Link>
                        <p className="text-center text-secondary-2">
                          {t("noAccount")}{" "}
                          <Link href={`/register`}>{t("register")}</Link>
                        </p>
                      </div>
                    )}
                    <div className="sub-bot">
                      <span className="body-text-">{t("support")}</span>
                    </div>
                  </div>
                </li>
                {/* Wishlist - Hidden on mobile, visible on md+ for logged in users */}
                {user && (
                  <li className="nav-wishlist d-none d-md-block">
                    <Link href={`/wish-list`} className="nav-icon-item">
                      <svg
                        className="icon"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20.8401 4.60987C20.3294 4.09888 19.7229 3.69352 19.0555 3.41696C18.388 3.14039 17.6726 2.99805 16.9501 2.99805C16.2276 2.99805 15.5122 3.14039 14.8448 3.41696C14.1773 3.69352 13.5709 4.09888 13.0601 4.60987L12.0001 5.66987L10.9401 4.60987C9.90843 3.57818 8.50915 2.99858 7.05012 2.99858C5.59109 2.99858 4.19181 3.57818 3.16012 4.60987C2.12843 5.64156 1.54883 7.04084 1.54883 8.49987C1.54883 9.95891 2.12843 11.3582 3.16012 12.3899L4.22012 13.4499L12.0001 21.2299L19.7801 13.4499L20.8401 12.3899C21.3511 11.8791 21.7565 11.2727 22.033 10.6052C22.3096 9.93777 22.4519 9.22236 22.4519 8.49987C22.4519 7.77738 22.3096 7.06198 22.033 6.39452C21.7565 5.72706 21.3511 5.12063 20.8401 4.60987V4.60987Z"
                          stroke="#181818"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </li>
                )}
                {/* Cart - Always visible with prominent positioning */}
                <li className="nav-cart">
                  <a
                    href="#shoppingCart"
                    data-bs-toggle="modal"
                    className="nav-icon-item d-flex align-items-center justify-content-center"
                  >
                    <svg
                      className="icon"
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16.5078 10.8734V6.36686C16.5078 5.17166 16.033 4.02541 15.1879 3.18028C14.3428 2.33514 13.1965 1.86035 12.0013 1.86035C10.8061 1.86035 9.65985 2.33514 8.81472 3.18028C7.96958 4.02541 7.49479 5.17166 7.49479 6.36686V10.8734M4.11491 8.62012H19.8877L21.0143 22.1396H2.98828L4.11491 8.62012Z"
                        stroke="#181818"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="count-box">
                      <CartLength />
                    </span>
                  </a>
                </li>
                {/* Download Catalogue - Premium Professional Button */}
                <li className="nav-download d-none d-lg-block me-3">
                  <a
                    href={catalogueUrl}
                    download
                    target="_blank"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-4 py-2 text-decoration-none fw-600 position-relative overflow-hidden"
                    title={t("downloadCatalogue")}
                    style={{
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, #0d6efd 0%, #0056b3 100%)",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(13, 110, 253, 0.2)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      fontSize: "13px",
                      fontWeight: "600",
                      letterSpacing: "0.3px",
                      textTransform: "uppercase",
                      minHeight: "38px",
                      whiteSpace: "nowrap",
                      color: "#ffffff",
                    }}
                  >
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-10"
                      style={{
                        background:
                          "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                        animation: "shimmer 2s infinite",
                      }}
                    />
                    {/* <svg
                      className="icon flex-shrink-0"
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
                      }}
                    >
                      <path
                        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 2V8H20"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 18V12"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 15L12 18L15 15"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg> */}
                    <span className="position-relative">
                      {t("downloadCatalogue")}
                    </span>
                  </a>
                </li>
                {/* Language Selector - Hidden on mobile to save space  */}
                {/* <li className="nav-language d-none d-md-block">
                <LanguageSelect
                  topStart={true}
                  parentClassName="image-select center style-default type-languages"
                />
              </li> */}
              </ul>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
