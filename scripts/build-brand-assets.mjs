// Builds the header logo, favicon, app icon, and social-share image from the original logo.
// Source file: brand-source/logo.png (transparent PNG from Justin).
// Run with: npm run brand
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "brand-source/logo.png";
const OUT = "src/assets/img";
const CHARCOAL = { r: 26, g: 26, b: 26, alpha: 1 };

await mkdir(OUT, { recursive: true });

const trimmed = await sharp(SRC).trim({ threshold: 12 }).png().toBuffer();
const meta = await sharp(trimmed).metadata();

const logoWidth = 1600;
const logo = sharp(trimmed).resize({ width: logoWidth });
await logo.clone().png().toFile(`${OUT}/logo.png`);
await logo.clone().webp({ quality: 90 }).toFile(`${OUT}/logo.webp`);
const logoMeta = await sharp(`${OUT}/logo.png`).metadata();

// The house mark is the left cluster of the artwork, before the gap in front of the wordmark.
const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const columnInk = [];
for (let x = 0; x < info.width; x += 1) {
  let ink = 0;
  for (let y = 0; y < info.height; y += 1) {
    const i = (y * info.width + x) * 4;
    if (data[i + 3] > 30 && (data[i] > 40 || data[i + 1] > 25)) ink += 1;
  }
  columnInk.push(ink);
}
let gapStart = -1;
let houseEnd = Math.round(info.width * 0.34);
for (let x = Math.round(info.width * 0.15); x < info.width; x += 1) {
  if (columnInk[x] < 8) {
    if (gapStart < 0) gapStart = x;
    if (x - gapStart > 18) {
      houseEnd = gapStart;
      break;
    }
  } else {
    gapStart = -1;
  }
}

const house = await sharp(trimmed)
  .extract({ left: 0, top: 0, width: houseEnd, height: info.height })
  .png()
  .toBuffer();
const houseMeta = await sharp(house).metadata();
const iconCanvas = Math.max(houseMeta.width, houseMeta.height) + 80;
const houseLeft = Math.round((iconCanvas - houseMeta.width) / 2);
const houseTop = Math.round((iconCanvas - houseMeta.height) / 2);
const icon = await sharp({
  create: { width: iconCanvas, height: iconCanvas, channels: 4, background: CHARCOAL },
})
  .composite([{ input: house, left: houseLeft, top: houseTop }])
  .png()
  .toBuffer();

for (const [name, size] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-512.png", 512]]) {
  await sharp(icon).resize(size, size).png().toFile(`${OUT}/${name}`);
}

const ogLogoWidth = 980;
const ogLogo = await sharp(trimmed).resize({ width: ogLogoWidth }).png().toBuffer();
const ogLogoMeta = await sharp(ogLogo).metadata();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: CHARCOAL } })
  .composite([{
    input: ogLogo,
    left: Math.round((1200 - ogLogoWidth) / 2),
    top: Math.round((630 - ogLogoMeta.height) / 2),
  }])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(`${OUT}/og-image.jpg`);

console.log(`Brand assets written to ${OUT}`);
console.log(`logo ${logoMeta.width}x${logoMeta.height}, house crop ${houseEnd}px of ${info.width}`);
