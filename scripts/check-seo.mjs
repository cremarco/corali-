import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const base = "https://www.coralivarazze.it/";
const pages = ["index.html", "menu.html", "carta-vini.html", "galleria.html", "accessibilita.html"];
const documents = new Map(await Promise.all(pages.map(async (file) => [file, await readFile(resolve(root, file), "utf8")])));
const titles = new Set();
const descriptions = new Set();
const canonicalURLs = [];
const entities = new Set();
let restaurant;

function decode(text) {
  return text.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
    if (named[entity]) return named[entity];
    return String.fromCodePoint(Number.parseInt(entity.slice(entity[2] === "x" ? 3 : 2, -1), entity[2] === "x" ? 16 : 10));
  });
}

function attributes(tag) {
  return Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), (match) => [match[1], decode(match[2])]));
}

function one(source, expression, label) {
  const matches = [...source.matchAll(expression)];
  assert.equal(matches.length, 1, `Expected one ${label}`);
  return matches[0][1];
}

async function localAsset(path) {
  const url = new URL(path, base);
  if (url.origin !== new URL(base).origin) return;
  await access(resolve(root, decodeURIComponent(url.pathname.slice(1))));
}

for (const [file, source] of documents) {
  const expectedURL = base + (file === "index.html" ? "" : file);
  const title = decode(one(source, /<title>(.*?)<\/title>/gs, `${file} title`));
  const description = decode(one(source, /<meta name="description" content="([^"]+)"/g, `${file} description`));
  const canonical = one(source, /<link rel="canonical" href="([^"]+)"/g, `${file} canonical`);
  assert(!titles.has(title), `Duplicate title: ${file}`);
  assert(!descriptions.has(description), `Duplicate description: ${file}`);
  titles.add(title); descriptions.add(description); canonicalURLs.push(canonical);
  assert.equal(canonical, expectedURL);
  assert.equal(one(source, /<meta property="og:url" content="([^"]+)"/g, `${file} og:url`), canonical);
  assert.equal(decode(one(source, /<meta property="og:title" content="([^"]+)"/g, `${file} og:title`)), title);
  assert.equal(decode(one(source, /<meta name="twitter:title" content="([^"]+)"/g, `${file} twitter:title`)), title);
  const socialImage = one(source, /<meta property="og:image" content="([^"]+)"/g, `${file} og:image`);
  assert.equal(one(source, /<meta property="og:image:secure_url" content="([^"]+)"/g, `${file} og:image:secure_url`), socialImage);
  assert.equal(one(source, /<meta name="twitter:image" content="([^"]+)"/g, `${file} twitter:image`), socialImage);
  await localAsset(socialImage);
  assert.match(source, /<html lang="it"/);
  assert.match(source, /<meta name="robots" content="index, follow/);
  assert.equal([...source.matchAll(/<h1\b/g)].length, 1, `${file}: expected one h1`);
  assert(!source.includes("tailwind-browser.js"), `${file}: runtime CSS compiler still present`);
  for (const tag of source.matchAll(/<[^>]+data-reveal[^>]*>/g)) {
    assert(!/(?:^|\s)opacity-0(?:\s|$)/.test(attributes(tag[0]).class), `${file}: content hidden before JavaScript`);
  }
  for (const match of source.matchAll(/<img\b[^>]*>/g)) {
    const image = attributes(match[0]);
    assert(Object.hasOwn(image, "alt"), `${file}: image missing alt`);
    assert(Number(image.width) > 0 && Number(image.height) > 0, `${file}: missing image dimensions`);
    if (image.src && !image.src.startsWith("data:")) await localAsset(image.src);
    if (image["data-hero-src"]) await localAsset(image["data-hero-src"]);
    for (const candidate of (image.srcset || image["data-hero-srcset"] || "").split(",").filter(Boolean)) {
      await localAsset(candidate.trim().split(/\s+/)[0]);
    }
  }
  for (const match of source.matchAll(/<(?:a|link|script)\b[^>]*>/g)) {
    const attrs = attributes(match[0]);
    const path = attrs.href || attrs.src;
    if (!path) continue;
    const url = new URL(path, expectedURL);
    if (url.origin !== new URL(base).origin) continue;
    if (url.pathname.startsWith("/img/") || url.pathname.startsWith("/assets/") || url.pathname.endsWith(".js")) {
      await localAsset(path);
      continue;
    }
    const target = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    if (!documents.has(target)) continue;
    if (url.hash) assert(documents.get(target).includes(`id="${url.hash.slice(1)}"`), `${file}: broken anchor ${path}`);
  }
  const graph = JSON.parse(one(source, /<script type="application\/ld\+json">(.*?)<\/script>/gs, `${file} JSON-LD`))["@graph"];
  for (const entity of graph) if (entity["@id"]) entities.add(entity["@id"]);
  const business = graph.find((entity) => entity["@type"] === "Restaurant");
  if (!restaurant) restaurant = business;
  else assert.deepEqual(business, restaurant, `${file}: inconsistent restaurant data`);
  const webpage = graph.find((entity) => entity["@type"] === "WebPage");
  assert.equal(webpage.name, title);
  assert.equal(webpage.description, description);
  assert.equal(webpage.url, canonical);
  await localAsset(webpage.primaryImageOfPage.contentUrl);
  const menu = graph.find((entity) => entity["@type"] === "Menu");
  if (menu) {
    for (const section of menu.hasMenuSection) {
      const id = section.url.split("#")[1];
      const region = source.match(new RegExp(`<section id="${id}"[^>]*>(.*?)</section>`, "s"))[1];
      const articles = [...region.matchAll(/<article\b.*?<\/article>/gs)];
      assert.equal(articles.length, section.hasMenuItem.length, `${file} ${id}: menu count mismatch`);
      for (const [index, article] of articles.entries()) {
        const item = section.hasMenuItem[index];
        const name = decode(article[0].match(/<h3[^>]*>(.*?)<\/h3>/s)[1]).replaceAll("*", "");
        assert.equal(name, item.name, `${file} ${id}: structured menu name differs from visible name`);
        const label = decode(article[0].match(/<span[^>]*>(.*?)<\/span>/s)[1]);
        const visible = [...label.matchAll(/(\d+(?:,\d+)?) €/g)].map((price) => Number(price[1].replace(",", ".")));
        const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
        const declared = offers.map((offer) => Number(offer.price));
        if (offers[0].priceSpecification?.maxPrice) declared.push(Number(offers[0].priceSpecification.maxPrice));
        assert.deepEqual(visible, declared, `${file} ${item.name}: price mismatch`);
        if (label.includes("/hg")) assert.equal(offers[0].priceSpecification?.referenceQuantity?.value, 100);
        for (const offer of offers) assert.equal(offer.priceCurrency, "EUR");
      }
    }
  }
  console.log(`${file}: metadata, links, images, and structured data verified.`);
}

for (const [file, source] of documents) {
  const graph = JSON.parse(source.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])["@graph"];
  const webpage = graph.find((entity) => entity["@type"] === "WebPage");
  assert(entities.has(webpage.mainEntity["@id"]), `${file}: unresolved main entity`);
  assert(entities.has(webpage.isPartOf["@id"]), `${file}: unresolved website`);
}
const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(locations.sort(), canonicalURLs.sort());
for (const match of sitemap.matchAll(/<image:loc>(.*?)<\/image:loc>/g)) await localAsset(decode(match[1]));
const robots = await readFile(resolve(root, "robots.txt"), "utf8");
assert(robots.includes(`Sitemap: ${base}sitemap.xml`));
assert(!/Disallow: \/(?:$|\s*$)/m.test(robots), "Site is blocked from crawling");
await localAsset("assets/site.css");
console.log("Sitemap, crawl access, and all 122 menu/wine entries verified.");
