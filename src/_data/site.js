// Central business details and integration settings.
// Edit values here; every page reads from this file.
// Leave an integration value empty ("") to keep it switched off on the public site.

const GA4_ID_PATTERN = /^G-[A-Z0-9]{6,12}$/;
const SQUARE_HOSTS = ["squareup.com", "square.link", "app.squareup.com", "checkout.square.site"];

const config = {
  name: "J-Dub Remodeling LLC",
  shortName: "J-Dub Remodeling",
  tagline: "All Aspects of Remodeling",
  taglineServices: "Kitchens – Bathrooms – MORE!",

  // Site address. Netlify sets URL automatically to the primary domain once it is connected.
  // SITE_URL can be set in Netlify environment variables to override it.
  intendedDomain: "https://jdubremodelingllc.com",

  contact: {
    person: "Justin Robson",
    phoneDisplay: "850-614-0729",
    phoneE164: "+18506140729",
    email: "JdubRemodelingLLC@Yahoo.com",
  },

  // Confirmed service area. Leave empty until Justin confirms it; nothing is shown while empty.
  // Example: ["Pensacola, FL", "Gulf Breeze, FL"]
  serviceArea: [],

  // About page extras. Portrait goes in src/assets/img/ (for example "justin.jpg").
  // Each bio entry is one paragraph. Only add details Justin has confirmed.
  about: {
    portrait: "",
    portraitAlt: "Justin Robson of J-Dub Remodeling LLC",
    bio: [],
  },

  // Verified public profiles only. Leave empty to hide.
  links: {
    googleBusinessProfile: "",
    facebook: "",
  },

  integrations: {
    // Google Analytics 4 Measurement ID, for example "G-ABC123XYZ9". Empty disables Analytics entirely.
    ga4MeasurementId: process.env.GA4_MEASUREMENT_ID || "",
    // Google Search Console HTML-tag verification value (the content="..." part only).
    googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || "",
  },

  // Square invoice payments. The Pay page and buttons stay hidden until all three are set
  // and the URL has been checked by the owner.
  payments: {
    enabled: false,
    verified: false,
    squareUrl: "",
  },
};

function resolveSiteUrl() {
  const raw = process.env.SITE_URL || process.env.URL || "http://localhost:8080";
  return raw.replace(/\/+$/, "");
}

function isValidSquareUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && SQUARE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

const ga4 = config.integrations.ga4MeasurementId.trim();
const squareUrl = config.payments.squareUrl.trim();

export default {
  ...config,
  url: resolveSiteUrl(),
  // Only the production deploy should be indexed by search engines.
  allowIndexing: process.env.CONTEXT === "production" || process.env.ALLOW_INDEXING === "true",
  year: new Date().getFullYear(),
  analyticsId: GA4_ID_PATTERN.test(ga4) ? ga4 : "",
  siteVerification: config.integrations.googleSiteVerification.trim(),
  paymentsLive: config.payments.enabled && config.payments.verified && isValidSquareUrl(squareUrl),
  squareUrl: isValidSquareUrl(squareUrl) ? squareUrl : "",
};
