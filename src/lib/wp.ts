import { decryptSecret } from "@/lib/encryption";

export type WordPressCredentials = {
  siteUrl: string;
  username: string;
  appPassword: {
    ciphertext: string;
    iv: string;
    tag: string;
  };
};

function buildAuthHeader(username: string, password: string) {
  const token = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${token}`;
}

export async function testWordPressConnection(creds: WordPressCredentials) {
  const password = decryptSecret(creds.appPassword);
  const response = await fetch(`${creds.siteUrl}/wp-json/wp/v2/users/me`, {
    headers: {
      Authorization: buildAuthHeader(creds.username, password)
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress error: ${response.status} ${text}`);
  }
  return response.json();
}

export async function publishWordPressPost(params: {
  creds: WordPressCredentials;
  title: string;
  content: string;
  status: "draft" | "future";
  dateGmt?: string;
}) {
  const password = decryptSecret(params.creds.appPassword);
  const response = await fetch(`${params.creds.siteUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(params.creds.username, password),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: params.title,
      content: params.content,
      status: params.status,
      date_gmt: params.dateGmt
    })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress publish failed: ${response.status} ${text}`);
  }
  return response.json();
}

export async function fetchSitemapUrls(siteUrl: string): Promise<string[]> {
  const response = await fetch(`${siteUrl}/sitemap.xml`, {
    headers: { "User-Agent": "ContentControlTowerBot/1.0" }
  });
  if (!response.ok) {
    throw new Error("Sitemap not available");
  }
  const xml = await response.text();
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map((match) => match[1]);
}
