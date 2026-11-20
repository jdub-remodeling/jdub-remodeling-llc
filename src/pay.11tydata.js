import site from "./_data/site.js";

// Hidden until a verified Square URL is configured in src/_data/site.js.
export default {
  permalink: site.paymentsLive ? "/pay/" : false,
  eleventyExcludeFromCollections: !site.paymentsLive,
};
