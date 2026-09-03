export async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(30_000)
  });
  const raw = await response.text();
  let data = raw;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    // Some APIs legitimately return an empty or plain-text body.
  }

  if (!response.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`${new URL(url).hostname} returned ${response.status}: ${detail.slice(0, 700)}`);
  }
  return { data, headers: response.headers, status: response.status };
}
