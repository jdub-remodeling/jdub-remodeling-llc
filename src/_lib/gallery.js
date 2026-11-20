import fs from "node:fs";
import path from "node:path";

export const PHOTO_DIR = "src/project-photos";
const PROJECTS_FILE = "src/_data/projects.json";
const CATEGORY_IDS = ["kitchens", "bathrooms", "other"];

function photoExists(file) {
  return typeof file === "string" && file.length > 0 && fs.existsSync(path.join(PHOTO_DIR, file));
}

function isUsableImage(image) {
  return image && photoExists(image.src) && typeof image.alt === "string" && image.alt.trim().length > 0;
}

// Returns only complete projects: valid category, title, and both photos present with alt text.
export function loadGallery() {
  let raw = [];
  try {
    raw = JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf8"));
  } catch (error) {
    console.warn(`[gallery] Could not read ${PROJECTS_FILE}: ${error.message}`);
    return [];
  }
  if (!Array.isArray(raw)) return [];

  return raw.filter((project, index) => {
    const problems = [];
    if (!project.title) problems.push("missing title");
    if (!CATEGORY_IDS.includes(project.category)) problems.push(`category must be one of ${CATEGORY_IDS.join(", ")}`);
    if (!isUsableImage(project.before)) problems.push("before photo missing or has no alt text");
    if (!isUsableImage(project.after)) problems.push("after photo missing or has no alt text");
    if (project.published === false) return false;
    if (problems.length) {
      console.warn(`[gallery] Skipping project #${index + 1} (${project.title || "untitled"}): ${problems.join("; ")}`);
      return false;
    }
    return true;
  });
}
