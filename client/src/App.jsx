import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProfessionalVerifiedRoute } from "./components/ProfessionalVerifiedRoute";
import { useAuthStore } from "./store/authStore";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ClientDashboardPage from "./pages/client/ClientDashboardPage";
import ClientProfilePage from "./pages/client/ClientProfilePage";
import ClientSettingsPage from "./pages/client/ClientSettingsPage";
import ClientGoalsPage from "./pages/client/ClientGoalsPage";
import ClientTasksPage from "./pages/client/ClientTasksPage";
import ClientMoodSurveyPage from "./pages/client/ClientMoodSurveyPage";
import ClientMedicationsPage from "./pages/client/ClientMedicationsPage";
import ClientMedicationImpactPage from "./pages/client/ClientMedicationImpactPage";
import ClientProfessionalsPage from "./pages/client/ClientProfessionalsPage";
import ClientAppointmentsPage from "./pages/client/ClientAppointmentsPage";
import ClientChatPage from "./pages/client/ClientChatPage";
import ClientComplaintsPage from "./pages/client/ClientComplaintsPage";
import ClientReportsPage from "./pages/client/ClientReportsPage";
import ClientNotificationsPage from "./pages/client/ClientNotificationsPage";
import PsychiatristDashboardPage from "./pages/psychiatrist/PsychiatristDashboardPage";
import RequestInReviewPage from "./pages/psychiatrist/RequestInReviewPage";
import PsychiatristRequestsInboxPage from "./pages/psychiatrist/PsychiatristRequestsInboxPage";
import PsychiatristSecureChatPage from "./pages/psychiatrist/PsychiatristSecureChatPage";
import PsychiatristExternalSchedulerPage from "./pages/psychiatrist/PsychiatristExternalSchedulerPage";
import PsychiatristSchedulePage from "./pages/psychiatrist/PsychiatristSchedulePage";
import PsychiatristClientCarePage from "./pages/psychiatrist/PsychiatristClientCarePage";
import PsychiatristReviewsPage from "./pages/psychiatrist/PsychiatristReviewsPage";
import PsychiatristProfileManagePage from "./pages/psychiatrist/PsychiatristProfileManagePage";
import PsychiatristProfileDetailPage from "./pages/psychiatrist/PsychiatristProfileDetailPage";
import PsychiatristAbuseReportsPage from "./pages/psychiatrist/PsychiatristAbuseReportsPage";
import PsychiatristNotificationsPage from "./pages/psychiatrist/PsychiatristNotificationsPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminRequestsPage from "./pages/admin/AdminRequestsPage";
import AdminVerificationsPage from "./pages/admin/AdminVerificationsPage";
import AdminVerificationDetailPage from "./pages/admin/AdminVerificationDetailPage";
import AdminPsychiatristsPage from "./pages/admin/AdminPsychiatristsPage";
import AdminPsychiatristDetailPage from "./pages/admin/AdminPsychiatristDetailPage";
import AdminClientsPage from "./pages/admin/AdminClientsPage";
import AdminClientDetailPage from "./pages/admin/AdminClientDetailPage";
import AdminEmployeesPage from "./pages/admin/AdminEmployeesPage";
import AdminEmployeeDetailPage from "./pages/admin/AdminEmployeeDetailPage";
import AdminHrPage from "./pages/admin/AdminHrPage";
import AdminHrDetailPage from "./pages/admin/AdminHrDetailPage";
import AdminComplaintsPage from "./pages/admin/AdminComplaintsPage";
import AdminComplaintDetailPage from "./pages/admin/AdminComplaintDetailPage";
import AdminTicketsPage from "./pages/admin/AdminTicketsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import HrDashboardPage from "./pages/hr/HrDashboardPage";
import HrEmployeeManagementPage from "./pages/hr/HrEmployeeManagementPage";
import HrCreateEmployeePage from "./pages/hr/HrCreateEmployeePage";
import HrVerificationsPage from "./pages/hr/HrVerificationsPage";
import EmployeeDashboardPage from "./pages/employee/EmployeeDashboardPage";
import EmployeeVerificationsPage from "./pages/employee/EmployeeVerificationsPage";
import EmployeeReviewsPage from "./pages/employee/EmployeeReviewsPage";
import ClientOnboardingPage from "./pages/onboarding/ClientOnboardingPage";
import PsychiatristOnboardingPage from "./pages/onboarding/PsychiatristOnboardingPage";

function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/onboarding/client"
        element={
          <ProtectedRoute roles={["CLIENT"]}>
            <ClientOnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/psychiatrist"
        element={
          <ProtectedRoute roles={["PROFESSIONAL"]}>
            <PsychiatristOnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute roles={["CLIENT"]}>
            <ClientDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/client/profile" element={<ProtectedRoute roles={["CLIENT"]}><ClientProfilePage /></ProtectedRoute>} />
      <Route path="/client/settings" element={<ProtectedRoute roles={["CLIENT"]}><ClientSettingsPage /></ProtectedRoute>} />
      <Route path="/client/goals" element={<ProtectedRoute roles={["CLIENT"]}><ClientGoalsPage /></ProtectedRoute>} />
      <Route path="/client/tasks" element={<ProtectedRoute roles={["CLIENT"]}><ClientTasksPage /></ProtectedRoute>} />
      <Route path="/client/mood-survey" element={<ProtectedRoute roles={["CLIENT"]}><ClientMoodSurveyPage /></ProtectedRoute>} />
      <Route path="/client/medications" element={<ProtectedRoute roles={["CLIENT"]}><ClientMedicationsPage /></ProtectedRoute>} />
      <Route path="/client/medication-impact" element={<ProtectedRoute roles={["CLIENT"]}><ClientMedicationImpactPage /></ProtectedRoute>} />
      <Route path="/client/professionals" element={<ProtectedRoute roles={["CLIENT"]}><ClientProfessionalsPage /></ProtectedRoute>} />
      <Route path="/client/appointments" element={<ProtectedRoute roles={["CLIENT"]}><ClientAppointmentsPage /></ProtectedRoute>} />
      <Route path="/client/appointments/book" element={<ProtectedRoute roles={["CLIENT"]}><ClientProfessionalsPage /></ProtectedRoute>} />
      <Route path="/client/chat" element={<ProtectedRoute roles={["CLIENT"]}><ClientChatPage /></ProtectedRoute>} />
      <Route path="/client/complaints" element={<ProtectedRoute roles={["CLIENT"]}><ClientComplaintsPage /></ProtectedRoute>} />
      <Route path="/client/complaints/new" element={<ProtectedRoute roles={["CLIENT"]}><ClientComplaintsPage /></ProtectedRoute>} />
      <Route path="/client/reports" element={<ProtectedRoute roles={["CLIENT"]}><ClientReportsPage /></ProtectedRoute>} />
      <Route path="/client/notifications" element={<ProtectedRoute roles={["CLIENT"]}><ClientNotificationsPage /></ProtectedRoute>} />
      <Route
        path="/psychiatrist/dashboard"
        element={
          <ProfessionalVerifiedRoute>
            <PsychiatristDashboardPage />
          </ProfessionalVerifiedRoute>
        }
      />
      <Route
        path="/professional/request-in-review"
        element={
          <ProtectedRoute roles={["PROFESSIONAL"]}>
            <RequestInReviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="/psychiatrist/notifications" element={<ProfessionalVerifiedRoute><PsychiatristNotificationsPage /></ProfessionalVerifiedRoute>} />
      <Route path="/psychiatrist/requests" element={<ProfessionalVerifiedRoute><PsychiatristRequestsInboxPage /></ProfessionalVerifiedRoute>} />
      <Route path="/psychiatrist/schedule" element={<ProfessionalVerifiedRoute><PsychiatristSchedulePage /></ProfessionalVerifiedRoute>} />
      <Route path="/psychiatrist/client-care" element={<ProfessionalVerifiedRoute><PsychiatristClientCarePage /></ProfessionalVerifiedRoute>} />
      <Route path="/psychiatrist/chat" element={<ProfessionalVerifiedRoute><PsychiatristSecureChatPage /></ProfessionalVerifiedRoute>} />
      <Route path="/psychiatrist/external-scheduler" element={<ProfessionalVerifiedRoute><PsychiatristExternalSchedulerPage /></ProfessionalVerifiedRoute>} />
      <Route path="/psychiatrist/reviews" element={<ProfessionalVerifiedRoute><PsychiatristReviewsPage /></ProfessionalVerifiedRoute>} />
      <Route path="/psychiatrist/profile" element={<ProfessionalVerifiedRoute><PsychiatristProfileManagePage /></ProfessionalVerifiedRoute>} />
      <Route path="/psychiatrist/profile/public" element={<ProfessionalVerifiedRoute><PsychiatristProfileDetailPage /></ProfessionalVerifiedRoute>} />
      <Route path="/psychiatrist/abuse-reports" element={<ProfessionalVerifiedRoute><PsychiatristAbuseReportsPage /></ProfessionalVerifiedRoute>} />
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute roles={["HR", "ADMIN"]}>
            <HrDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/employees"
        element={
          <ProtectedRoute roles={["HR", "ADMIN"]}>
            <HrEmployeeManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/employees/new"
        element={
          <ProtectedRoute roles={["HR", "ADMIN"]}>
            <HrCreateEmployeePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/verifications"
        element={
          <ProtectedRoute roles={["HR", "ADMIN"]}>
            <HrVerificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="requests" element={<AdminRequestsPage />} />
        <Route path="verifications" element={<AdminVerificationsPage />} />
        <Route path="verifications/:id" element={<AdminVerificationDetailPage />} />
        <Route path="psychiatrists" element={<AdminPsychiatristsPage />} />
        <Route path="psychiatrists/:id" element={<AdminPsychiatristDetailPage />} />
        <Route path="clients" element={<AdminClientsPage />} />
        <Route path="clients/:id" element={<AdminClientDetailPage />} />
        <Route path="employees" element={<AdminEmployeesPage />} />
        <Route path="employees/:id" element={<AdminEmployeeDetailPage />} />
        <Route path="hr" element={<AdminHrPage />} />
        <Route path="hr/:id" element={<AdminHrDetailPage />} />
        <Route path="complaints" element={<AdminComplaintsPage />} />
        <Route path="complaints/:id" element={<AdminComplaintDetailPage />} />
        <Route path="tickets" element={<AdminTicketsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute roles={["EMPLOYEE", "HR", "ADMIN"]}>
            <EmployeeDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/verifications"
        element={
          <ProtectedRoute roles={["EMPLOYEE", "HR", "ADMIN"]}>
            <EmployeeVerificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/reviews"
        element={
          <ProtectedRoute roles={["EMPLOYEE", "HR", "ADMIN"]}>
            <EmployeeReviewsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/access-denied" element={<div className="p-6">Access denied.</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
