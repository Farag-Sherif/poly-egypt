import{r as n,j as e,A as l,f as o,a as d,p as m,b as c,L as h}from"./index-C_VxmO6k.js";import{H as f,F as x}from"./Header1-CagZl22J.js";import{T as g}from"./Topbar6-CqfPts_O.js";function p({certificate:i}){const[a,t]=n.useState(!1),s=()=>{t(!0)};return e.jsxs("div",{className:"certificate-card",children:[e.jsxs("div",{className:"certificate-image-wrapper",children:[a?e.jsxs("div",{className:"certificate-placeholder",children:[e.jsx("i",{className:"icon-file-text"}),e.jsx("span",{children:"Certificate"})]}):e.jsx(l,{src:i.image_path,alt:i.title||"Certificate",width:400,height:300,className:"certificate-image",onError:s,priority:!1,loading:"lazy"}),e.jsx("div",{className:"certificate-overlay",children:e.jsx("button",{className:"btn-view-certificate",onClick:()=>window.open(i.image_path,"_blank"),"aria-label":`View ${i.title}`,children:e.jsx("i",{className:"icon-eye"})})})]}),e.jsx("div",{className:"certificate-content",children:e.jsx("h3",{className:"certificate-title",children:i.title})}),e.jsx("style",{children:`
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
      `})]})}function j(){const i=o("certificates"),{data:a,isLoading:t,error:s}=d({queryKey:["certificates"],queryFn:()=>m()});return t?e.jsx("section",{className:"flat-spacing",children:e.jsx("div",{className:"container",children:e.jsx("div",{className:"row",children:e.jsx("div",{className:"col-12",children:e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"spinner-border",role:"status",children:e.jsx("span",{className:"visually-hidden",children:i("loading")})}),e.jsx("p",{className:"mt-3",children:i("loading")})]})})})})}):s?e.jsx("section",{className:"flat-spacing",children:e.jsx("div",{className:"container",children:e.jsx("div",{className:"row",children:e.jsx("div",{className:"col-12",children:e.jsx("div",{className:"text-center",children:e.jsx("p",{className:"text-danger",children:i("noData")})})})})})}):e.jsx("section",{className:"flat-spacing",children:e.jsx("div",{className:"container",children:a?.length>0?e.jsx("div",{className:"row gy-4",children:a?.map(r=>e.jsx("div",{className:"col-lg-4 col-md-6 col-12",children:e.jsx(p,{certificate:r})},r.id))}):e.jsx("div",{className:"row",children:e.jsx("div",{className:"col-12",children:e.jsx("div",{className:"text-center",children:e.jsx("p",{children:i("noData")})})})})})})}async function b({params:i}){const a=await c({locale:i.locale,namespace:"certificates"});return{title:a("metaTitle"),description:a("metaDescription")}}async function y({params:i}){const{locale:a}=await i,t=await c({locale:a,namespace:"certificates"});return e.jsxs(e.Fragment,{children:[e.jsx(g,{bgColor:"bg-main"}),e.jsx(f,{}),e.jsx("div",{className:"page-title",style:{backgroundImage:"url(/images/section/page-title.jpg)"},children:e.jsx("div",{className:"container-full",children:e.jsx("div",{className:"row",children:e.jsxs("div",{className:"col-12",children:[e.jsx("h3",{className:"heading text-center",children:t("title")}),e.jsxs("ul",{className:"breadcrumbs d-flex align-items-center justify-content-center",children:[e.jsx("li",{children:e.jsx(h,{className:"link",href:"/",children:t("homepage")})}),e.jsx("li",{children:e.jsx("i",{className:"icon-arrRight"})}),e.jsx("li",{children:e.jsx("a",{className:"link",href:"#",children:t("pages")})}),e.jsx("li",{children:e.jsx("i",{className:"icon-arrRight"})}),e.jsx("li",{children:t("title")})]})]})})})}),e.jsx(j,{}),e.jsx(x,{})]})}export{y as default,b as generateMetadata};
