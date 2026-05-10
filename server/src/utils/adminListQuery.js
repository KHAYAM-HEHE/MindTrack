const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * @param {Record<string, string | undefined>} query
 */
function parseListQuery(query = {}) {
  const page = query.page != null && query.page !== "" ? Math.max(1, parseInt(String(query.page), 10) || 1) : null;
  const limitRaw =
    query.limit != null && query.limit !== "" ? parseInt(String(query.limit), 10) || DEFAULT_LIMIT : DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, limitRaw), MAX_LIMIT);
  const skip = page != null ? (page - 1) * limit : 0;
  const search = (query.search || query.q || "").trim();
  const role = query.role || "";
  const status = query.status || "";
  const verificationStatus = query.verificationStatus || "";
  const allowedSort = ["createdAt", "updatedAt", "name", "email", "startTime"];
  const sortField = allowedSort.includes(String(query.sort)) ? String(query.sort) : "createdAt";
  const sortDir = String(query.order || "desc").toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDir };
  return { page, limit, skip, search, role, status, verificationStatus, sort };
}

module.exports = { parseListQuery, DEFAULT_LIMIT, MAX_LIMIT };
