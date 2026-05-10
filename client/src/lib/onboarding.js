const keyFor = (user) => {
  const id = user?.id || user?._id || user?.email || "unknown";
  return `mindtrack_onboarded_${id}`;
};

export function isOnboardingComplete(user) {
  if (!user) return false;
  return localStorage.getItem(keyFor(user)) === "true";
}

export function markOnboardingComplete(user) {
  if (!user) return;
  localStorage.setItem(keyFor(user), "true");
}

export function roleDashboardPath(role) {
  if (role === "CLIENT") return "/client/dashboard";
  if (role === "PROFESSIONAL") return "/psychiatrist/dashboard";
  if (role === "EMPLOYEE") return "/employee/dashboard";
  if (role === "HR") return "/hr/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";
  return "/";
}

export function roleOnboardingPath(role) {
  if (role === "CLIENT") return "/onboarding/client";
  if (role === "PROFESSIONAL") return "/onboarding/psychiatrist";
  if (role === "EMPLOYEE") return "/employee/dashboard";
  if (role === "HR") return "/hr/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";
  return "/";
}

