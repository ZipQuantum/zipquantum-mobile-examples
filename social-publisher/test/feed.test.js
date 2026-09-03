import assert from "node:assert/strict";
import test from "node:test";
import { articleKey, parseRss, stripHtml } from "../src/feed.js";

test("parses a WordPress RSS item", () => {
  const xml = `<?xml version="1.0"?><rss><channel><item>
    <title><![CDATA[Hello &amp; goodbye]]></title>
    <link>https://zq.tn/hello/</link>
    <guid isPermaLink="false">post-42</guid>
    <pubDate>Wed, 02 Sep 2026 17:31:21 +0000</pubDate>
    <description><![CDATA[<p>A useful <strong>summary</strong>.</p>]]></description>
    <content:encoded><![CDATA[<p><img src="https://zq.tn/image.png" alt="Useful diagram"></p>]]></content:encoded>
  </item></channel></rss>`;
  const [article] = parseRss(xml);
  assert.deepEqual(article, {
    guid: "post-42",
    url: "https://zq.tn/hello/",
    title: "Hello & goodbye",
    description: "A useful summary.",
    publishedAt: "Wed, 02 Sep 2026 17:31:21 +0000",
    imageUrl: "https://zq.tn/image.png",
    imageAlt: "Useful diagram"
  });
  assert.equal(articleKey(article).length, 24);
});

test("strips scripts and normalizes whitespace", () => {
  assert.equal(stripHtml("<p>Hello&nbsp; world</p><script>bad()</script>"), "Hello world");
});
