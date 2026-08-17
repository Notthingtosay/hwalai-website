import fs from "node:fs/promises";
import path from "node:path";
import OSS from "ali-oss";
import { engineRoot, siteRoot } from "./engine.mjs";

for (const name of ["ALIBABA_CLOUD_ACCESS_KEY_ID", "ALIBABA_CLOUD_ACCESS_KEY_SECRET", "OSS_REGION", "OSS_BUCKET"]) {
  if (!process.env[name]) throw new Error(`缺少环境变量 ${name}`);
}

const manifestPath = process.env.PUBLISH_MANIFEST
  ? path.resolve(engineRoot, process.env.PUBLISH_MANIFEST)
  : path.join(engineRoot, ".publish-manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error("发布清单为空。");

const client = new OSS({
  region: process.env.OSS_REGION,
  bucket: process.env.OSS_BUCKET,
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  secure: process.env.OSS_SECURE !== "false"
});

for (const relative of manifest.files) {
  const local = path.join(siteRoot, relative);
  const stat = await fs.stat(local);
  if (!stat.isFile()) continue;
  const isDocument = /\.(?:html|xml)$/i.test(relative);
  const headers = {
    "Cache-Control": isDocument ? "no-cache, max-age=0, must-revalidate" : "public, max-age=31536000, immutable"
  };
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await client.put(relative.replaceAll(path.sep, "/"), local, { headers });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1500 * (2 ** (attempt - 1))));
    }
  }
  if (lastError) throw lastError;
  console.log(`OSS 已上传：/${relative}`);
}

console.log(`发布完成：${manifest.files.length} 个文件 -> ${process.env.OSS_BUCKET}`);
