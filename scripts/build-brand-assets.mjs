// Regenerates the vector logo, favicon, app icons, and social-share image.
// Run with: npm run brand
//
// The logo is drawn as clean vector shapes (house mark + J-DUB / REMODELING LLC set in Oswald Bold)
// in the brand's copper, charcoal, and silver. brand-source/logo.jpg is a photo of a printed card and
// is kept only as a reference for the design; replace this drawing with the owner's original logo
// file (vector or high-resolution PNG) when one is available.
import sharp from "sharp";
import opentype from "opentype.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const OUT = "src/assets/img";
const FONT = "node_modules/@fontsource/oswald/files/oswald-latin-700-normal.woff";

const COPPER = "#e0832b";
const SILVER = "#d4d7db";
const CHARCOAL = "#1a1a1a";

await mkdir(OUT, { recursive: true });
const fontFile = await readFile(FONT);
const font = opentype.parse(fontFile.buffer.slice(fontFile.byteOffset, fontFile.byteOffset + fontFile.byteLength));
const upm = font.unitsPerEm;
const capHeight = font.charToGlyph("H").getBoundingBox().y2 / upm;

// Lay out a string with optional extra tracking; returns SVG path data and the total width.
function setText(text, x, baseline, size, tracking = 0) {
  let cursor = x;
  const parts = [];
  for (const char of text) {
    const glyph = font.charToGlyph(char);
    parts.push(glyph.getPath(cursor, baseline, size).toPathData(2));
    cursor += (glyph.advanceWidth / upm) * size + tracking;
  }
  return { d: parts.join(" "), width: cursor - tracking - x };
}
const naturalWidth = (text, size) =>
  [...text].reduce((sum, char) => sum + (font.charToGlyph(char).advanceWidth / upm) * size, 0);

// House mark, drawn in an 88 x 96 box.
const MARK_W = 88;
const MARK_H = 96;
const mark = `
  <path d="M7 92V46L44 9l37 37v46" fill="none" stroke="${COPPER}" stroke-width="8" stroke-linejoin="miter" stroke-miterlimit="6"/>
  <rect x="58" y="12" width="12" height="24" fill="${COPPER}"/>
  <path d="M20 52l24-24 24 24" fill="none" stroke="${SILVER}" stroke-width="3"/>
  <rect x="34" y="62" width="20" height="30" fill="${COPPER}"/>
  <path d="M0 93h88" fill="none" stroke="${SILVER}" stroke-width="3"/>`;

// Wordmark, sized so its two lines are exactly as tall as the mark.
const line1Cap = 56;
const line2Cap = 20;
const gap = MARK_H - line1Cap - line2Cap;
const size1 = line1Cap / capHeight;
const size2 = line2Cap / capHeight;
const textX = MARK_W + 26;

// The small offset keeps opentype.js from emitting NaN for points that land exactly on y = 0.
const base1 = line1Cap + 0.01;
const base2 = MARK_H;
const line1 = setText("J-DUB", textX, base1, size1, 3);
const text2 = "REMODELING LLC";
const tracking2 = (line1.width - naturalWidth(text2, size2)) / (text2.length - 1);
const line2 = setText(text2, textX, base2, size2, tracking2);

const width = Math.ceil(textX + line1.width);
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${MARK_H}" width="${width}" height="${MARK_H}" role="img" aria-label="J-Dub Remodeling LLC">
  ${mark}
  <path d="${line1.d}" fill="${SILVER}"/>
  <path d="${line2.d}" fill="${COPPER}"/>
</svg>
`;
await writeFile(`${OUT}/logo.svg`, logoSvg);

// Square icon: the house mark on charcoal.
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">
  <rect width="120" height="120" rx="20" fill="${CHARCOAL}"/>
  <g transform="translate(16 12)">${mark}</g>
</svg>`;
for (const [name, size] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-512.png", 512]]) {
  await sharp(Buffer.from(iconSvg(size)), { density: Math.max(72, Math.round((size / 120) * 72 * 4)) })
    .resize(size, size)
    .png()
    .toFile(`${OUT}/${name}`);
}

// Social-share image: the logo centered on charcoal.
const ogLogoWidth = 960;
const ogLogo = await sharp(Buffer.from(logoSvg), { density: 300 }).resize({ width: ogLogoWidth }).png().toBuffer();
const ogLogoHeight = (await sharp(ogLogo).metadata()).height;
await sharp({ create: { width: 1200, height: 630, channels: 4, background: CHARCOAL } })
  .composite([{ input: ogLogo, left: Math.round((1200 - ogLogoWidth) / 2), top: Math.round((630 - ogLogoHeight) / 2) }])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(`${OUT}/og-image.jpg`);

console.log(`Brand assets written to ${OUT} (logo ${width}x${MARK_H}, cap height ${capHeight.toFixed(3)} em)`);
