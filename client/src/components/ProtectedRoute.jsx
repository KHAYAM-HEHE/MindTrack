import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function ProtectedRoute({ children, roles = [] }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  if (!token || !user) return <Navigate to="/auth/login" replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/access-denied" replace />;
  return children;
}

