import { readFile, mkdir, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname } from "node:path";

const images = JSON.parse(await readFile(new URL("../assets/images.json", import.meta.url), "utf8"));

function encode(source, destination, width) {
  const args = ["-quiet", "-q", "84", "-m", "6"];
  if (width) args.push("-resize", String(width), "0");
  args.push(source, "-o", destination);
  return new Promise((resolve, reject) => {
    const process = spawn("cwebp", args, { stdio: "inherit" });
    process.on("error", reject);
    process.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`cwebp failed for ${source}: ${code}`)));
  });
}

let originalBytes = 0;
let optimizedBytes = 0;
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < images.length) {
    const item = images[cursor++];
    await mkdir(dirname(item.optimized), { recursive: true });
    await encode(item.source, item.optimized);
    await encode(item.source, item.small, 640);
    originalBytes += (await stat(item.source)).size;
    optimizedBytes += (await stat(item.optimized)).size;
  }
}));
console.log(`${images.length} photos: ${(originalBytes / 1e6).toFixed(2)} MB → ${(optimizedBytes / 1e6).toFixed(2)} MB (${(100 - optimizedBytes / originalBytes * 100).toFixed(1)}% smaller).`);
