import { createHmac, randomBytes } from "node:crypto";
import { formatGitHubBody, formatLinkedIn, formatRedditTitle, formatX, truncate } from "./format.js";
import { request } from "./http.js";

function required(env, names) {
  const missing = names.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing configuration: ${missing.join(", ")}`);
}

function oauthEncode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/gu, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function validateChannel(name, env) {
  if (name === "linkedin") required(env, ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_AUTHOR_URN", "LINKEDIN_VERSION"]);
  if (name === "github") required(env, ["GITHUB_TOKEN", "GITHUB_REPOSITORY", "GITHUB_DISCUSSION_CATEGORY"]);
  if (name === "reddit") required(env, ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_REFRESH_TOKEN", "REDDIT_SUBREDDIT", "REDDIT_USER_AGENT"]);
  if (name === "x") required(env, ["X_CONSUMER_KEY", "X_CONSUMER_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"]);
}

export async function publishLinkedIn(article, _key, env) {
  let thumbnail;
  if (article.imageUrl) {
    try {
      const initialized = await request("https://api.linkedin.com/rest/images?action=initializeUpload", {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
          "content-type": "application/json",
          "linkedin-version": env.LINKEDIN_VERSION,
          "x-restli-protocol-version": "2.0.0"
        },
        body: JSON.stringify({ initializeUploadRequest: { owner: env.LINKEDIN_AUTHOR_URN } })
      });
      const { uploadUrl, image } = initialized.data.value ?? {};
      if (!uploadUrl || !image) throw new Error("LinkedIn did not return image upload details");

      const source = await fetch(article.imageUrl, { signal: AbortSignal.timeout(30_000) });
      if (!source.ok) throw new Error(`Article image returned ${source.status}`);
      const uploaded = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
          "content-type": source.headers.get("content-type") || "application/octet-stream"
        },
        body: await source.arrayBuffer(),
        signal: AbortSignal.timeout(60_000)
      });
      if (!uploaded.ok) throw new Error(`LinkedIn image upload returned ${uploaded.status}`);
      thumbnail = image;
    } catch (error) {
      console.warn(`LinkedIn thumbnail skipped: ${error.message}`);
    }
  }

  const payload = {
    author: env.LINKEDIN_AUTHOR_URN,
    commentary: formatLinkedIn(article),
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    content: {
      article: {
        source: article.url,
        title: truncate(article.title, 200),
        description: truncate(article.description, 256),
        ...(thumbnail ? { thumbnail } : {})
      }
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false
  };
  const result = await request("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
      "content-type": "application/json",
      "linkedin-version": env.LINKEDIN_VERSION,
      "x-restli-protocol-version": "2.0.0"
    },
    body: JSON.stringify(payload)
  });
  const id = result.headers.get("x-restli-id") || "created";
  return { id, url: id === "created" ? "https://www.linkedin.com/company/zipquantum/posts/" : `https://www.linkedin.com/feed/update/${id}/` };
}

async function githubGraphql(query, variables, env) {
  const result = await request("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "content-type": "application/json",
      "user-agent": "ZipQuantumBlogPublisher/1.0"
    },
    body: JSON.stringify({ query, variables })
  });
  if (result.data.errors?.length) throw new Error(`GitHub GraphQL error: ${JSON.stringify(result.data.errors).slice(0, 700)}`);
  return result.data.data;
}

export async function publishGitHub(article, key, env) {
  const [owner, name] = env.GITHUB_REPOSITORY.split("/");
  if (!owner || !name) throw new Error("GITHUB_REPOSITORY must use OWNER/REPOSITORY format");
  const metadata = await githubGraphql(
    `query PublisherRepository($owner: String!, $name: String!, $slug: String!) {
      repository(owner: $owner, name: $name) { id discussionCategory(slug: $slug) { id } }
    }`,
    { owner, name, slug: env.GITHUB_DISCUSSION_CATEGORY },
    env
  );
  if (!metadata.repository) throw new Error(`GitHub repository not found: ${env.GITHUB_REPOSITORY}`);
  if (!metadata.repository.discussionCategory) throw new Error(`GitHub Discussion category not found: ${env.GITHUB_DISCUSSION_CATEGORY}`);

  const created = await githubGraphql(
    `mutation PublishBlogDiscussion($input: CreateDiscussionInput!) {
      createDiscussion(input: $input) { discussion { id number url } }
    }`,
    {
      input: {
        repositoryId: metadata.repository.id,
        categoryId: metadata.repository.discussionCategory.id,
        title: truncate(article.title, 200),
        body: formatGitHubBody(article, key),
        clientMutationId: key
      }
    },
    env
  );
  return { id: created.createDiscussion.discussion.id, url: created.createDiscussion.discussion.url };
}

async function redditAccessToken(env) {
  const credentials = Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: env.REDDIT_REFRESH_TOKEN });
  const result = await request("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": env.REDDIT_USER_AGENT
    },
    body
  });
  if (!result.data.access_token) throw new Error("Reddit did not return an access token");
  return result.data.access_token;
}

export async function publishReddit(article, _key, env) {
  const token = await redditAccessToken(env);
  const body = new URLSearchParams({
    api_type: "json",
    kind: "link",
    raw_json: "1",
    resubmit: "false",
    sendreplies: "true",
    sr: env.REDDIT_SUBREDDIT.replace(/^r\//u, ""),
    title: formatRedditTitle(article),
    url: article.url
  });
  const result = await request("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": env.REDDIT_USER_AGENT
    },
    body
  });
  const errors = result.data?.json?.errors ?? [];
  if (errors.length) throw new Error(`Reddit API error: ${JSON.stringify(errors).slice(0, 700)}`);
  const data = result.data?.json?.data ?? {};
  return { id: data.name || data.id || "created", url: data.url || `https://www.reddit.com/r/${env.REDDIT_SUBREDDIT}/new/` };
}

function xAuthorizationHeader(env) {
  const oauth = {
    oauth_consumer_key: env.X_CONSUMER_KEY,
    oauth_nonce: randomBytes(18).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: env.X_ACCESS_TOKEN,
    oauth_version: "1.0"
  };
  const normalized = Object.entries(oauth)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${oauthEncode(key)}=${oauthEncode(value)}`)
    .join("&");
  const baseUrl = "https://api.x.com/2/tweets";
  const signatureBase = `POST&${oauthEncode(baseUrl)}&${oauthEncode(normalized)}`;
  const signingKey = `${oauthEncode(env.X_CONSUMER_SECRET)}&${oauthEncode(env.X_ACCESS_TOKEN_SECRET)}`;
  oauth.oauth_signature = createHmac("sha1", signingKey).update(signatureBase).digest("base64");
  return `OAuth ${Object.entries(oauth).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${oauthEncode(key)}=\"${oauthEncode(value)}\"`).join(", ")}`;
}

export async function publishX(article, _key, env) {
  const result = await request("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      authorization: xAuthorizationHeader(env),
      "content-type": "application/json"
    },
    body: JSON.stringify({ text: formatX(article) })
  });
  const id = result.data?.data?.id;
  if (!id) throw new Error("X did not return a post id");
  return { id, url: `https://x.com/i/web/status/${id}` };
}

export const publishers = {
  linkedin: publishLinkedIn,
  github: publishGitHub,
  reddit: publishReddit,
  x: publishX
};
