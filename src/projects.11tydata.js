import { loadGallery } from "./_lib/gallery.js";

// The Projects page is only published once at least one complete project exists.
const hasProjects = loadGallery().length > 0;

export default {
  permalink: hasProjects ? "/projects/" : false,
  eleventyExcludeFromCollections: !hasProjects,
};
