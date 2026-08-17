import fs from "node:fs/promises";
import path from "node:path";
import {
  engineRoot, siteRoot, readJson, writeJson, selectPhotos, generateWithOpenAI,
  generateMockArticle, validateArticle, writeArticleFiles, updateHub,
  updateSitemap, validateGeneratedHtml
} from "./engine.mjs";

const args = new Set(process.argv.slice(2));
const countIndex = process.argv.indexOf("--count");
const count = countIndex >= 0 ? Number(process.argv[countIndex + 1]) : 1;
const mock = args.has("--mock");
const dryRun = args.has("--dry-run");
const publish = args.has("--publish");
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const config = await readJson("config.json");
const knowledge = await readJson("data/knowledge-base.json");
const library = await readJson("data/photo-library.json");
const topics = await readJson("data/topics.json");
const publishedItems = await readJson("data/published.json");
const queued = topics.filter((topic) => topic.status === "queued").slice(0, count);
if (!queued.length) throw new Error("选题库没有 queued 状态的文章。");

const manifest = new Set(["guide-assets/guides.css"]);
for (const topic of queued) {
  const photos = selectPhotos(library, topic.photoTags, 3);
  const article = mock
    ? generateMockArticle(topic)
    : await generateWithOpenAI({ topic, photos, config, knowledge });
  await validateArticle({ article, topic, photos, config, published: publishedItems });

  if (dryRun) {
    console.log(`[dry-run] 质检通过：${topic.slug}`);
    continue;
  }

  const articleFiles = await writeArticleFiles({ topic, article, photos, date: today, config });
  articleFiles.forEach((file) => manifest.add(file));
  photos.forEach((photo) => manifest.add(photo.path.replace(/^\//, "")));
  publishedItems.push({
    slug: topic.slug,
    publishedAt: today,
    categoryZh: topic.categoryZh,
    categoryEn: topic.categoryEn,
    titleZh: article.zh.title,
    titleEn: article.en.title,
    descriptionZh: article.zh.metaDescription,
    descriptionEn: article.en.metaDescription,
    heroImage: photos[0].path
  });
  topic.status = "published";
  topic.publishedAt = today;
}

if (!dryRun) {
  (await updateHub("zh", publishedItems)).forEach((file) => manifest.add(file));
  (await updateHub("en", publishedItems)).forEach((file) => manifest.add(file));
  for (const topic of queued) (await updateSitemap(topic, today)).forEach((file) => manifest.add(file));
  await validateGeneratedHtml([...manifest], siteRoot);
  await writeJson("data/topics.json", topics);
  await writeJson("data/published.json", publishedItems);
  const manifestData = { generatedAt: new Date().toISOString(), files: [...manifest].sort() };
  await fs.writeFile(path.join(engineRoot, ".publish-manifest.json"), `${JSON.stringify(manifestData, null, 2)}\n`);
  await fs.writeFile(path.join(engineRoot, ".last-generated.json"), `${JSON.stringify({ date: today, slugs: queued.map((topic) => topic.slug) }, null, 2)}\n`);
  console.log(`已生成 ${queued.length} 篇双语文章并通过质检：${queued.map((topic) => topic.slug).join(", ")}`);
  if (publish) await import("./publish.mjs");
}
