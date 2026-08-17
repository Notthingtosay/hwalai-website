import OSS from "ali-oss";

for (const name of ["ALIBABA_CLOUD_ACCESS_KEY_ID", "ALIBABA_CLOUD_ACCESS_KEY_SECRET", "OSS_REGION", "OSS_BUCKET"]) {
  if (!process.env[name]) throw new Error(`缺少环境变量 ${name}`);
}

const client = new OSS({
  region: process.env.OSS_REGION,
  bucket: process.env.OSS_BUCKET,
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  secure: process.env.OSS_SECURE !== "false"
});

await client.put(
  "automation-health/write-check.txt",
  Buffer.from("Hwa Lai content publisher write check. No credentials are stored here.\n"),
  { headers: { "Cache-Control": "no-store" } }
);

console.log("OSS 写入权限预检通过。");
