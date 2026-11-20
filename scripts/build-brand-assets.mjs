// Regenerates logo, favicon, and social-share images from brand-source/logo.jpg.
// Run with: npm run brand
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "brand-source/logo.jpg";
const OUT = "src/assets/img";
const CHARCOAL = { r: 26, g: 26, b: 26, alpha: 1 };

await mkdir(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();

// Trim the thin strip of card border along the top edge of the source photo.
const logo = sharp(SRC).extract({ left: 0, top: 6, width: meta.width, height: meta.height - 6 });
const logoBuffer = await logo.toBuffer();

for (const width of [360, 720, 1080]) {
  await sharp(logoBuffer).resize({ width }).webp({ quality: 82 }).toFile(`${OUT}/logo-${width}.webp`);
  await sharp(logoBuffer).resize({ width }).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/logo-${width}.jpg`);
}

// House mark from the left side of the logo, used for the favicon and app icon.
const markSize = 340;
const mark = await sharp(SRC)
  .extract({ left: 22, top: 16, width: markSize, height: markSize })
  .toBuffer();

await sharp(mark).resize(32, 32).png().toFile(`${OUT}/favicon-32.png`);
await sharp(mark).resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`);
await sharp(mark).resize(512, 512).png().toFile(`${OUT}/icon-512.png`);

// Social-share image: logo centered on charcoal.
const ogLogo = await sharp(logoBuffer).resize({ width: 1040 }).toBuffer();
const ogLogoMeta = await sharp(ogLogo).metadata();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: CHARCOAL } })
  .composite([{ input: ogLogo, left: 80, top: Math.round((630 - ogLogoMeta.height) / 2) }])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(`${OUT}/og-image.jpg`);

console.log("Brand assets written to", OUT);
