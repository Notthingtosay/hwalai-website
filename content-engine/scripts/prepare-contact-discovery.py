"""Prepare a narrowly scoped contact-information patch from published HTML.

Only the listed business pages and their sitemap dates are published. Existing
scripts, forms and unrelated local edits are preserved. No cloud writes occur.
"""

import argparse
import concurrent.futures
import html as html_module
import json
import re
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
BASE = "https://hwalai.com"
ORIGIN = "https://hwalai.oss-cn-hongkong.aliyuncs.com"
ASSET = "site-assets/contact-discovery-20261103.css"
MARKER = "hwalai-contact-discovery-20261103"
ROUTES = ["", "about/", "contact/", "case-studies/", "portfolio/",
          "portfolio/automatic-door-systems/", "portfolio/glass-door-hardware/",
          "portfolio/floor-springs/", "portfolio/repair-maintenance/"]
PAGES = [f"{locale}/{route}index.html" for locale in ("zh-hk", "en-gb") for route in ROUTES]


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.text = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("script", "style"):
            self.hidden += 1
        if tag == "a":
            self.links.append(attrs.get("href", ""))

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, data):
        if not self.hidden and data.strip():
            self.text.append(data.strip())


def organization(locale):
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": f"{BASE}/#organization",
        "name": "華麗工程",
        "alternateName": ["Hwa Lai Engineering", "Hwalai Engineering", "HWALAI"],
        "url": f"{BASE}/zh-hk/",
        "logo": f"{BASE}/site-assets/logo.webp",
        "description": "香港自動門及玻璃門新裝、翻新、維修與保養服務。",
        "telephone": "+85262813185",
        "email": "sales.hk@hwalai.com",
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "香港工程查詢 / Hong Kong engineering enquiries",
            "telephone": "+85262813185",
            "email": "sales.hk@hwalai.com",
            "url": f"{BASE}/{locale}/contact/",
            "availableLanguage": ["zh-Hant", "en"],
        },
    }


def contact_section(locale):
    if locale == "zh-hk":
        label = "華麗工程官方聯絡資料"
        title = "華麗工程（Hwa Lai Engineering）"
        copy = "香港自動門及玻璃門新裝、翻新、維修與保養查詢，請聯絡香港技術服務部門。"
        phone, whatsapp, website = "香港工程查詢電話", "WhatsApp 查詢", "官方網站"
    else:
        label = "Official Hwalai Engineering contact details"
        title = "Hwalai Engineering（華麗工程）"
        copy = "Contact our Hong Kong technical services team for automatic door and glass door installation, refurbishment, repairs and maintenance."
        phone, whatsapp, website = "Hong Kong engineering enquiries", "WhatsApp enquiries", "Official website"
    return (f'<!-- {MARKER}:start -->\n'
            f'<section class="hl-contact-details" aria-label="{label}">'
            f'<div class="hl-contact-details-inner"><h2>{title}</h2><p>{copy}</p>'
            f'<p>{phone}：<a href="tel:+85262813185">+852 6281 3185</a></p>'
            f'<p>{whatsapp}：<a href="https://wa.me/85262813185" target="_blank" rel="noopener">+852 6281 3185</a></p>'
            f'<p class="hl-contact-website">{website}：<a href="/{locale}/">hwalai.com</a></p>'
            f'</div></section>\n<!-- {MARKER}:end -->')


def patch_html(source, key):
    if MARKER in source:
        raise ValueError(f"Already patched: {key}")
    if len(re.findall(r"</main\s*>", source, re.I)) != 1:
        raise ValueError(f"Expected exactly one main element: {key}")
    if len(re.findall(r"</head\s*>", source, re.I)) != 1:
        raise ValueError(f"Expected exactly one head element: {key}")
    locale = key.split("/")[0]
    schema = json.dumps(organization(locale), ensure_ascii=False, separators=(",", ":"))
    additions = (f'<link rel="stylesheet" href="/{ASSET}">\n'
                 f'<script type="application/ld+json" id="hwalai-organization">{schema}</script>\n')
    result = re.sub(r"</head\s*>", lambda match: additions + match[0], source, count=1, flags=re.I)
    result = re.sub(r"</main\s*>", lambda match: contact_section(locale) + match[0], result, count=1, flags=re.I)
    if key == f"{locale}/index.html":
        label = "香港工程查詢電話／WhatsApp" if locale == "zh-hk" else "Hong Kong phone / WhatsApp"
        number = (f'<p class="hl-contact-hero-phone">{label}：'
                  '<a href="tel:+85262813185">+852 6281 3185</a></p>')
        pattern = r'(<a\b[^>]*href="https://wa\.me/85262813185"[^>]*>[\s\S]*?</a>)'
        result, count = re.subn(pattern, lambda match: match[0] + number, result, count=1)
        if count != 1:
            raise ValueError(f"Home WhatsApp link not found: {key}")
    if key in (f"{locale}/index.html", f"{locale}/contact/index.html"):
        description = ("華麗工程提供香港自動門及玻璃門新裝、翻新、維修與保養。香港工程查詢電話／WhatsApp：+852 6281 3185，可傳送現場相片了解下一步。"
                       if locale == "zh-hk" else
                       "Hwalai Engineering provides automatic door and glass door installation, refurbishment, repairs and maintenance in Hong Kong. Phone / WhatsApp: +852 6281 3185.")
        content = html_module.escape(description, quote=True)
        pattern = r'(<meta\b[^>]*(?:name="description"|property="og:description")[^>]*\bcontent=")[^"]*(")'
        result, count = re.subn(pattern, lambda match: match[1] + content + match[2], result)
        if not count:
            raise ValueError(f"Description not found: {key}")
    return result


def validate(before, after, key):
    page = Document()
    page.feed(after)
    assert "+852 6281 3185" in " ".join(page.text), key
    assert "tel:+85262813185" in page.links, key
    assert "https://wa.me/85262813185" in page.links, key
    assert after.count(f"{MARKER}:start") == 1, key
    schemas = re.findall(r'<script\b[^>]*type="application/ld\+json"[^>]*>([\s\S]*?)</script>', after)
    parsed = [json.loads(item) for item in schemas]
    assert any(item.get("@id") == BASE + "/#organization" and item.get("telephone") == "+85262813185" for item in parsed), key
    for pattern in (r'<h1\b[\s\S]*?</h1>', r'<form\b[\s\S]*?</form>',
                    r'<script\b(?![^>]*id="hwalai-organization")[\s\S]*?</script>',
                    r'<link\b[^>]*rel="canonical"[^>]*>'):
        assert re.findall(pattern, before) == re.findall(pattern, after), (key, pattern)
    original = Document()
    original.feed(before)
    assert all(href in page.links for href in original.links), key


def fetch(key):
    url = f"{ORIGIN}/{key}"
    error = None
    for _ in range(2):
        try:
            with urlopen(Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "Mozilla/5.0"}), timeout=20) as response:
                text = response.read().decode("utf-8")
                if response.status != 200:
                    raise ValueError(f"Unexpected status for {key}")
                return key, text, {name: response.headers.get(name) for name in ("ETag", "Last-Modified", "Content-Type", "Cache-Control")}
        except Exception as exc:
            error = exc
    raise RuntimeError(f"Unable to fetch {key}: {error}")


def write(base, key, text):
    dest = base / key
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-dir", required=True, type=Path)
    parser.add_argument("--apply-local", action="store_true")
    args = parser.parse_args()
    run = args.run_dir.resolve()
    if (run / "manifest.json").exists():
        raise SystemExit("Use a new run directory to preserve the previous backup.")
    backup, payload = run / "online-before", run / "payload"
    metadata = {}
    records = []
    keys = PAGES + ["sitemap.xml"]
    pending = []
    for key in keys:
        cached, headers = backup / key, run / "source-headers" / (key + ".json")
        if cached.is_file() and headers.is_file():
            records.append((key, cached.read_text(), json.loads(headers.read_text())))
        else:
            pending.append(key)
    errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(fetch, key): key for key in pending}
        for future in concurrent.futures.as_completed(futures):
            try:
                record = future.result()
                key, source, headers = record
                write(backup, key, source)
                write(run / "source-headers", key + ".json", json.dumps(headers))
                records.append(record)
                print(f"Fetched published object: {key}", flush=True)
            except Exception as exc:
                errors.append(str(exc))
    if errors:
        raise RuntimeError("\n".join(errors))
    for key, source, headers in records:
        write(backup, key, source)
        metadata[key] = headers
        if key in PAGES:
            patched = patch_html(source, key)
            validate(source, patched, key)
            write(payload, key, patched)
    sitemap = next(source for key, source, _ in records if key == "sitemap.xml")
    date = datetime.now(ZoneInfo("Asia/Hong_Kong")).date().isoformat()
    urls = {f"{BASE}/{key.removesuffix('index.html')}" for key in PAGES}
    changed = []
    def update_date(match):
        block = match[0]
        loc = re.search(r"<loc>(.*?)</loc>", block)
        if loc and loc[1] in urls:
            block, count = re.subn(r"<lastmod>.*?</lastmod>", f"<lastmod>{date}</lastmod>", block)
            assert count == 1
            changed.append(loc[1])
        return block
    sitemap = re.sub(r"<url>[\s\S]*?</url>", update_date, sitemap)
    assert len(changed) == len(PAGES), "Sitemap is missing a target page"
    write(payload, "sitemap.xml", sitemap)
    write(payload, ASSET, (ROOT / ASSET).read_text())
    local_created = []
    if args.apply_local:
        for key in PAGES:
            local = ROOT / key
            if not local.exists():
                write(ROOT, key, (payload / key).read_text())
                local_created.append(key)
                continue
            source = local.read_text()
            if MARKER in source:
                validate((run / "local-before" / key).read_text(), source, key)
                continue
            patched = patch_html(source, key)
            validate(source, patched, key)
            write(run / "local-before", key, source)
            local.write_text(patched)
    manifest = {"baseUrl": BASE, "createdAt": datetime.now(ZoneInfo("Asia/Hong_Kong")).isoformat(),
                "pages": PAGES, "files": [ASSET] + PAGES + ["sitemap.xml"],
                "localCreated": local_created, "sourceHeaders": metadata}
    write(run, "manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Prepared and validated {len(PAGES)} published pages; scripts, forms, headings, existing links and canonical URLs preserved.")
    print(f"Payload: {payload}")
    print(f"Rollback copies: {backup}")


if __name__ == "__main__":
    main()
