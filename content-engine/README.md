# 華麗工程自動文章系統

這個系統每天從選題庫取出一個主題，生成繁體中文與英文文章，通過機器質檢後直接上傳到 Alibaba Cloud OSS。它不需要人工審稿；如果文章不符合規則，當天會停止發布，不會把問題頁面上線。

## 已設定的發布規則

- 每天香港時間上午 9:30 發布一個主題，共兩個語言頁面。
- 價格內容目前完全關閉，文章不能出現價錢、費用或報價。
- 必須至少有 5 個正文小節、3 個 FAQ、3 張相關真實工程圖片。
- 必須有 canonical、雙語 hreflang、Article／FAQ／Breadcrumb JSON-LD。
- 不得虛構客戶、地址、認證、法例、性能數據或工程案例。
- 圖片只從 `data/photo-library.json` 的批准圖片庫選取。
- HTML 和 sitemap 使用不緩存策略；圖片使用長期緩存。
- 每次生成前先寫入固定的 `automation-health/write-check.txt`，確認 OSS 權限，避免權限錯誤時仍消耗 AI 額度。

## 本機測試

```bash
cd content-engine
npm ci
npm run demo
npm run validate
```

`npm run demo` 使用模擬文章，只測試生成和質檢，不會修改網站。要真正生成下一個選題：

```bash
OPENAI_API_KEY=... \
OPENAI_BASE_URL=https://api.openai.com/v1 \
npm run generate
```

非 OpenAI 官方端點會預設透過官方 Codex CLI 連接，以符合 Codex 分組令牌的客戶端要求；官方 OpenAI 端點則預設直接使用 Responses API。可用 `AI_CLIENT=codex` 或 `AI_CLIENT=responses` 明確指定。

要生成並直接上傳 OSS：

```bash
OPENAI_API_KEY=... \
ALIBABA_CLOUD_ACCESS_KEY_ID=... \
ALIBABA_CLOUD_ACCESS_KEY_SECRET=... \
OSS_REGION=oss-cn-hongkong \
OSS_BUCKET=hwalai \
node scripts/run.mjs --count 1 --publish
```

## 啟用每日自動發布

1. 把整個網站放進 GitHub repository。
2. 在 GitHub → Settings → Secrets and variables → Actions 加入：
   - `OPENAI_API_KEY`
   - `ALIBABA_CLOUD_ACCESS_KEY_ID`
   - `ALIBABA_CLOUD_ACCESS_KEY_SECRET`
   並在 Variables 加入：
   - `OPENAI_BASE_URL`（OpenAI 官方使用 `https://api.openai.com/v1`；中轉站填其 OpenAI 相容端點）
   - `OPENAI_MODEL`（必須是該端點及令牌分組可用的模型）
3. 建議為 OSS 建立只可讀寫 `hwalai` bucket 的 RAM 子帳戶，不要使用主帳戶 AccessKey。
4. 到 Actions 手動執行一次 `Publish daily automatic-door guide`。
5. 成功後，排程會每天自動運行。

## 日常維護

- 新增選題：編輯 `data/topics.json`，狀態使用 `queued`。
- 禁止某個主題：把狀態改成 `paused`。
- 新增圖片：先壓縮成 WebP 放入網站，再在 `data/photo-library.json` 加上路徑、描述和標籤。
- 暫停全部發布：在 GitHub Actions 停用 workflow。
- 開放價格文章：不要直接改提示詞；先核實價格後，再把 `config.json` 的 `priceContentEnabled` 改成 `true` 並另建價格知識庫。

## 發布檔案

生成器每次只把 `.publish-manifest.json` 列出的頁面、圖片、文章中心和 sitemap 上傳，不會整站覆蓋，避免誤刪原有內容。
