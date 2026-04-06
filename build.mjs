import esbuild from "esbuild";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

const outdir = resolve("dist");

mkdirSync(outdir, { recursive: true });

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: resolve(outdir, "main.js"),
  format: "cjs",
  platform: "node",
  target: "es2020",
  external: ["obsidian", "electron"],
  sourcemap: false,
  logLevel: "info",
});

if (existsSync("manifest.json")) {
  copyFileSync("manifest.json", resolve(outdir, "manifest.json"));
}