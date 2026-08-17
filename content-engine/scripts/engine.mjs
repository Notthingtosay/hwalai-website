import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const engineRoot = path.resolve(here, "..");
export const siteRoot = path.resolve(engineRoot, "..");

export async function readJson(file) {
  return JSON.parse(await fs.readFile(path.resolve(engineRoot, file), "utf8"));
}

export async function writeJson(file, value) {
  await fs.writeFile(path.resolve(engineRoot, file), `${JSON.stringify(value, null, 2)}\n`);
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function stripTags(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function selectPhotos(library, tags, count = 3) {
  const scored = library.map((photo, order) => ({
    ...photo,
    score: photo.tags.filter((tag) => tags.includes(tag)).length,
    order
  }));
  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, count)
    .map(({ score, order, ...photo }) => photo);
}

export const articleSchema = {
  type: "object",
  additionalProperties: false,
  required: ["zh", "en"],
  properties: {
    zh: languageSchema(),
    en: languageSchema()
  }
};

function languageSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title", "metaDescription", "kicker", "lead", "answerLabel",
      "answerHeadline", "answerCopy", "intro", "sections", "faqs",
      "ctaTitle", "ctaCopy", "imageCaptions"
    ],
    properties: {
      title: { type: "string" },
      metaDescription: { type: "string" },
      kicker: { type: "string" },
      lead: { type: "string" },
      answerLabel: { type: "string" },
      answerHeadline: { type: "string" },
      answerCopy: { type: "string" },
      intro: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "heading", "paragraphs", "bullets", "note"],
          properties: {
            id: { type: "string" },
            heading: { type: "string" },
            paragraphs: { type: "array", items: { type: "string" } },
            bullets: { type: "array", items: { type: "string" } },
            note: { type: "string" }
          }
        }
      },
      faqs: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" }
          }
        }
      },
      ctaTitle: { type: "string" },
      ctaCopy: { type: "string" },
      imageCaptions: { type: "array", items: { type: "string" } }
    }
  };
}

function truncateMetadata(value, maximumLength) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maximumLength) return clean;
  const clipped = clean.slice(0, maximumLength - 1);
  const wordBoundary = clipped.lastIndexOf(" ");
  const shortened = wordBoundary >= Math.floor(maximumLength * 0.65)
    ? clipped.slice(0, wordBoundary)
    : clipped;
  return `${shortened.replace(/[,:;，、；：\s]+$/u, "")}…`;
}

export async function generateWithOpenAI({ topic, photos, config, knowledge }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("缺少 OPENAI_API_KEY。可使用 --mock 检查流程，或在环境变量中配置密钥。");
  }

  const system = [
    "You are the bilingual technical editor for Hwa Lai Engineering, a Hong Kong automatic-door contractor.",
    "Return JSON only through the supplied schema. Write one useful Traditional Chinese article and one natural British English adaptation.",
    "Do not use HTML in any field. Do not invent projects, customers, addresses, certifications, law numbers, performance figures or prices.",
    "Use Hong Kong Traditional Chinese vocabulary. Be practical, calm and specific. Avoid generic AI phrasing and excessive marketing language.",
    "Each language must contain at least 5 sections and 3 FAQs. Each section should normally have 2 substantial paragraphs.",
    "Keep each title within 60 characters and each meta description within 150 characters, including spaces and punctuation.",
    "End with a low-pressure WhatsApp photo enquiry. Do not mention cost, price, quote or fees.",
    `Editorial policy: ${knowledge.editorialPolicy.join(" | ")}`,
    `Approved engineering facts: ${knowledge.approvedFacts.join(" | ")}`
  ].join("\n");

  const user = JSON.stringify({
    topic,
    availablePhotos: photos.map((photo) => ({ path: photo.path, tags: photo.tags })),
    requiredChineseCharacters: config.minimumChineseCharacters,
    requiredEnglishWords: config.minimumEnglishWords,
    note: "Image captions must describe the visible engineering subject without claiming a specific client or site."
  });

  const apiBaseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1")
    .replace(/\/+$/, "");
  const aiClient = process.env.AI_CLIENT
    || (apiBaseUrl === "https://api.openai.com/v1" ? "responses" : "codex");
  let article;
  if (aiClient === "codex") {
    article = await generateWithCodexCli({ system, user, config, apiBaseUrl });
  } else if (aiClient === "responses") {
    article = await generateWithResponsesApi({ system, user, config, apiBaseUrl });
  } else {
    throw new Error(`不支持的 AI_CLIENT：${aiClient}`);
  }
  for (const copy of Object.values(article)) {
    copy.metaDescription = truncateMetadata(copy.metaDescription, config.maximumDescriptionCharacters);
  }
  return article;
}

async function generateWithCodexCli({ system, user, config, apiBaseUrl }) {
  const temporaryHome = await fs.mkdtemp(path.join(os.tmpdir(), "hwalai-codex-"));
  const schemaFile = path.join(temporaryHome, "article-schema.json");
  const outputFile = path.join(temporaryHome, "article.json");
  const model = process.env.OPENAI_MODEL || config.model;
  const codexExecutable = process.env.CODEX_BIN
    || path.join(engineRoot, "node_modules", ".bin", process.platform === "win32" ? "codex.cmd" : "codex");
  const prompt = [
    system,
    "Do not inspect files, run shell commands or call tools. Produce the final JSON immediately.",
    `The English prose across intro, section paragraphs and FAQ answers MUST exceed ${config.minimumEnglishWords} words; target at least ${config.minimumEnglishWords + 150} words.`,
    `The Traditional Chinese prose across the same fields MUST exceed ${config.minimumChineseCharacters} non-space characters; target at least ${config.minimumChineseCharacters + 300} characters.`,
    `Article brief: ${user}`
  ].join("\n\n");

  try {
    await fs.writeFile(
      path.join(temporaryHome, "config.toml"),
      [
        "disable_response_storage = true",
        `model = ${JSON.stringify(model)}`,
        'model_provider = "packycode"',
        'model_reasoning_effort = "high"',
        "",
        "[model_providers.packycode]",
        'name = "packycode"',
        `base_url = ${JSON.stringify(apiBaseUrl)}`,
        'wire_api = "responses"',
        "requires_openai_auth = true",
        ""
      ].join("\n"),
      { mode: 0o600 }
    );
    await fs.writeFile(
      path.join(temporaryHome, "auth.json"),
      `${JSON.stringify({ OPENAI_API_KEY: process.env.OPENAI_API_KEY })}\n`,
      { mode: 0o600 }
    );
    await fs.writeFile(schemaFile, `${JSON.stringify(articleSchema, null, 2)}\n`, { mode: 0o600 });

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const retryInstruction = attempt === 1
        ? ""
        : "\n\nThe previous draft was too short. Rewrite the complete article with fuller, non-repetitive technical explanations and comfortably exceed both minimum lengths.";
      const result = await runProcess(codexExecutable, [
        "exec",
        "--ephemeral",
        "--skip-git-repo-check",
        "--sandbox", "read-only",
        "--output-schema", schemaFile,
        "--output-last-message", outputFile,
        "--color", "never",
        "-"
      ], {
        cwd: temporaryHome,
        env: { ...process.env, CODEX_HOME: temporaryHome, NO_COLOR: "1" },
        input: `${prompt}${retryInstruction}`
      });
      if (result.code !== 0) {
        const safeError = `${result.stderr}\n${result.stdout}`
          .replaceAll(process.env.OPENAI_API_KEY, "***")
          .trim()
          .slice(-5000);
        throw new Error(`Codex CLI 生成失败（exit ${result.code}）：${safeError}`);
      }
      const outputText = (await fs.readFile(outputFile, "utf8")).trim();
      if (!outputText) throw new Error("Codex CLI 没有返回文章正文。");
      const article = JSON.parse(outputText);
      const lengths = articleProseLengths(article);
      if (
        lengths.zh >= config.minimumChineseCharacters
        && lengths.en >= config.minimumEnglishWords
      ) return article;
      if (attempt === 2) return article;
    }
  } finally {
    await fs.rm(temporaryHome, { recursive: true, force: true });
  }
}

function articleProseLengths(article) {
  const prose = (copy) => [
    copy?.intro,
    ...(copy?.sections || []).flatMap((section) => section.paragraphs || []),
    ...(copy?.faqs || []).map((faq) => faq.answer)
  ].filter(Boolean).join(" ");
  return {
    zh: prose(article.zh).replace(/\s/g, "").length,
    en: prose(article.en).trim().split(/\s+/).filter(Boolean).length
  };
}

function runProcess(command, args, { cwd, env, input }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}

async function generateWithResponsesApi({ system, user, config, apiBaseUrl }) {

  const requestBody = JSON.stringify({
    model: process.env.OPENAI_MODEL || config.model,
    input: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "hwalai_bilingual_article",
        strict: true,
        schema: articleSchema
      }
    }
  });
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(`${apiBaseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: requestBody
    });
    if (response.ok || (response.status !== 429 && response.status < 500) || attempt === 3) break;
    await new Promise((resolve) => setTimeout(resolve, 1500 * (2 ** (attempt - 1))));
  }
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`AI API ${response.status}: ${payload?.error?.message || JSON.stringify(payload)}`);
  }
  if (payload.status !== "completed") {
    throw new Error(`文章生成未完成：${payload.status || "unknown"}`);
  }
  const refusal = payload.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === "refusal");
  if (refusal) throw new Error(`模型拒绝生成：${refusal.refusal}`);
  const outputText = payload.output_text || payload.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === "output_text")?.text;
  if (!outputText) throw new Error("AI API 没有返回文章正文。");
  return JSON.parse(outputText);
}

export function generateMockArticle(topic) {
  const zhCore = [
    "先不要急着拆机或反复切断电源。自动门的表现通常同时受到感应范围、门扇阻力、路轨状态、控制设定和现场环境影响。由简单而安全的项目开始检查，可以减少误判，也方便工程人员根据相片和短片作初步分析。",
    "检查时应保持入口有人看管，避免让顾客、小童或推车进入门扇活动范围。若门体松动、玻璃受损、出现焦味或异常撞击声，应停止使用并安排现场检查，不应自行调整承重和安全部件。"
  ];
  const enCore = [
    "Do not begin by dismantling the operator or repeatedly cycling the power. Automatic-door behaviour can be affected by the detection field, resistance at the moving panels, the condition of the rail, control settings and the surrounding environment. Starting with safe, visible checks reduces misdiagnosis and gives an engineer better information for an initial remote assessment.",
    "Keep the entrance supervised while checking it and prevent customers, children or trolleys from entering the moving area. Stop using the door if a panel is loose, glass is damaged, there is a burning smell or the door strikes the frame. Load-bearing and safety components should be inspected on site rather than adjusted without the correct information."
  ];
  const zhSections = [
    ["先確認現象，而不是先猜零件", "記錄問題在甚麼時間、哪個方向及哪種使用情況出現。", "同一個現象可能由不同位置引起，先留下短片和聲音比單靠描述更有效。"],
    ["可以安全查看的幾個位置", "查看感應器表面是否被膠紙、塵埃或裝飾物遮擋，再觀察門口附近是否有會擺動的植物、旗幟或反光物。", "保持路軌和門扇行程附近沒有雜物，但不要拆開飾蓋或觸碰帶電組件。"],
    ["甚麼時候應該停止使用", "若門扇碰撞、玻璃或五金鬆動、運行忽快忽慢，應先限制通行。", "涉及安全感應、門體承重或電氣異常時，遙距建議只能作初步分流，仍要由工程人員現場確認。"],
    ["傳給工程人員的資料", "拍攝入口正面、門頂門機位置、感應器、控制器指示燈和門機標籤。", "再錄製一次完整開門和關門過程，保留現場聲音，並說明問題是否間歇出現。"],
    ["修復後要怎樣確認", "完成處理後應在有人看管的情況下反覆測試不同進出方向。", "除了門能開關，還要確認感應覆蓋、關門速度、門扇停止與重新開啟的反應。"]
  ].map(([heading, a, b], index) => ({ id: `section-${index + 1}`, heading, paragraphs: [a + zhCore[0], b + zhCore[1]], bullets: [], note: index === 3 ? "相片愈清楚，初步判斷通常愈有效；但不要為了拍攝而站在門扇活動範圍內。" : "" }));
  const enSections = [
    ["Confirm the symptom before guessing the part", "Record when the issue occurs, which direction is affected and what the entrance is doing at the time.", "A short video with sound often provides more useful evidence than a general description."],
    ["Safe visual checks", "Check whether dust, tape or decorations are covering a sensor and look for moving plants, banners or reflective objects near the entrance.", "Keep the panel travel and threshold clear, but do not remove covers or touch live components."],
    ["When the entrance should be taken out of service", "Restrict access if a panel strikes the frame, hardware becomes loose or movement becomes unpredictable.", "Safety sensing, load-bearing parts and electrical faults require an on-site assessment."],
    ["Information to send to an engineer", "Photograph the complete entrance, operator head, sensors, indicator lights and equipment label.", "Film one complete opening and closing cycle with sound, and explain whether the fault is intermittent."],
    ["Checks after the issue has been addressed", "Test the entrance from different approach directions while the area is supervised.", "Confirm detection coverage, closing speed and safety reversal rather than checking only that the panels move."]
  ].map(([heading, a, b], index) => ({ id: `section-${index + 1}`, heading, paragraphs: [`${a} ${enCore[0]} ${a} ${enCore[1]}`, `${b} ${enCore[0]} ${b} ${enCore[1]}`], bullets: [], note: index === 3 ? "Clear photographs help an initial assessment, but never stand inside the panel travel area to obtain them." : "" }));

  return {
    zh: {
      title: topic.titleZh,
      metaDescription: `${topic.titleZh}華麗工程整理安全檢查次序、常見現場因素及聯絡工程人員前應準備的資料。`.slice(0, 150),
      kicker: topic.categoryZh,
      lead: "由安全、可見的項目開始檢查，先記錄現象，再判斷是否需要現場處理。",
      answerLabel: "先做安全分流",
      answerHeadline: "觀察 × 記錄 × 停用 × 檢查",
      answerCopy: "清楚記錄門扇、感應器和控制狀態，可以讓後續判斷更快、更準確。",
      intro: `${topic.titleZh}這類問題不應只靠猜測某個零件。${zhCore.join("")}`,
      sections: zhSections,
      faqs: [
        { question: "可以自行重新啟動自動門嗎？", answer: "在門體、玻璃和電源外觀正常，而且入口已清空的情況下，可按設備指引作一次基本重啟；若問題重現便應停止反覆操作。" },
        { question: "只傳相片可以判斷故障嗎？", answer: "相片和短片有助初步分流，但涉及承重、安全感應和電氣問題，仍需要按現場情況確認。" },
        { question: "故障只是偶爾出現，需要處理嗎？", answer: "需要記錄。間歇問題可能與人流、光線、風、門體阻力或接線有關，保留出現時間和影片最有幫助。" }
      ],
      ctaTitle: "需要協助判斷入口狀況？",
      ctaCopy: "把入口全景、門機標籤和一段包含聲音的開關門短片傳到 WhatsApp，工程人員可先協助分流。",
      imageCaptions: ["入口全景有助了解門體、通行方向和周邊環境。", "門機和路軌位置需要按門扇重量、運行狀態及維修空間一起檢查。", "控制和感應部件的狀態是初步判斷的重要資料。"]
    },
    en: {
      title: topic.titleEn,
      metaDescription: `${topic.titleEn}. Safe checks, common site factors and the information to prepare before contacting an engineer.`.slice(0, 150),
      kicker: topic.categoryEn,
      lead: "Begin with safe, visible checks, record the behaviour and decide whether the entrance should remain in use.",
      answerLabel: "Start with safe triage",
      answerHeadline: "Observe × Record × Stop × Inspect",
      answerCopy: "Clear evidence of the panels, sensors and controls makes the next assessment faster and more useful.",
      intro: `${topic.titleEn} should not be approached by guessing a single failed part. ${enCore.join(" ")}`,
      sections: enSections,
      faqs: [
        { question: "Can I restart the automatic door myself?", answer: "A single basic restart may be reasonable if the door, glass and visible power supply appear normal and the entrance is clear. Stop repeated cycling if the problem returns." },
        { question: "Can a fault be diagnosed from photographs alone?", answer: "Photographs and a short video help with initial triage, but load-bearing, safety-sensor and electrical issues still need to be confirmed for the actual site." },
        { question: "Does an intermittent fault need attention?", answer: "Yes. It may relate to traffic, light, wind, panel resistance or wiring. Record the time and keep a video of the behaviour if possible." }
      ],
      ctaTitle: "Need help assessing the entrance?",
      ctaCopy: "Send a full entrance photograph, the operator label and a short opening-and-closing video with sound on WhatsApp for initial triage.",
      imageCaptions: ["A full entrance view helps show the panels, traffic direction and surrounding conditions.", "The operator and rail should be assessed together with panel weight, movement and future service access.", "The visible state of control and sensing components helps an initial assessment."]
    }
  };
}

export async function validateArticle({ article, topic, photos, config, published, root = siteRoot }) {
  const errors = [];
  for (const [locale, copy] of Object.entries(article)) {
    if (!copy?.title || !copy?.metaDescription || !copy?.intro) errors.push(`${locale}: 缺少必要字段`);
    if ((copy?.title?.length || 0) > config.maximumTitleCharacters) errors.push(`${locale}: 标题长于 ${config.maximumTitleCharacters} 个字符`);
    if ((copy?.sections?.length || 0) < config.minimumSections) errors.push(`${locale}: 正文小节少于 ${config.minimumSections}`);
    if ((copy?.faqs?.length || 0) < config.minimumFaqs) errors.push(`${locale}: FAQ 少于 ${config.minimumFaqs}`);
    if ((copy?.imageCaptions?.length || 0) < photos.length) errors.push(`${locale}: 图片说明不足`);
    if ((copy?.metaDescription?.length || 0) > config.maximumDescriptionCharacters) errors.push(`${locale}: meta description 过长`);
    const fullText = JSON.stringify(copy).toLowerCase();
    for (const phrase of config.bannedPhrases) {
      if (fullText.includes(phrase.toLowerCase())) errors.push(`${locale}: 出现禁用承诺“${phrase}”`);
    }
    if (!config.priceContentEnabled) {
      for (const term of config.priceTerms) {
        const re = new RegExp(locale === "en" ? `\\b${term.toLowerCase()}\\b` : term, "i");
        if (re.test(fullText)) errors.push(`${locale}: 价格内容未启用，但出现“${term}”`);
      }
    }
    const text = [copy.intro, ...copy.sections.flatMap((section) => section.paragraphs), ...copy.faqs.map((faq) => faq.answer)].join(" ");
    if (locale === "zh" && text.replace(/\s/g, "").length < config.minimumChineseCharacters) errors.push(`zh: 正文字数不足 ${config.minimumChineseCharacters}`);
    if (locale === "en" && text.split(/\s+/).length < config.minimumEnglishWords) errors.push(`en: 正文词数不足 ${config.minimumEnglishWords}`);
  }
  if (published.some((item) => item.slug === topic.slug)) errors.push(`slug 已发布：${topic.slug}`);
  if (published.some((item) => item.titleZh === article.zh.title || item.titleEn === article.en.title)) errors.push("标题与已发布文章重复");
  for (const item of published) {
    if (titleSimilarity(item.titleZh, article.zh.title) > 0.82 || titleSimilarity(item.titleEn, article.en.title) > 0.82) {
      errors.push(`标题与已发布主题过于相似：${item.slug}`);
    }
  }
  for (const photo of photos) {
    try {
      await fs.access(path.resolve(root, `.${photo.path}`));
    } catch {
      errors.push(`图片不存在：${photo.path}`);
    }
  }
  if (errors.length) throw new Error(`文章质检未通过：\n- ${[...new Set(errors)].join("\n- ")}`);
}

function titleSimilarity(a = "", b = "") {
  const normalize = (value) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const grams = (value) => {
    const clean = normalize(value);
    if (clean.length < 2) return new Set([clean]);
    return new Set(Array.from({ length: clean.length - 1 }, (_, index) => clean.slice(index, index + 2)));
  };
  const left = grams(a);
  const right = grams(b);
  const intersection = [...left].filter((value) => right.has(value)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function localeSettings(locale) {
  return locale === "zh" ? {
    htmlLang: "zh-HK", dir: "zh-hk", otherDir: "en-gb", otherLang: "en-GB", currentLang: "繁", otherLabel: "EN",
    home: "首頁", guides: "自動門指南", navProducts: "產品與服務", navCases: "工程案例", navEstimator: "即時預算", navContact: "聯絡我們",
    prepared: "華麗工程技術團隊整理", updated: "更新", minutes: "分鐘閱讀", contents: "文章內容", faq: "常見問題",
    ctaButton: "WhatsApp 傳送相片", servicesButton: "了解自動門服務", explore: "了解服務", start: "開始查詢",
    footerText: "香港自動門設計、安裝、保養與故障支援。", copyright: "版權所有 2026 華麗工程",
    brand: "華麗工程", brandSmall: "HWA LAI ENGINEERING", brandAlt: "華麗工程標誌"
  } : {
    htmlLang: "en-GB", dir: "en-gb", otherDir: "zh-hk", otherLang: "zh-HK", currentLang: "EN", otherLabel: "繁",
    home: "Home", guides: "Guides", navProducts: "Products & Services", navCases: "Case Studies", navEstimator: "Instant Estimate", navContact: "Contact",
    prepared: "Prepared by Hwa Lai Engineering", updated: "Updated", minutes: "minute read", contents: "In this guide", faq: "Common questions",
    ctaButton: "Send photos on WhatsApp", servicesButton: "Explore automatic door services", explore: "Explore", start: "Start here",
    footerText: "Automatic door design, installation, maintenance and repair support in Hong Kong.", copyright: "© 2026 Hwa Lai Engineering",
    brand: "Hwa Lai", brandSmall: "ENGINEERING", brandAlt: "Hwa Lai Engineering logo"
  };
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function renderSections(copy, photos, locale) {
  const imagePositions = new Map([[0, 0], [2, 1], [4, 2]]);
  return copy.sections.map((section, index) => {
    const photoIndex = imagePositions.get(index);
    const figure = photoIndex === undefined || !photos[photoIndex] ? "" : renderFigure(photos[photoIndex], copy.imageCaptions[photoIndex], locale, photoIndex === 0);
    const paragraphs = section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n");
    const bullets = section.bullets.length ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>` : "";
    const note = section.note ? `<div class="note-card">${escapeHtml(section.note)}</div>` : "";
    return `${figure}<h2 id="${escapeHtml(section.id)}">${escapeHtml(section.heading)}</h2>\n${paragraphs}\n${bullets}\n${note}`;
  }).join("\n");
}

function renderFigure(photo, caption, locale, landscape) {
  const alt = locale === "zh" ? photo.altZh : photo.altEn;
  const label = locale === "zh" ? "工程參考" : "Site reference";
  const dimensions = photo.width && photo.height ? ` width="${photo.width}" height="${photo.height}"` : "";
  return `<figure class="article-figure ${landscape ? "article-figure--landscape" : "article-figure--detail"}"><img src="${escapeHtml(photo.path)}"${dimensions} loading="lazy" decoding="async" alt="${escapeHtml(alt)}" /><figcaption class="figure-caption"><span>${label}</span><p>${escapeHtml(caption)}</p></figcaption></figure>`;
}

export function renderArticlePage({ locale, copy, topic, photos, date, config }) {
  const s = localeSettings(locale);
  const alternate = locale === "zh" ? articleAlternate("en-gb", topic.slug) : articleAlternate("zh-hk", topic.slug);
  const canonical = `${config.baseUrl}/${s.dir}/guides/${topic.slug}/`;
  const heroImage = `${config.baseUrl}${photos[0].path}`;
  const text = [copy.intro, ...copy.sections.flatMap((section) => section.paragraphs), ...copy.faqs.map((faq) => faq.answer)].join(" ");
  const units = locale === "zh" ? text.replace(/\s/g, "").length : text.split(/\s+/).length;
  const minutes = Math.max(5, Math.round(units / (locale === "zh" ? 320 : 210)));
  const formattedDate = locale === "zh" ? formatZhDate(date) : formatEnDate(date);
  const articleData = {
    "@context": "https://schema.org", "@type": "Article", headline: copy.title,
    description: copy.metaDescription, image: heroImage, datePublished: date, dateModified: date,
    inLanguage: s.htmlLang, mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: locale === "zh" ? config.siteNameZh : config.siteNameEn, url: `${config.baseUrl}/${s.dir}/` },
    publisher: { "@type": "Organization", name: locale === "zh" ? config.siteNameZh : config.siteNameEn, logo: { "@type": "ImageObject", url: `${config.baseUrl}/HL%20LOGO.png` } }
  };
  const faqData = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: copy.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  const breadcrumbData = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: s.home, item: `${config.baseUrl}/${s.dir}/` },
    { "@type": "ListItem", position: 2, name: s.guides, item: `${config.baseUrl}/${s.dir}/guides/` },
    { "@type": "ListItem", position: 3, name: copy.title, item: canonical }
  ] };
  const toc = copy.sections.map((section) => `<a href="#${escapeHtml(section.id)}">${escapeHtml(section.heading)}</a>`).join("");
  const faqs = copy.faqs.map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join("");
  const waText = locale === "zh" ? `你好，我想查詢「${copy.title}」，現傳送入口相片及短片。` : `Hello, I would like help with “${copy.title}”. I am sending entrance photos and a short video.`;

  return `<!doctype html>
<html lang="${s.htmlLang}">
  <head>
    <script>!function(){var l=window.location,h=l.hostname;if((l.protocol==="http:"&&h!=="127.0.0.1"&&h!=="localhost")||h==="www.hwalai.com"){l.replace("https://hwalai.com"+l.pathname+l.search+l.hash)}}();</script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(copy.title)}｜${escapeHtml(locale === "zh" ? config.siteNameZh : config.siteNameEn)}</title>
    <meta name="description" content="${escapeHtml(copy.metaDescription)}" />
    <link rel="icon" type="image/png" href="/HL LOGO.png" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="${s.htmlLang}" href="${canonical}" />
    <link rel="alternate" hreflang="${s.otherLang}" href="${alternate}" />
    <link rel="alternate" hreflang="x-default" href="${config.baseUrl}/zh-hk/guides/${topic.slug}/" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(copy.title)}" />
    <meta property="og:description" content="${escapeHtml(copy.metaDescription)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${heroImage}" />
    <meta property="article:published_time" content="${date}" />
    <meta property="article:modified_time" content="${date}" />
    <link rel="stylesheet" href="/guide-assets/guides.css?v=3" />
    <script type="application/ld+json">${jsonLd(articleData)}</script>
    <script type="application/ld+json">${jsonLd(faqData)}</script>
    <script type="application/ld+json">${jsonLd(breadcrumbData)}</script>
  </head>
  <body>
    <header class="site-header"><div class="shell header-row"><a class="brand" href="/${s.dir}/" aria-label="${escapeHtml(s.brand)}"><img src="/HL LOGO.png" alt="${escapeHtml(s.brandAlt)}" /><span class="brand-copy"><strong>${escapeHtml(s.brand)}</strong><small>${escapeHtml(s.brandSmall)}</small></span></a><nav class="main-nav" aria-label="${escapeHtml(s.contents)}"><a href="/${s.dir}/portfolio/">${escapeHtml(s.navProducts)}</a><a href="/${s.dir}/case-studies/">${escapeHtml(s.navCases)}</a><a class="active" href="/${s.dir}/guides/">${escapeHtml(s.guides)}</a><a href="/${s.dir}/estimator/">${escapeHtml(s.navEstimator)}</a><a href="/${s.dir}/contact/">${escapeHtml(s.navContact)}</a></nav><div class="lang-switch" aria-label="Language"><a${locale === "zh" ? " class=\"active\"" : ""} href="/zh-hk/guides/${topic.slug}/">繁</a><a${locale === "en" ? " class=\"active\"" : ""} href="/en-gb/guides/${topic.slug}/">EN</a></div></div></header>
    <main>
      <div class="shell crumbs"><a href="/${s.dir}/">${escapeHtml(s.home)}</a><span>›</span><a href="/${s.dir}/guides/">${escapeHtml(s.guides)}</a><span>›</span>${escapeHtml(copy.title)}</div>
      <header class="article-hero"><div class="shell"><p class="kicker">${escapeHtml(copy.kicker)}</p><h1>${escapeHtml(copy.title)}</h1><p class="lead">${escapeHtml(copy.lead)}</p><div class="article-meta"><span>${escapeHtml(s.prepared)}</span><span>${escapeHtml(s.updated)} ${escapeHtml(formattedDate)}</span><span>${minutes} ${escapeHtml(s.minutes)}</span></div></div></header>
      <section class="answer-band" aria-label="${escapeHtml(copy.answerLabel)}"><div class="shell answer-grid"><div><small>${escapeHtml(copy.answerLabel)}</small><strong>${escapeHtml(copy.answerHeadline)}</strong></div><p>${escapeHtml(copy.answerCopy)}</p></div></section>
      <div class="shell article-layout"><aside class="toc" aria-label="${escapeHtml(s.contents)}"><strong>${escapeHtml(s.contents)}</strong>${toc}<a href="#faq">${escapeHtml(s.faq)}</a></aside><article class="article-body"><p>${escapeHtml(copy.intro)}</p>${renderSections(copy, photos, locale)}<h2 id="faq">${escapeHtml(s.faq)}</h2><div class="faq">${faqs}</div><section class="article-cta"><h2>${escapeHtml(copy.ctaTitle)}</h2><p>${escapeHtml(copy.ctaCopy)}</p><div class="cta-actions"><a class="button primary" href="https://wa.me/${config.whatsapp}?text=${encodeURIComponent(waText)}" target="_blank" rel="noopener">${escapeHtml(s.ctaButton)}</a><a class="button secondary" href="/${s.dir}/portfolio/">${escapeHtml(s.servicesButton)}</a></div></section></article></div>
    </main>
    <footer class="site-footer"><div class="shell footer-grid"><div class="footer-brand"><a class="brand" href="/${s.dir}/"><img src="/HL LOGO.png" alt="${escapeHtml(s.brandAlt)}" /><span class="brand-copy"><strong>${escapeHtml(s.brand)}</strong><small>${escapeHtml(s.brandSmall)}</small></span></a><p>${escapeHtml(s.footerText)}</p></div><div class="footer-links"><div><small>${escapeHtml(s.explore)}</small><a href="/${s.dir}/portfolio/">${escapeHtml(s.navProducts)}</a><a href="/${s.dir}/case-studies/">${escapeHtml(s.navCases)}</a><a href="/${s.dir}/guides/">${escapeHtml(s.guides)}</a></div><div><small>${escapeHtml(s.start)}</small><a href="/${s.dir}/contact/">${escapeHtml(s.navContact)}</a><a href="tel:+85262813185">${escapeHtml(config.phone)}</a></div></div></div><div class="shell copyright">${escapeHtml(s.copyright)}</div></footer>
  </body>
</html>\n`;
}

function articleAlternate(dir, slug) {
  return `https://hwalai.com/${dir}/guides/${slug}/`;
}

function formatZhDate(date) {
  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatEnDate(date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Hong_Kong" }).format(new Date(`${date}T00:00:00+08:00`));
}

export function renderHubCards(published, locale) {
  const entries = published
    .filter((item) => item.slug !== "automatic-door-selection-guide")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return entries.map((item) => {
    const isZh = locale === "zh";
    const dir = isZh ? "zh-hk" : "en-gb";
    return `<article class="guide-card"><a class="guide-card-image" href="/${dir}/guides/${escapeHtml(item.slug)}/"><img src="${escapeHtml(item.heroImage)}" loading="lazy" decoding="async" alt="${escapeHtml(isZh ? item.titleZh : item.titleEn)}" /></a><div class="guide-card-copy"><span class="topic-label">${escapeHtml(isZh ? item.categoryZh : item.categoryEn)}</span><h2><a href="/${dir}/guides/${escapeHtml(item.slug)}/">${escapeHtml(isZh ? item.titleZh : item.titleEn)}</a></h2><p>${escapeHtml(isZh ? item.descriptionZh : item.descriptionEn)}</p><a class="read-link" href="/${dir}/guides/${escapeHtml(item.slug)}/">${isZh ? "閱讀文章" : "Read guide"}</a></div></article>`;
  }).join("\n");
}

export async function updateHub(locale, published, outputRoot = siteRoot) {
  const dir = locale === "zh" ? "zh-hk" : "en-gb";
  const file = path.join(outputRoot, dir, "guides", "index.html");
  let html = await fs.readFile(file, "utf8");
  const block = `<!-- AUTO_ARTICLES_START -->\n<div class="guide-grid">\n${renderHubCards(published, locale)}\n</div>\n<!-- AUTO_ARTICLES_END -->`;
  const marker = /<!-- AUTO_ARTICLES_START -->[\s\S]*?<!-- AUTO_ARTICLES_END -->/;
  if (!marker.test(html)) throw new Error(`${file} 缺少自动文章标记`);
  html = html.replace(marker, block);
  await fs.writeFile(file, html);
  return path.relative(outputRoot, file);
}

export async function updateSitemap(topic, date, outputRoot = siteRoot) {
  const file = path.join(outputRoot, "sitemap.xml");
  let xml = await fs.readFile(file, "utf8");
  const paths = [`zh-hk/guides/${topic.slug}/`, `en-gb/guides/${topic.slug}/`];
  if (paths.every((entry) => xml.includes(`${configBase()}/${entry}`))) return ["sitemap.xml"];
  const blocks = paths.map((entry, index) => {
    const currentLang = index === 0 ? "zh-HK" : "en-GB";
    const otherLang = index === 0 ? "en-GB" : "zh-HK";
    const otherPath = paths[index === 0 ? 1 : 0];
    return `  <url>\n    <loc>${configBase()}/${entry}</loc>\n    <lastmod>${date}</lastmod>\n    <xhtml:link rel="alternate" hreflang="${currentLang}" href="${configBase()}/${entry}" />\n    <xhtml:link rel="alternate" hreflang="${otherLang}" href="${configBase()}/${otherPath}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${configBase()}/${paths[0]}" />\n  </url>`;
  }).join("\n");
  xml = xml.replace("</urlset>", `${blocks}\n</urlset>`);
  await fs.writeFile(file, xml);
  return ["sitemap.xml"];
}

function configBase() {
  return "https://hwalai.com";
}

export async function writeArticleFiles({ topic, article, photos, date, config, outputRoot = siteRoot }) {
  const files = [];
  for (const locale of ["zh", "en"]) {
    const dir = locale === "zh" ? "zh-hk" : "en-gb";
    const outputDir = path.join(outputRoot, dir, "guides", topic.slug);
    await fs.mkdir(outputDir, { recursive: true });
    const file = path.join(outputDir, "index.html");
    await fs.writeFile(file, renderArticlePage({ locale, copy: article[locale], topic, photos, date, config }));
    files.push(path.relative(outputRoot, file));
  }
  return files;
}

export async function validateGeneratedHtml(files, outputRoot = siteRoot) {
  const errors = [];
  for (const relative of files.filter((file) => file.endsWith(".html"))) {
    const html = await fs.readFile(path.join(outputRoot, relative), "utf8");
    const isArticle = /(?:zh-hk|en-gb)\/guides\/[^/]+\/index\.html$/.test(relative);
    const requiredItems = ["<title>", "rel=\"canonical\"", "hreflang=", "<h1>"];
    if (isArticle) requiredItems.push("application/ld+json", "WhatsApp");
    for (const required of requiredItems) {
      if (!html.includes(required)) errors.push(`${relative}: 缺少 ${required}`);
    }
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const match of scripts) {
      try { JSON.parse(match[1]); } catch { errors.push(`${relative}: JSON-LD 无效`); }
    }
  }
  if (errors.length) throw new Error(`页面验证失败：\n- ${errors.join("\n- ")}`);
}
