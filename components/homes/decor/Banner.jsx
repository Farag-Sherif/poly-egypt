import React from "react";
import Image from "@/src/compat/AppImage";
import Link from "@/i18n/navigation";
import { getSlidersCategories } from "@/actions/slider";
import { useQuery } from "@tanstack/react-query";
export default function Banner() {
  const { data: slidersCategories, isLoading } = useQuery({
    queryKey: ["sliders-categories"],
    queryFn: getSlidersCategories,
  });

  console.log(slidersCategories);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <section className="flat-spacing pt-0">
      <div className="container">
        <div className="banner-cls-discover hover-img">
          <a href="#" className="img-style">
            <Image
              className="lazyload"
              data-src={slidersCategories[0].image_path}
              alt="cls-tiktok"
              src={slidersCategories[0].image_path}
              width={1290}
              height={480}
            />
          </a>
          <div className="cls-content">
            <div className="box-title-top">
              <h3 className="title">
                <a
                  href="#"
                  className="link text-white wow fadeInUp"
                  data-wow-delay="0.1s"
                >
                  {slidersCategories[0].title}
                </a>
              </h3>
              <p className="desc text-white wow fadeInUp" data-wow-delay="0.2s">
                {slidersCategories[0].description}
              </p>
            </div>
            <div className="wow fadeInUp" data-wow-delay="0.3s">
              <Link
                href={slidersCategories[0].button_url}
                className="tf-btn btn-md btn-white"
              >
                <span className="text">{slidersCategories[0].button_text}</span>
                <i className="icon icon-arrowUpRight" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
