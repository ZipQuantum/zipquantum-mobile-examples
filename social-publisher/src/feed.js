import { createHash } from "node:crypto";

function decodeXml(value = "") {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: "\"",
    nbsp: " "
  };

  return value
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/u, "$1")
    .replace(/&#x([0-9a-f]+);/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/gu, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&([a-z]+);/giu, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function tag(block, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "iu"));
  return match ? decodeXml(match[1].trim()) : "";
}

function imageFromHtml(html = "") {
  const tagMatch = html.match(/<img\b[^>]*>/iu);
  if (!tagMatch) return { imageUrl: "", imageAlt: "" };
  const src = tagMatch[0].match(/\bsrc\s*=\s*["']([^"']+)["']/iu)?.[1] ?? "";
  const alt = tagMatch[0].match(/\balt\s*=\s*["']([^"']*)["']/iu)?.[1] ?? "";
  return { imageUrl: decodeXml(src), imageAlt: stripHtml(decodeXml(alt)) };
}

export function stripHtml(value = "") {
  return decodeXml(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
      .replace(/<[^>]+>/gu, " ")
  )
    .replace(/\s+/gu, " ")
    .replace(/\s+([.,!?;:])/gu, "$1")
    .trim();
}

export function articleKey(article) {
  return createHash("sha256").update(article.guid || article.url).digest("hex").slice(0, 24);
}

export function parseRss(xml) {
  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/giu)].map((match) => {
    const block = match[1];
    const url = tag(block, "link");
    const guid = tag(block, "guid") || url;
    const title = stripHtml(tag(block, "title"));
    const content = tag(block, "content:encoded");
    const description = stripHtml(tag(block, "description") || content);
    const publishedAt = tag(block, "pubDate");
    const image = imageFromHtml(content || tag(block, "description"));

    return { guid, url, title, description, publishedAt, ...image };
  });

  return items.filter((item) => item.url && item.title);
}

export async function fetchFeed(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: { "user-agent": "ZipQuantumBlogPublisher/1.0 (+https://zq.tn/)" },
    signal: AbortSignal.timeout(20_000)
  });

  if (!response.ok) {
    throw new Error(`Feed request failed (${response.status} ${response.statusText})`);
  }

  const articles = parseRss(await response.text());
  if (articles.length === 0) {
    throw new Error("The feed did not contain any valid articles");
  }
  return articles;
}
