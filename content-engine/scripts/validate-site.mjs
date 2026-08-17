import fs from "node:fs/promises";
import path from "node:path";
import { siteRoot, readJson, validateGeneratedHtml } from "./engine.mjs";

const published = await readJson("data/published.json");
const files = ["zh-hk/guides/index.html", "en-gb/guides/index.html"];
for (const item of published) {
  files.push(`zh-hk/guides/${item.slug}/index.html`, `en-gb/guides/${item.slug}/index.html`);
}
for (const file of files) await fs.access(path.join(siteRoot, file));
await validateGeneratedHtml(files, siteRoot);
console.log(`网站文章检查通过：${published.length} 个主题，${files.length} 个页面。`);
