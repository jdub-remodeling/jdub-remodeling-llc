import site from "./site.js";

// Only verified business facts. No address, hours, reviews, or ratings until confirmed.
export default function () {
  const data = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: site.name,
    url: `${site.url}/`,
    telephone: site.contact.phoneE164,
    email: site.contact.email,
    logo: `${site.url}/assets/img/icon-512.png`,
    image: `${site.url}/assets/img/og-image.jpg`,
    description: "Kitchen, bathroom, and general home remodeling.",
    founder: { "@type": "Person", name: site.contact.person },
  };

  if (site.serviceArea.length) {
    data.areaServed = site.serviceArea.map((place) => ({ "@type": "Place", name: place }));
  }

  const sameAs = Object.values(site.links).filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;

  return data;
}
