const API_BASE_URL = "https://mindtraackbackend.app.zeeshan-abbas.tech/api";

export function getApiOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

/** Build absolute URL for a path served from the API host (e.g. /uploads/...). */
export function publicFileUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  const base = getApiOrigin();
  return `${base}${relativePath.startsWith("/") ? relativePath : `/${relativePath}`}`;
}

export class HttpError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

export async function http(path, options = {}, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new HttpError(payload?.message || "Request failed", response.status, payload);
  }
  return payload?.data ?? payload;
}

export async function httpForm(path, formData, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new HttpError(payload?.message || "Request failed", response.status, payload);
  }
  return payload?.data ?? payload;
}

export { API_BASE_URL };
