import site from "./site.js";

// Pay Invoice appears once a verified Square link is configured.
// Before & After stays in the menu even before the first project is posted.
export default function () {
  return [
    { url: "/", label: "Home" },
    { url: "/services/", label: "Services" },
    { url: "/projects/", label: "Before & After" },
    { url: "/about/", label: "About" },
    { url: "/contact/", label: "Contact" },
    { url: "/pay/", label: "Pay Invoice", show: site.paymentsLive },
  ].filter((item) => item.show !== false);
}
