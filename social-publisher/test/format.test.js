import assert from "node:assert/strict";
import test from "node:test";
import { formatGitHubBody, formatLinkedIn, formatRedditTitle, formatX, truncate } from "../src/format.js";

const article = {
  title: "How to migrate smart links",
  url: "https://zq.tn/migrate/",
  description: "A practical migration guide for mobile teams."
};

test("formats each social channel", () => {
  assert.match(formatLinkedIn(article), /Read the article: https:\/\/zq\.tn\/migrate\//u);
  assert.match(formatGitHubBody(article, "abc"), /zipquantum-blog:abc/u);
  assert.equal(formatRedditTitle(article), "[ZipQuantum] How to migrate smart links");
  assert.ok([...formatX(article)].length <= 280);
});

test("truncate is unicode safe", () => {
  assert.equal(truncate("😀😀😀", 2), "😀…");
});
