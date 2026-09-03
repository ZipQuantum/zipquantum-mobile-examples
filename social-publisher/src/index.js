#!/usr/bin/env node
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { publishers, validateChannel } from "./clients.js";
import { articleKey, fetchFeed } from "./feed.js";
import { formatGitHubBody, formatLinkedIn, formatRedditTitle, formatX } from "./format.js";

const directory = path.dirname(fileURLToPath(import.meta.url));
const defaultStatePath = path.resolve(directory, "../data/published.json");
const allChannels = Object.keys(publishers);

function option(name, fallback = undefined) {
  const prefix = `--${name}=`;
  const item = process.argv.find((argument) => argument.startsWith(prefix));
  return item ? item.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function selectedChannels(env) {
  const result = (env.ENABLED_CHANNELS || allChannels.join(","))
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  const invalid = result.filter((name) => !allChannels.includes(name));
  if (invalid.length) throw new Error(`Unknown channels: ${invalid.join(", ")}`);
  return [...new Set(result)];
}

async function loadState(filename) {
  try {
    const parsed = JSON.parse(await readFile(filename, "utf8"));
    return { version: 1, initializedAt: null, articles: {}, ...parsed };
  } catch (error) {
    if (error.code === "ENOENT") return { version: 1, initializedAt: null, articles: {} };
    throw error;
  }
}

async function saveState(filename, state) {
  await mkdir(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await rename(temporary, filename);
}

function articleRecord(article, baseline = false) {
  return {
    title: article.title,
    url: article.url,
    publishedAt: article.publishedAt,
    baseline,
    channels: {}
  };
}

function preview(channel, article, key) {
  if (channel === "linkedin") return formatLinkedIn(article);
  if (channel === "github") return `${article.title}\n\n${formatGitHubBody(article, key)}`;
  if (channel === "reddit") return `${formatRedditTitle(article)}\n${article.url}`;
  return formatX(article);
}

export async function run({ env = process.env, dryRun = hasFlag("dry-run") } = {}) {
  const feedUrl = env.FEED_URL || "https://zq.tn/blog/feed/";
  const channels = selectedChannels(env);
  const statePath = path.resolve(option("state", env.STATE_PATH || defaultStatePath));
  const backfill = Math.max(0, Number.parseInt(option("backfill", env.BACKFILL_COUNT || "0"), 10) || 0);

  const [articles, state] = await Promise.all([fetchFeed(feedUrl), loadState(statePath)]);
  const oldestFirst = [...articles].sort((left, right) => new Date(left.publishedAt) - new Date(right.publishedAt));
  let candidates = oldestFirst;

  if (!state.initializedAt) {
    const publishKeys = new Set(backfill > 0 ? articles.slice(0, backfill).map(articleKey) : []);
    for (const article of articles) {
      const key = articleKey(article);
      state.articles[key] ??= articleRecord(article, !publishKeys.has(key));
    }
    state.initializedAt = new Date().toISOString();
    candidates = oldestFirst.filter((article) => publishKeys.has(articleKey(article)));
    console.log(backfill > 0
      ? `Baseline initialized; ${candidates.length} article(s) selected for backfill.`
      : `Baseline initialized with ${articles.length} existing article(s); nothing was published.`);
    if (!dryRun) await saveState(statePath, state);
  } else if (backfill > 0) {
    const publishKeys = new Set(articles.slice(0, backfill).map(articleKey));
    for (const article of articles) {
      const key = articleKey(article);
      if (!publishKeys.has(key)) continue;
      state.articles[key] ??= articleRecord(article, false);
      state.articles[key].baseline = false;
    }
    console.log(`${publishKeys.size} latest article(s) selected for backfill; already-published channels remain skipped.`);
  }

  let failures = 0;
  for (const article of candidates) {
    const key = articleKey(article);
    state.articles[key] ??= articleRecord(article, false);
    const record = state.articles[key];
    if (record.baseline) continue;

    for (const channel of channels) {
      if (record.channels[channel]?.status === "published") continue;
      if (dryRun) {
        console.log(`\n--- ${channel.toUpperCase()} / ${article.title} ---\n${preview(channel, article, key)}`);
        continue;
      }

      try {
        validateChannel(channel, env);
        const result = await publishers[channel](article, key, env);
        record.channels[channel] = {
          status: "published",
          id: result.id,
          url: result.url,
          publishedAt: new Date().toISOString()
        };
        console.log(`Published ${article.title} to ${channel}: ${result.url}`);
      } catch (error) {
        failures += 1;
        record.channels[channel] = {
          status: "failed",
          failedAt: new Date().toISOString(),
          error: error.message
        };
        console.error(`Failed ${article.title} on ${channel}: ${error.message}`);
      }
      await saveState(statePath, state);
    }
  }

  if (!dryRun) await saveState(statePath, state);
  if (failures) throw new Error(`${failures} publication(s) failed; successful channels were saved and will not be duplicated.`);
  return { articleCount: articles.length, candidateCount: candidates.length, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
