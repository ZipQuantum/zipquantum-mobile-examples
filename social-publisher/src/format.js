const DEFAULT_TAGS = "#DeepLinking #MobileDev #ZipQuantum";

export function truncate(value, maxLength) {
  const characters = [...String(value ?? "")];
  if (characters.length <= maxLength) return characters.join("");
  return `${characters.slice(0, Math.max(0, maxLength - 1)).join("").trimEnd()}…`;
}

export function formatLinkedIn(article) {
  const intro = `New on the ZipQuantum blog: ${article.title}`;
  const summary = truncate(article.description, 550);
  return [intro, summary, `Read the article: ${article.url}`, DEFAULT_TAGS].filter(Boolean).join("\n\n");
}

export function formatX(article) {
  const suffix = `\n\n${article.url}\n\n#DeepLinking #MobileDev`;
  return `${truncate(`New on the ZipQuantum blog: ${article.title}`, 280 - [...suffix].length)}${suffix}`;
}

export function formatRedditTitle(article) {
  return truncate(`[ZipQuantum] ${article.title}`, 300);
}

export function formatGitHubBody(article, key) {
  const summary = truncate(article.description, 800);
  return [
    summary,
    `**Read the article:** ${article.url}`,
    DEFAULT_TAGS,
    `<!-- zipquantum-blog:${key} -->`
  ].filter(Boolean).join("\n\n");
}
