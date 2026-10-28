#!/usr/bin/env node
// Build the method-only GitHub template without copying the kit's development repository.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { install } from "../plugin/install.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function makeStarter(target) {
  const root = path.resolve(target);
  if (fs.existsSync(root) && (!fs.lstatSync(root).isDirectory() || fs.readdirSync(root).length)) {
    throw new Error(`Refusing: ${root} exists and is not an empty directory.`);
  }
  const readme = fs.readFileSync(path.join(HERE, "starter", "README.md"), "utf8").replace(/\r\n/g, "\n");
  const license = fs.readFileSync(path.join(HERE, "..", "LICENSE"), "utf8").replace(/\r\n/g, "\n");
  fs.mkdirSync(root, { recursive: true });
  const code = install(root, { level: 1 });
  if (code !== 0) throw new Error(`Starter installation failed with exit ${code}.`);
  fs.writeFileSync(path.join(root, "README.md"), readme);
  fs.writeFileSync(path.join(root, ".github", "GOLDEN-PATH-LICENSE"), license);
  return root;
}

export function main(argv) {
  if (argv.length !== 1 || argv[0].startsWith("-")) {
    console.error("usage: node examples/make-starter.mjs <empty-target-directory>");
    return 64;
  }
  try {
    const root = makeStarter(argv[0]);
    console.log(`Starter ready at ${root}. Method only; no automatic checks or protected acceptance.`);
    console.log("Review the files before publishing. GitHub template and review settings are not configured.");
    return 0;
  } catch (e) {
    console.error(e.message);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2));
}
