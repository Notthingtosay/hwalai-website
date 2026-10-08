import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const siteRoot = fileURLToPath(new URL("../../", import.meta.url));
const origin = "https://hwalai.com";
const organizationId = `${origin}/#organization`;
const phone = "+85262813185";
const email = "sales.hk@hwalai.com";
const locales = [
  {
    path: "zh-hk", language: "zh-HK", contact: /聯絡/, brand: /華麗工程/,
    labels: { portfolio: /產品.*服務/, "case-studies": /工程案例/, guides: /指南/ },
    services: ["新裝自動門", "翻新／更換工程", "定期保養", "故障／緊急維修"],
    message: (fields) => [
      "你好，想查詢華麗工程服務。", "",
      `服務類型：${fields.service}`, `地區／項目位置：${fields.place}`,
      `聯絡人：${fields.name || "未提供"}`, `現場情況：${fields.issue}`, "",
      "我會再補傳現場相片，謝謝。"
    ].join("\n"),
    visibleHours: [/周一至五[：，:]?\s*上午\s*8\s*時至晚上\s*8\s*時/, /周六至日[：，:]?\s*上午\s*9\s*時至晚上\s*7\s*時/]
  },
  {
    path: "en-gb", language: "en-GB", contact: /contact/i, brand: /Hwalai Engineering/,
    labels: { portfolio: /products.*services/i, "case-studies": /case studies/i, guides: /guides/i },
    services: ["New automatic door installation", "Upgrade or replacement", "Planned maintenance", "Fault or urgent repair"],
    message: (fields) => [
      "Hello, I would like to enquire about Hwalai Engineering services.", "",
      `Service: ${fields.service}`, `Area / project location: ${fields.place}`,
      `Contact name: ${fields.name || "Not provided"}`, `Site condition / requirement: ${fields.issue}`, "",
      "I will send site photos in this chat. Thank you."
    ].join("\n"),
    visibleHours: [/Mon[–-]Fri[:,]?\s*08:00[–-]20:00/, /Sat[–-]Sun[:,]?\s*09:00[–-]19:00/]
  }
];

// These focused helpers read this site's static HTML without adding a DOM dependency.
// Attribute order, quote style, whitespace, and nested heading/link markup may vary.
function decode(value) {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, name) => {
    if (name.startsWith("#")) {
      const hex = name[1].toLowerCase() === "x";
      return String.fromCodePoint(parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10));
    }
    return named[name.toLowerCase()] ?? entity;
  });
}

function attributes(source) {
  return Object.fromEntries([...source.matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
    .map((match) => [match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4] ?? "")]));
}

function openings(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "gi"))]
    .map((match) => attributes(match[1]));
}

function elements(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}\\s*>`, "gi"))]
    .map((match) => ({ attrs: attributes(match[1]), content: match[2] }));
}

function text(html) {
  return decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function exactlyOne(items, label) {
  assert.equal(items.length, 1, `Expected exactly one ${label}`);
  return items[0];
}

function meta(html, key, attribute = "name") {
  return exactlyOne(openings(html, "meta").filter((tag) => tag[attribute] === key), key).content;
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  if (!Array.isArray(value)) visit(value);
  for (const nested of Object.values(value)) walk(nested, visit);
}

function hasType(node, type) {
  return [node["@type"]].flat().includes(type);
}

function schemaGraph(html) {
  const scripts = elements(html, "script").filter(({ attrs }) => attrs.type === "application/ld+json");
  assert.ok(scripts.length, "Contact page needs JSON-LD");
  const documents = scripts.map(({ content }) => JSON.parse(content));
  const graph = [];
  const defined = new Map();
  for (const document of documents) {
    assert.equal(document["@context"], "https://schema.org");
    assert.ok(Array.isArray(document["@graph"]), "Use a connected @graph for contact metadata");
    graph.push(...document["@graph"]);
    walk(document, (node) => {
      if (node["@id"] && Object.keys(node).length > 1) {
        assert.ok(!defined.has(node["@id"]), `Duplicate schema definition: ${node["@id"]}`);
        defined.set(node["@id"], node);
      }
      for (const key of ["address", "streetAddress", "postalCode", "geo", "latitude", "longitude", "aggregateRating", "review", "ratingValue", "price", "priceRange", "offers"]) {
        assert.ok(!(key in node), `Do not introduce unverified ${key} in contact schema`);
      }
      assert.ok(!hasType(node, "LocalBusiness"), "Contact metadata must not claim an unverified local-business location");
    });
  }
  for (const document of documents) {
    walk(document, (node) => {
      if (node["@id"]) {
        assert.ok(defined.has(node["@id"]), `Unresolved schema reference: ${node["@id"]}`);
      }
    });
  }
  return { graph, defined };
}

const pages = await Promise.all(locales.map(async (locale) => ({
  ...locale,
  canonical: `${origin}/${locale.path}/contact/`,
  html: await fs.readFile(path.join(siteRoot, locale.path, "contact/index.html"), "utf8")
})));

for (const page of pages) {
  test(`${page.path}: localized contact headings and consistent search/social metadata`, () => {
    const { html } = page;
    assert.equal(exactlyOne(openings(html, "html"), "html element").lang, page.language);
    const title = text(exactlyOne(elements(html, "title"), "title").content);
    const h1 = text(exactlyOne(elements(html, "h1"), "H1").content);
    assert.match(title, page.contact);
    assert.match(title, page.brand);
    assert.match(h1, page.contact);
    assert.match(h1, page.brand);
    for (const value of [title, h1]) {
      assert.match(value, page.path === "zh-hk" ? /香港.*自動門/ : /(?:Hong Kong.*automatic doors|automatic doors.*Hong Kong)/i);
    }
    const description = meta(html, "description");
    assert.ok(description?.trim(), "Description must be nonempty");
    assert.match(description, /WhatsApp/i);
    assert.equal(meta(html, "og:title", "property"), title);
    assert.equal(meta(html, "og:description", "property"), description);
    assert.equal(meta(html, "og:url", "property"), page.canonical);
    assert.equal(meta(html, "og:type", "property"), "website");
    assert.doesNotMatch(`${title} ${h1} ${description}`, /24\s*\/\s*7|24[- ]hour|24\s*小時|全天候|\bguaranteed\b|\bbest\b|\bcheapest\b|HK\$\s*\d|\$\s*\d|最低價|保證/i);
    for (const robots of openings(html, "meta").filter((tag) => /^(robots|googlebot)$/i.test(tag.name ?? ""))) {
      assert.doesNotMatch(robots.content ?? "", /\b(noindex|none)\b/i);
    }
  });

  test(`${page.path}: one canonical and all three reciprocal hreflang alternates`, () => {
    const links = openings(page.html, "link");
    assert.equal(exactlyOne(links.filter((tag) => tag.rel === "canonical"), "canonical").href, page.canonical);
    const alternates = links.filter((tag) => tag.rel === "alternate" && tag.hreflang);
    assert.equal(alternates.length, 3);
    for (const [language, expected] of [["zh-hk", "zh-hk"], ["en-gb", "en-gb"], ["x-default", "zh-hk"]]) {
      const alternate = exactlyOne(alternates.filter((tag) => tag.hreflang.toLowerCase() === language), `${language} alternate`);
      assert.equal(alternate.href, `${origin}/${expected}/contact/`);
      assert.ok(pages.some((other) => other.canonical === alternate.href), "Alternate must be a verified counterpart");
    }
  });

  test(`${page.path}: connected ContactPage, Organization and breadcrumb schema`, () => {
    const { graph, defined } = schemaGraph(page.html);
    const organization = exactlyOne(graph.filter((node) => hasType(node, "Organization")), "Organization");
    assert.equal(organization["@id"], organizationId);
    assert.equal(organization.name, "華麗工程");
    assert.equal(organization.alternateName, "Hwalai Engineering");
    assert.equal(organization.url, `${origin}/zh-hk/`);
    assert.equal(organization.telephone, phone);
    assert.equal(organization.email, email);

    const contact = exactlyOne(graph.filter((node) => hasType(node, "ContactPage")), "ContactPage");
    assert.equal(contact["@id"], `${page.canonical}#webpage`);
    assert.equal(contact.url, page.canonical);
    assert.equal(contact.name, text(exactlyOne(elements(page.html, "title"), "title").content));
    assert.equal(contact.description, meta(page.html, "description"));
    assert.equal(contact.inLanguage, page.language);
    assert.equal(contact.mainEntity?.["@id"], organizationId);
    assert.equal(contact.about?.["@id"], organizationId);
    assert.equal(contact.breadcrumb?.["@id"], `${page.canonical}#breadcrumb`);

    const breadcrumb = exactlyOne(graph.filter((node) => hasType(node, "BreadcrumbList")), "BreadcrumbList");
    assert.equal(breadcrumb["@id"], `${page.canonical}#breadcrumb`);
    assert.equal(defined.get(contact.breadcrumb["@id"]), breadcrumb);
    assert.ok(Array.isArray(breadcrumb.itemListElement));
    assert.equal(breadcrumb.itemListElement.length, 2);
    const visibleBreadcrumb = exactlyOne(elements(page.html, "nav").filter(({ attrs }) =>
      (attrs.class ?? "").split(/\s+/).includes("breadcrumbs")), "visible breadcrumb");
    const expectedUrls = [`${origin}/${page.path}/`, page.canonical];
    breadcrumb.itemListElement.forEach((item, index) => {
      assert.equal(item["@type"], "ListItem");
      assert.equal(item.position, index + 1);
      assert.ok(item.name?.trim());
      assert.ok(text(visibleBreadcrumb.content).includes(item.name), "Schema breadcrumbs must be visible");
      assert.equal(item.item, expectedUrls[index]);
    });
  });

  test(`${page.path}: verified Hong Kong contact details and opening hours`, () => {
    const { graph } = schemaGraph(page.html);
    const organization = exactlyOne(graph.filter((node) => hasType(node, "Organization")), "Organization");
    const points = [organization.contactPoint].flat();
    const point = exactlyOne(points.filter((entry) => entry && hasType(entry, "ContactPoint")), "ContactPoint");
    assert.equal(point.telephone, phone);
    assert.equal(point.email, email);
    assert.equal(typeof point.areaServed === "string" ? point.areaServed : point.areaServed?.name, "Hong Kong");
    const expectedHours = new Map([
      ...["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => [day, ["08:00", "20:00"]]),
      ...["Saturday", "Sunday"].map((day) => [day, ["09:00", "19:00"]])
    ]);
    const seen = new Set();
    for (const hours of [point.hoursAvailable].flat()) {
      assert.equal(hours?.["@type"], "OpeningHoursSpecification");
      for (const value of [hours.dayOfWeek].flat()) {
        assert.equal(typeof value, "string");
        const day = value.split("/").at(-1);
        assert.ok(expectedHours.has(day), `Unexpected day: ${day}`);
        assert.ok(!seen.has(day), `Duplicate opening hours: ${day}`);
        seen.add(day);
        assert.deepEqual([hours.opens, hours.closes], expectedHours.get(day));
      }
    }
    assert.equal(seen.size, 7, "Opening hours must cover all seven days");
    const anchors = openings(page.html, "a");
    for (const href of [`tel:${phone}`, `mailto:${email}`, "https://wa.me/85262813185"]) {
      assert.ok(anchors.some((anchor) => anchor.href === href), `Missing visible contact link: ${href}`);
    }
    const visibleText = text(page.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ""));
    for (const hours of page.visibleHours) assert.match(visibleText, hours);
  });

  test(`${page.path}: existing WhatsApp form fields remain usable`, () => {
    const form = exactlyOne(elements(page.html, "form").filter(({ attrs }) => attrs.id === "whatsapp-form"), "WhatsApp form");
    const inputs = openings(form.content, "input");
    const services = inputs.filter((input) => input.name === "service");
    assert.deepEqual(services.map((input) => input.value), page.services);
    assert.ok(services.every((input) => input.type === "radio"));
    assert.equal(services.filter((input) => "checked" in input).length, 1);
    assert.ok("checked" in services[0]);
    const place = exactlyOne(inputs.filter((input) => input.name === "place"), "place input");
    const name = exactlyOne(inputs.filter((input) => input.name === "name"), "name input");
    const issue = exactlyOne(openings(form.content, "textarea").filter((input) => input.name === "issue"), "issue textarea");
    assert.ok("required" in place);
    assert.ok("required" in issue);
    assert.ok(!("required" in name), "Contact name stays optional");
    for (const field of [place, name, issue]) {
      assert.ok(field.id);
      assert.ok(openings(form.content, "label").some((label) => label.for === field.id), `Missing label for ${field.name}`);
    }
    assert.ok(openings(form.content, "button").some((button) => button.type === "submit"));
  });

  test(`${page.path}: WhatsApp submit preserves the localized message and safely encodes user text`, () => {
    const handlerScript = exactlyOne(elements(page.html, "script").filter(({ attrs, content }) =>
      !attrs.src && attrs.type !== "application/ld+json" && content.includes("whatsapp-form")), "WhatsApp handler");
    for (const name of ["陳先生 & Alice + team", ""]) {
      const fields = { service: page.services[0], place: "Kowloon & 香港 #2?", name, issue: "Door won't open\nPhoto: <test> + 50%" };
      let submit;
      let prevented = false;
      const form = {};
      const window = { location: { href: "" } };
      // The page code only sees these in-memory stubs. No browser navigation or message is sent.
      const sandbox = {
        document: { getElementById(id) {
          assert.equal(id, "whatsapp-form");
          return { addEventListener(event, callback) { assert.equal(event, "submit"); submit = callback; } };
        } },
        window,
        FormData: class {
          constructor(target) { assert.equal(target, form); }
          get(key) { assert.ok(key in fields); return fields[key]; }
        }
      };
      vm.runInNewContext(handlerScript.content, sandbox, { timeout: 1000 });
      assert.equal(typeof submit, "function");
      submit({ currentTarget: form, preventDefault() { prevented = true; } });
      assert.ok(prevented, "Handler must prevent normal form submission");
      const destination = new URL(window.location.href);
      assert.equal(destination.origin, "https://wa.me");
      assert.equal(destination.pathname, "/85262813185");
      assert.equal(destination.hash, "");
      assert.deepEqual([...destination.searchParams.keys()], ["text"]);
      assert.equal(destination.searchParams.get("text"), page.message(fields));
    }
  });

  test(`${page.path}: footer labels point to existing, locale-matched destinations`, async () => {
    const footer = exactlyOne(elements(page.html, "footer"), "footer");
    const anchors = elements(footer.content, "a");
    for (const [route, label] of Object.entries(page.labels)) {
      const link = exactlyOne(anchors.filter(({ attrs }) => attrs.href === `/${page.path}/${route}/`), `${route} footer link`);
      assert.match(text(link.content), label);
    }
    for (const { attrs } of anchors) {
      if (!attrs.href?.startsWith("/")) continue;
      const url = new URL(attrs.href, origin);
      assert.equal(url.origin, origin);
      assert.ok(url.pathname.startsWith(`/${page.path}/`), "Footer navigation must stay in its language");
      assert.ok(url.pathname.endsWith("/"), "Page routes should retain trailing slashes");
      await fs.access(path.join(siteRoot, url.pathname.slice(1), "index.html"));
    }
  });
}

test("both contact locales describe the same Organization", () => {
  const organizations = pages.map((page) => schemaGraph(page.html).defined.get(organizationId));
  assert.deepEqual(organizations[0], organizations[1]);
});
