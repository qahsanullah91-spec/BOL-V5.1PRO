#!/usr/bin/env node
/**
 * Regenerates the AQ COMPANIES icon set from the master logo.
 * Source: public/images/aq-companies-logo.png (AQ monogram region, no wordmark).
 *
 * Outputs (all in public/):
 *   icon-512x512.png / icon-192x192.png      rounded navy tile + ivory disc + monogram
 *   icon-light-32x32.png / icon-dark-32x32.png
 *   icon-maskable-192x192.png / icon-maskable-512x512.png   full-bleed, safe-zone content
 *   apple-touch-icon.png (180) / apple-icon.png (180)       full-bleed (iOS rounds corners)
 *   favicon.ico (16/32/48) / app-icon.ico (16..256) / app-icon.png (512)
 *   icon.svg                                                 self-contained SVG wrapper
 *
 * Usage: node scripts/generate-brand-icons.cjs
 */
const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")
const PUBLIC = path.join(ROOT, "public")
const SRC = path.join(PUBLIC, "images", "aq-companies-logo.png")

// Brand palette (matches theme_color in layout/manifest)
const NAVY_TOP = "#1e3a8a"
const NAVY_BOTTOM = "#14275a"
const IVORY = "#faf6ec"

// Tile corner radius ratio for rounded variants (0 for full-bleed)
const RADIUS = 0.21
// Monogram width relative to tile size
const MONO_W_ROUNDED = 0.655
const MONO_W_MASKABLE = 0.56
// Ivory disc radius relative to half tile
const DISC_R_ROUNDED = 0.84
const DISC_R_MASKABLE = 0.74

function buildIco(entries) {
  // entries: [{ size, png }] -> ICO container with PNG-compressed images (Vista+)
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = 6 + 16 * entries.length
  const blobs = []
  entries.forEach((e, i) => {
    const o = i * 16
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o)
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1)
    dir.writeUInt16LE(1, o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(e.png.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += e.png.length
    blobs.push(e.png)
  })
  return Buffer.concat([header, dir, ...blobs])
}

async function extractMonogram() {
  // Top region of the master logo holds the A + globe + Q monogram; trim the rest.
  // sharp runs trim before extract within one pipeline, so crop and trim in two passes.
  const meta = await sharp(SRC).metadata()
  const cropped = await sharp(SRC)
    .extract({
      left: 0,
      top: Math.round(meta.height * 0.04),
      width: meta.width,
      height: Math.round(meta.height * 0.59),
    })
    .png()
    .toBuffer()
  return sharp(cropped).trim({ threshold: 12 }).png().toBuffer()
}

async function composeTile(size, { rounded, monogram }) {
  const r = rounded ? Math.round(size * RADIUS) : 0
  const discR = Math.round((size / 2) * (rounded ? DISC_R_ROUNDED : DISC_R_MASKABLE))
  const monoW = Math.round(size * (rounded ? MONO_W_ROUNDED : MONO_W_MASKABLE))
  const mMeta = await sharp(monogram).metadata()
  const monoH = Math.round((monoW / mMeta.width) * mMeta.height)
  const monoBuf = await sharp(monogram).resize(monoW, monoH).png().toBuffer()

  const tile = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="navy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${NAVY_TOP}"/>
          <stop offset="1" stop-color="${NAVY_BOTTOM}"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${r}" fill="url(#navy)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${discR}" fill="${IVORY}"/>
    </svg>`)

  return sharp(tile)
    .composite([
      { input: monoBuf, left: Math.round((size - monoW) / 2), top: Math.round((size - monoH) / 2) },
    ])
    .png()
    .toBuffer()
}

async function main() {
  const monogram = await extractMonogram()
  await sharp(monogram).toFile(path.join(PUBLIC, "images", "aq-monogram.png"))
  const rounded512 = await composeTile(512, { rounded: true, monogram })
  const rounded192 = await composeTile(192, { rounded: true, monogram })
  const full512 = await composeTile(512, { rounded: false, monogram })
  const full192 = await composeTile(192, { rounded: false, monogram })

  const write = (name, buf) => fs.writeFileSync(path.join(PUBLIC, name), buf)
  write("icon-512x512.png", rounded512)
  write("icon-192x192.png", rounded192)
  write("icon-light-32x32.png", await sharp(rounded512).resize(32, 32).png().toBuffer())
  write("icon-dark-32x32.png", await sharp(rounded512).resize(32, 32).png().toBuffer())
  write("icon-maskable-192x192.png", full192)
  write("icon-maskable-512x512.png", full512)
  write("apple-touch-icon.png", await sharp(full512).resize(180, 180).png().toBuffer())
  write("apple-icon.png", await sharp(full512).resize(180, 180).png().toBuffer())
  write("app-icon.png", rounded512)
  write("favicon.ico", buildIco(
    await Promise.all([16, 32, 48].map(async (s) => ({ size: s, png: await sharp(rounded512).resize(s, s).png().toBuffer() })))
  ))
  write("app-icon.ico", buildIco(
    await Promise.all([16, 32, 48, 64, 128, 256].map(async (s) => ({ size: s, png: await sharp(rounded512).resize(s, s).png().toBuffer() })))
  ))

  const svgPng = await sharp(rounded192).png().toBuffer()
  const svg = `<svg width="180" height="180" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <image width="192" height="192" href="data:image/png;base64,${svgPng.toString("base64")}"/>
</svg>`
  write("icon.svg", svg)

  console.log("Brand icon set regenerated from", path.relative(ROOT, SRC))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
