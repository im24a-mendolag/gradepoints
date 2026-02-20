/**
 * Generates PWA icons (192x192 and 512x512 PNGs) as a dark rounded square
 * with "GP" text. Run with: node scripts/generate-icons.mjs
 *
 * No dependencies — uses the Canvas API via Node's built-in support,
 * falling back to a raw PNG encoder if unavailable.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

function createPngBuffer(size) {
  const channels = 4; // RGBA
  const pixels = new Uint8Array(size * size * channels);

  const bg = [10, 10, 10]; // #0a0a0a
  const accent = [99, 102, 241]; // indigo-500
  const radius = Math.round(size * 0.18);
  const padding = Math.round(size * 0.06);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * channels;
      const inRoundedRect = isInRoundedRect(
        x,
        y,
        padding,
        padding,
        size - padding * 2,
        size - padding * 2,
        radius
      );
      if (inRoundedRect) {
        pixels[idx] = bg[0];
        pixels[idx + 1] = bg[1];
        pixels[idx + 2] = bg[2];
        pixels[idx + 3] = 255;
      } else {
        pixels[idx + 3] = 0;
      }
    }
  }

  drawText(pixels, size, "GP", accent, size);

  return encodePng(pixels, size, size);
}

function isInRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || px >= x + w || py < y || py >= y + h) return false;
  const corners = [
    [x + r, y + r],
    [x + w - r, y + r],
    [x + r, y + h - r],
    [x + w - r, y + h - r],
  ];
  for (const [cx, cy] of corners) {
    const inCornerRegion =
      (px < x + r || px >= x + w - r) && (py < y + r || py >= y + h - r);
    if (inCornerRegion) {
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy > r * r) return false;
    }
  }
  return true;
}

const FONT = {
  G: [
    "  ##### ",
    " #     #",
    "#       ",
    "#       ",
    "#  #### ",
    "#     # ",
    " #    # ",
    "  ##### ",
  ],
  P: [
    "###### ",
    "#     #",
    "#     #",
    "###### ",
    "#      ",
    "#      ",
    "#      ",
    "#      ",
  ],
};

function drawText(pixels, size, text, color, imgSize) {
  const chars = text.split("").map((c) => FONT[c]);
  if (!chars.every(Boolean)) return;

  const charW = chars[0][0].length;
  const charH = chars[0].length;
  const totalW = chars.reduce((s, c) => s + c[0].length, 0) + chars.length - 1;

  const scale = Math.floor((size * 0.55) / totalW);
  const totalPxW = totalW * scale;
  const totalPxH = charH * scale;
  const startX = Math.floor((imgSize - totalPxW) / 2);
  const startY = Math.floor((imgSize - totalPxH) / 2);

  let offsetX = 0;
  for (const charData of chars) {
    for (let row = 0; row < charH; row++) {
      for (let col = 0; col < charData[row].length; col++) {
        if (charData[row][col] !== " ") {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = startX + (offsetX + col) * scale + sx;
              const py = startY + row * scale + sy;
              if (px >= 0 && px < imgSize && py >= 0 && py < imgSize) {
                const idx = (py * imgSize + px) * 4;
                pixels[idx] = color[0];
                pixels[idx + 1] = color[1];
                pixels[idx + 2] = color[2];
                pixels[idx + 3] = 255;
              }
            }
          }
        }
      }
    }
    offsetX += charData[0].length + 1;
  }
}

function encodePng(pixels, width, height) {
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = c ^ buf[i];
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function adler32(buf) {
    let a = 1,
      b = 0;
    for (let i = 0; i < buf.length; i++) {
      a = (a + buf[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  }

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(0); // filter: none
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rawRows.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
    }
  }
  const raw = new Uint8Array(rawRows);

  const deflated = deflateRaw(raw);

  const chunks = [];

  // Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk("IHDR", ihdr));

  // IDAT
  chunks.push(makeChunk("IDAT", deflated));

  // IEND
  chunks.push(makeChunk("IEND", Buffer.alloc(0)));

  return Buffer.concat(chunks);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, "ascii");
    const crcData = Buffer.concat([typeB, Buffer.from(data)]);
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([len, typeB, Buffer.from(data), crcB]);
  }

  function deflateRaw(input) {
    const MAX_BLOCK = 65535;
    const blocks = [];

    // zlib header: CM=8, CINFO=7, FCHECK
    blocks.push(Buffer.from([0x78, 0x01]));

    for (let i = 0; i < input.length; i += MAX_BLOCK) {
      const end = Math.min(i + MAX_BLOCK, input.length);
      const block = input.slice(i, end);
      const isLast = end === input.length;

      const header = Buffer.alloc(5);
      header[0] = isLast ? 1 : 0;
      header.writeUInt16LE(block.length, 1);
      header.writeUInt16LE(block.length ^ 0xffff, 3);

      blocks.push(header);
      blocks.push(Buffer.from(block));
    }

    const adler = adler32(input);
    const adlerB = Buffer.alloc(4);
    adlerB.writeUInt32BE(adler, 0);
    blocks.push(adlerB);

    return Buffer.concat(blocks);
  }
}

for (const size of [192, 512]) {
  const buf = createPngBuffer(size);
  const path = join(publicDir, `icon-${size}.png`);
  writeFileSync(path, buf);
  console.log(`Generated ${path} (${buf.length} bytes)`);
}
