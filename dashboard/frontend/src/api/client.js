// dashboard/frontend/src/api/client.js

function buildUrl(apiUrl, path) {
  const base = (apiUrl || "").replace(/\/+$/, ""); // remove trailing /
  const p = String(path || "").replace(/^\/+/, ""); // remove leading /
  return `${base}/${p}`;
}

async function parseJsonSafe(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }
  const text = await response.text();
  return { raw: text };
}

export async function apiGet(apiUrl, path) {
  const url = buildUrl(apiUrl, path);

  const resp = await fetch(url, {
    method: "GET"
  });

  const data = await parseJsonSafe(resp);

  if (!resp.ok) {
    throw new Error(data?.error || `GET ${url} falhou (${resp.status})`);
  }

  return data;
}

export async function apiPost(apiUrl, path, body) {
  const url = buildUrl(apiUrl, path);

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });

  const data = await parseJsonSafe(resp);

  if (!resp.ok) {
    throw new Error(data?.error || `POST ${url} falhou (${resp.status})`);
  }

  return data;
}