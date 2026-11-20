import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, "../web/dist");
const destination = path.resolve(here, "web-dist");

if (!existsSync(path.join(source, "index.html"))) {
  throw new Error(`Web build not found at ${source}; build packages/web first.`);
}

rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });
console.log(`Copied Web build to ${destination}`);
