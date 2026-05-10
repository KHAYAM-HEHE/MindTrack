/** @param {Record<string, string | number | undefined | null>} [params] */
export function toQueryString(params) {
  if (!params || typeof params !== "object") return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}
