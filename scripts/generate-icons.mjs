import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const source = join(root, "src", "app", "favicon.ico");

for (const size of [192, 512]) {
  const out = join(root, "public", `icon-${size}.png`);
  await sharp(source).resize(size, size).png().toFile(out);
  console.log(`Generated ${out} (${size}x${size})`);
}
