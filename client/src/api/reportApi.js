import { http } from "../lib/http";
import { toQueryString } from "../lib/queryString";

export const reportApi = {
  getDaily: (token) => http("/reports/daily", {}, token),
  getWeekly: (token) => http("/reports/weekly", {}, token),
  getMonthly: (token) => http("/reports/monthly", {}, token),
  getYearly: (token) => http("/reports/yearly", {}, token),
  getAdminPlatform: (token) => http("/reports/admin/platform", {}, token),
  listAdminSnapshots: (token, query) => http(`/reports/admin/snapshots${toQueryString(query)}`, {}, token),
  createAdminSnapshot: (body, token) =>
    http("/reports/admin/snapshots", { method: "POST", body: JSON.stringify(body) }, token),
};
