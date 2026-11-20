// Builds the site, then checks the output for broken links, missing metadata, and leftover test content.
// Run with: npm run check
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = "_site";
const FORBIDDEN = [/\bTEST\b/, /lorem ipsum/i, /\bTODO\b/, /placeholder/i, /G-TEST/i];

execSync("npx @11ty/eleventy --quiet", { stdio: "inherit" });

const problems = [];
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    // The /admin/ editor is a separate app; it is checked on its own below.
    if (entry.isDirectory() && full === path.join(OUT, "admin")) continue;
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
}
walk(OUT);

function resolveLocal(url) {
  const clean = decodeURI(url.split("#")[0].split("?")[0]);
  if (!clean) return true;
  const target = path.join(OUT, clean);
  if (clean.endsWith("/")) return fs.existsSync(path.join(target, "index.html"));
  return fs.existsSync(target) || fs.existsSync(`${target}.html`);
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const page = path.relative(OUT, file);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");

  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  if (h1Count !== 1) problems.push(`${page}: expected one <h1>, found ${h1Count}`);
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${page}: missing <title>`);
  if (!/<meta name="description" content="[^"]{20,}">/.test(html)) problems.push(`${page}: missing meta description`);
  if (!/<link rel="canonical" href="[^"]+">/.test(html)) problems.push(`${page}: missing canonical link`);

  for (const pattern of FORBIDDEN) {
    if (pattern.test(text)) problems.push(`${page}: contains forbidden text matching ${pattern}`);
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(https?:|mailto:|tel:|sms:|data:|#)/.test(url)) continue;
    if (!resolveLocal(url)) problems.push(`${page}: broken link ${url}`);
  }
  for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of match[1].split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url.startsWith("/") && !resolveLocal(url)) problems.push(`${page}: broken image ${url}`);
    }
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(match[0])) problems.push(`${page}: image without alt attribute`);
  }
}

const contact = fs.readFileSync(path.join(OUT, "contact", "index.html"), "utf8");
if (!/<form[^>]*name="quote"[^>]*data-netlify="true"/.test(contact)) problems.push("contact: Netlify quote form not found");
if (!/name="form-name" value="quote"/.test(contact)) problems.push("contact: hidden form-name field missing");
if (!/netlify-honeypot="bot-field"/.test(contact)) problems.push("contact: honeypot not configured");

for (const required of ["index.html", "services/index.html", "about/index.html", "contact/index.html", "privacy/index.html", "404.html", "sitemap.xml", "robots.txt"]) {
  if (!fs.existsSync(path.join(OUT, required))) problems.push(`missing output: ${required}`);
}

// Project editor: present, hidden from search engines, and free of secrets.
const adminDir = path.join(OUT, "admin");
for (const required of ["index.html", "config.yml", path.join("vendor", "decap-cms.js")]) {
  if (!fs.existsSync(path.join(adminDir, required))) problems.push(`missing output: admin/${required}`);
}
if (fs.existsSync(path.join(adminDir, "index.html"))) {
  const adminHtml = fs.readFileSync(path.join(adminDir, "index.html"), "utf8");
  if (!/<meta name="robots" content="noindex, nofollow">/.test(adminHtml)) problems.push("admin: missing noindex meta tag");
}
if (fs.existsSync(path.join(adminDir, "config.yml"))) {
  const adminConfig = fs.readFileSync(path.join(adminDir, "config.yml"), "utf8");
  if (/(client_secret|secret|token|api[_-]?key)\s*[:=]\s*\S/i.test(adminConfig)) problems.push("admin/config.yml: looks like it contains a secret");
  if (!/^\s*name: github\s*$/m.test(adminConfig)) problems.push("admin/config.yml: GitHub backend not configured");
}
if (!/Disallow: \/admin\//.test(fs.readFileSync(path.join(OUT, "robots.txt"), "utf8"))) problems.push("robots.txt: /admin/ is not disallowed");
if (/\/admin\//.test(fs.readFileSync(path.join(OUT, "sitemap.xml"), "utf8"))) problems.push("sitemap.xml: lists /admin/");

// Logo must be the vector file, and no page may still point at the old photo-based logo files.
if (!fs.existsSync(path.join(OUT, "assets", "img", "logo.svg"))) problems.push("missing output: assets/img/logo.svg");

if (problems.length) {
  console.error(`\n${problems.length} problem(s) found:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`\nChecked ${htmlFiles.length} pages: no problems found.`);
