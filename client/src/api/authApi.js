import { http } from "../lib/http";

export const authApi = {
  signup: (body) => http("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => http("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  completeLogin2FA: (body) => http("/auth/login/2fa", { method: "POST", body: JSON.stringify(body) }),
  start2FASetup: (token) => http("/auth/2fa/setup/start", { method: "POST" }, token),
  verify2FASetup: (code, token) =>
    http("/auth/2fa/setup/verify", { method: "POST", body: JSON.stringify({ code }) }, token),
  disable2FA: (body, token) => http("/auth/2fa/disable", { method: "POST", body: JSON.stringify(body) }, token),
  acceptTerms: (token) => http("/auth/terms/accept", { method: "POST" }, token),
  getMe: (token) => http("/users/me", {}, token),
  updateMyProfile: (body, token) =>
    http("/users/me/profile", { method: "PATCH", body: JSON.stringify(body) }, token),
};
