import site from "./site.js";
import { loadGallery } from "../_lib/gallery.js";

// Projects and Pay Invoice links appear automatically once their content is ready.
export default function () {
  return [
    { url: "/", label: "Home" },
    { url: "/services/", label: "Services" },
    { url: "/projects/", label: "Projects", show: loadGallery().length > 0 },
    { url: "/about/", label: "About" },
    { url: "/contact/", label: "Contact" },
    { url: "/pay/", label: "Pay Invoice", show: site.paymentsLive },
  ].filter((item) => item.show !== false);
}
