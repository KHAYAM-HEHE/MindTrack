import { Outlet, useLocation } from "react-router-dom";
import AdminShell from "./AdminShell";

const titles = {
  "/admin/dashboard": "Overview",
  "/admin/requests": "Requests",
  "/admin/verifications": "Verifications",
  "/admin/psychiatrists": "Psychiatrists",
  "/admin/clients": "Clients",
  "/admin/employees": "Employees",
  "/admin/hr": "HR",
  "/admin/complaints": "Complaints",
  "/admin/tickets": "Tickets",
  "/admin/reports": "Reports",
  "/admin/audit-logs": "Audit log",
};

function titleForPath(pathname) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/admin/verifications/")) return "Verification detail";
  if (pathname.startsWith("/admin/psychiatrists/")) return "Psychiatrist detail";
  if (pathname.startsWith("/admin/clients/")) return "Client detail";
  if (pathname.startsWith("/admin/employees/")) return "Employee detail";
  if (pathname.startsWith("/admin/hr/")) return "HR user detail";
  if (pathname.startsWith("/admin/complaints/")) return "Complaint detail";
  return "Admin";
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  return <AdminShell title={titleForPath(pathname)}><Outlet /></AdminShell>;
}

