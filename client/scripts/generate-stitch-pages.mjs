import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import HTMLtoJSX from "htmltojsx";

const root = process.cwd();
const htmlDir = path.join(root, "..", "frontendhtml");
const outDir = path.join(root, "src", "pages", "stitch-generated");

fs.mkdirSync(outDir, { recursive: true });

const htmlFiles = fs
  .readdirSync(htmlDir)
  .filter((f) => f.toLowerCase().endsWith(".html"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const exports = [];
const routes = [];
const converter = new HTMLtoJSX({ createClass: false });

function indentBlock(input, spaces = 2) {
  const pad = " ".repeat(spaces);
  return input
    .split("\n")
    .map((line) => `${pad}${line}`)
    .join("\n");
}

for (const file of htmlFiles) {
  const fullPath = path.join(htmlDir, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  const $ = load(raw, { decodeEntities: false });
  const base = file.replace(/\.html$/i, "");
  const clean = base.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const id = (base.match(/^(\d+)/) || [null, "0"])[1];
  const compName = `StitchScreen${id.padStart(2, "0")}`;
  const title = clean || compName;
  const jsxPath = path.join(outDir, `${compName}.jsx`);

  const body = $("body");
  const bodyClass = body.attr("class") || "";
  const bodyStyle = body.attr("style");
  const contentHtml = body.length ? body.html() || "" : $.root().html() || "";
  const wrapperOpen = bodyStyle
    ? `<div class="${bodyClass}" style="${bodyStyle}" data-screen-title="${title}">`
    : `<div class="${bodyClass}" data-screen-title="${title}">`;
  const wrappedHtml = `${wrapperOpen}${contentHtml}</div>`;
  const jsxMarkup = converter.convert(wrappedHtml);

  const componentSource = `export default function ${compName}() {
  return (
${indentBlock(jsxMarkup, 4)}
  );
}
`;

  fs.writeFileSync(jsxPath, componentSource, "utf8");
  exports.push(`export { default as ${compName} } from "./${compName}";`);
  routes.push(`  { id: "${id}", path: "/screen/${Number(id)}", component: ${compName}, title: ${JSON.stringify(title)} },`);
}

fs.writeFileSync(path.join(outDir, "index.js"), `${exports.join("\n")}\n`, "utf8");

const routeImports = htmlFiles
  .map((file) => {
    const id = ((file.match(/^(\d+)/) || [null, "0"])[1] || "0").padStart(2, "0");
    return `import { StitchScreen${id} } from "./index";`;
  })
  .join("\n");

const routeSource = `${routeImports}

export const stitchScreens = [
${routes.join("\n")}
];
`;

fs.writeFileSync(path.join(outDir, "routes.js"), routeSource, "utf8");

console.log(`Generated ${htmlFiles.length} stitch page components in ${outDir}`);
