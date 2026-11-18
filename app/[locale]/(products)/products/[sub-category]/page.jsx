import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import Products1 from "@/components/products/Products1";
import Link from "@/i18n/navigation";
import React from "react";

export default async function ProductStylePage1({ params }) {
  const resolvedParams = params ? (typeof params.then === 'function' ? await params : params) : {};
  const { "sub-category": subCategory = "", locale = "en" } = resolvedParams;
  const subCategoryId = subCategory ? subCategory.split("-")[0] : null;
  const rawName = subCategory && subCategory.includes("-") ? subCategory.split("-").slice(1).join("-") : "";
  const subCategoryName = rawName ? decodeURIComponent(rawName) : "";

  return (
    <>
      <Topbar6 bgColor="bg-main" />
      <Header1 />
      <div
        className="page-title"
        style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h3 className="heading text-center">{subCategoryName}</h3>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href={`/`}>
                    {locale === "ar" ? "الرئيسية" : "Home"}
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li>{subCategoryName}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Products1 subCategoryId={subCategoryId} />
      <Footer1 />
    </>
  );
}
