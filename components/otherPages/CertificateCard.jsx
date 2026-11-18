import Image from "@/src/compat/AppImage";
import React, { useState } from "react";

export default function CertificateCard({ certificate }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="certificate-card">
      <div className="certificate-image-wrapper">
        {!imageError ? (
          <Image
            src={certificate.image_path}
            alt={certificate.title || "Certificate"}
            width={400}
            height={300}
            className="certificate-image"
            onError={handleImageError}
            priority={false}
            loading="lazy"
          />
        ) : (
          <div className="certificate-placeholder">
            <i className="icon-file-text" />
            <span>Certificate</span>
          </div>
        )}
        <div className="certificate-overlay">
          <button
            className="btn-view-certificate"
            onClick={() => window.open(certificate.image_path, "_blank")}
            aria-label={`View ${certificate.title}`}
          >
            <i className="icon-eye" />
          </button>
        </div>
      </div>
      <div className="certificate-content">
        <h3 className="certificate-title">{certificate.title}</h3>
      </div>

      <style>{`
        .certificate-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .certificate-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .certificate-image-wrapper {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .certificate-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        .certificate-card:hover .certificate-image {
          transform: scale(1.05);
        }

        .certificate-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          color: #6c757d;
        }

        .certificate-placeholder i {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .certificate-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .certificate-card:hover .certificate-overlay {
          opacity: 1;
        }

        .btn-view-certificate {
          background: #fff;
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
          font-size: 1.2rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .btn-view-certificate:hover {
          background: #f8f9fa;
          transform: scale(1.1);
        }

        .certificate-content {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .certificate-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          text-align: center;
          margin: 0;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .certificate-image-wrapper {
            height: 150px;
          }

          .certificate-content {
            padding: 1rem;
          }

          .certificate-title {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
