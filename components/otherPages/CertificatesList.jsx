import { getCertificates } from "@/actions/main";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/provider";
import React from "react";
import CertificateCard from "./CertificateCard";

export default function CertificatesList() {
  const t = useTranslations("certificates");

  const {
    data: certificatesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["certificates"],
    queryFn: () => getCertificates(),
  });

  if (isLoading) {
    return (
      <section className="flat-spacing">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">{t("loading")}</span>
                </div>
                <p className="mt-3">{t("loading")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flat-spacing">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="text-center">
                <p className="text-danger">{t("noData")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flat-spacing">
      <div className="container">
        {certificatesData?.length > 0 ? (
          <div className="row gy-4">
            {certificatesData?.map((certificate) => (
              <div key={certificate.id} className="col-lg-4 col-md-6 col-12">
                <CertificateCard certificate={certificate} />
              </div>
            ))}
          </div>
        ) : (
          <div className="row">
            <div className="col-12">
              <div className="text-center">
                <p>{t("noData")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
