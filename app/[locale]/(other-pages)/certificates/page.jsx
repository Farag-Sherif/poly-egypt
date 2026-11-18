import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import CertificatesList from "@/components/otherPages/CertificatesList";
import React from "react";
import { getTranslations } from "@/i18n/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "certificates",
  });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CertificatesPage({ params }) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale,
    namespace: "certificates",
  });

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
              <h3 className="heading text-center">{t("title")}</h3>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href={`/`}>
                    {t("homepage")}
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li>
                  <a className="link" href="#">
                    {t("pages")}
                  </a>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li>{t("title")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <CertificatesList />
      <Footer1 />
    </>
  );
}
