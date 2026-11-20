import path from "node:path";
import Image from "@11ty/eleventy-img";
import { loadGallery, PHOTO_DIR } from "./src/_lib/gallery.js";

const IMAGE_OPTIONS = {
  widths: [480, 800, 1400],
  formats: ["webp", "jpeg"],
  outputDir: "_site/img/projects/",
  urlPath: "/img/projects/",
  sharpJpegOptions: { quality: 80, mozjpeg: true },
  sharpWebpOptions: { quality: 78 },
};

async function processPhoto(file) {
  return Image(path.join(PHOTO_DIR, file), IMAGE_OPTIONS);
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/oswald/files/oswald-latin-500-normal.woff2": "assets/fonts/oswald-500.woff2",
    "node_modules/@fontsource/oswald/files/oswald-latin-700-normal.woff2": "assets/fonts/oswald-700.woff2",
  });
  eleventyConfig.addPassthroughCopy({ "src/assets/img/favicon-32.png": "favicon.png" });

  // Project editor (Decap CMS) at /admin/. The editor script is copied from node_modules so it is
  // served from this site and does not depend on an outside CDN.
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({
    "node_modules/decap-cms/dist/decap-cms.js": "admin/vendor/decap-cms.js",
    "node_modules/decap-cms/dist/*.decap-cms.js": "admin/vendor",
    "node_modules/decap-cms/dist/*.wasm": "admin/vendor",
  });
  eleventyConfig.addWatchTarget("src/content/");

  eleventyConfig.addGlobalData("gallery", () => loadGallery());

  // Responsive <picture> with fixed width/height so the layout does not shift while loading.
  eleventyConfig.addAsyncShortcode("projectPhoto", async (file, alt, sizes = "(min-width: 900px) 33vw, 100vw") => {
    const metadata = await processPhoto(file);
    return Image.generateHTML(metadata, { alt, sizes, loading: "lazy", decoding: "async" });
  });

  // Largest JPEG URL, used by the full-screen viewer.
  eleventyConfig.addAsyncShortcode("projectPhotoLarge", async (file) => {
    const metadata = await processPhoto(file);
    const jpegs = metadata.jpeg;
    return jpegs[jpegs.length - 1].url;
  });

  eleventyConfig.addFilter("categoryLabel", (id, categories) => {
    const match = categories.find((category) => category.id === id);
    return match ? match.label : id;
  });

  eleventyConfig.addFilter("usedCategories", (projects, categories) =>
    categories.filter((category) => projects.some((project) => project.category === category.id)),
  );

  eleventyConfig.addFilter("featured", (projects, limit = 3) => {
    const featured = projects.filter((project) => project.featured);
    return (featured.length ? featured : projects).slice(0, limit);
  });

  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString().slice(0, 10));

  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
