import fs from "node:fs";
import path from "node:path";

export const PHOTO_DIR = "src/project-photos";
// Projects come from two places: the legacy list (empty by default) and one JSON file per project
// written by the /admin/ editor (Decap CMS).
const PROJECTS_FILE = "src/_data/projects.json";
const PROJECTS_DIR = "src/content/projects";
const CATEGORY_IDS = ["kitchens", "bathrooms", "other"];

// Photo paths may be stored as "uploads/kitchen.jpg", "/uploads/kitchen.jpg", or with the
// "project-photos/" prefix. All of them point inside PHOTO_DIR; anything that escapes it is rejected.
export function resolvePhoto(file) {
  if (typeof file !== "string" || !file.trim()) return null;
  const relative = file
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^(src\/)?project-photos\//, "");
  const full = path.resolve(PHOTO_DIR, relative);
  const root = path.resolve(PHOTO_DIR);
  if (!full.startsWith(root + path.sep)) return null;
  return fs.existsSync(full) && fs.statSync(full).isFile() ? { relative, full } : null;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.warn(`[gallery] Could not read ${file}: ${error.message}`);
    return null;
  }
}

function readAllProjects() {
  const projects = [];
  const legacy = readJson(PROJECTS_FILE);
  if (Array.isArray(legacy)) projects.push(...legacy);

  if (fs.existsSync(PROJECTS_DIR)) {
    for (const name of fs.readdirSync(PROJECTS_DIR).sort()) {
      if (!name.endsWith(".json")) continue;
      const project = readJson(path.join(PROJECTS_DIR, name));
      if (project && typeof project === "object" && !Array.isArray(project)) projects.push(project);
    }
  }
  return projects;
}

function normalizeImage(image) {
  if (!image || typeof image.alt !== "string" || !image.alt.trim()) return null;
  const photo = resolvePhoto(image.src);
  return photo ? { src: photo.relative, alt: image.alt.trim() } : null;
}

// Returns only complete projects: valid category, title, and both photos present with alt text.
export function loadGallery() {
  const cleaned = readAllProjects().flatMap((project, index) => {
    if (project.published === false) return [];
    const before = normalizeImage(project.before);
    const after = normalizeImage(project.after);
    const problems = [];
    if (!project.title || !String(project.title).trim()) problems.push("missing title");
    if (!CATEGORY_IDS.includes(project.category)) problems.push(`category must be one of ${CATEGORY_IDS.join(", ")}`);
    if (!before) problems.push("before photo missing or has no description");
    if (!after) problems.push("after photo missing or has no description");
    if (problems.length) {
      console.warn(`[gallery] Skipping project #${index + 1} (${project.title || "untitled"}): ${problems.join("; ")}`);
      return [];
    }
    return [{ ...project, title: String(project.title).trim(), before, after }];
  });

  // Newest first when dates are present; otherwise keep the order they were found in.
  const time = (project) => (project.date ? new Date(project.date).getTime() || 0 : 0);
  return cleaned
    .map((project, order) => ({ project, order }))
    .sort((a, b) => time(b.project) - time(a.project) || a.order - b.order)
    .map(({ project }) => project);
}
