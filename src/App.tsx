import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ReceptionistDashboard from "@/pages/receptionist/ReceptionistDashboard";
import ReceptionistHome from "@/pages/receptionist/ReceptionistHome";
import ReceptionistRegister from "@/pages/receptionist/ReceptionistRegister";
import ReceptionistRecords from "@/pages/receptionist/ReceptionistRecords";
import ReceptionistAppointments from "@/pages/receptionist/ReceptionistAppointments";
import { ReceptionistConsultations, ReceptionistPrescriptions, ReceptionistPendingApprovals } from "@/pages/receptionist/ReceptionistPlaceholders";
import DoctorPortal from "@/pages/doctor/DoctorPortal";
import DoctorHome from "@/pages/doctor/DoctorHome";
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorPatients from "@/pages/doctor/DoctorPatients";
import DoctorConsultationsPlaceholder from "@/pages/doctor/DoctorConsultationsPlaceholder";
import DoctorPrescriptionsPlaceholder from "@/pages/doctor/DoctorPrescriptionsPlaceholder";
import DoctorApprovalsPlaceholder from "@/pages/doctor/DoctorApprovalsPlaceholder";
import NurseDashboard from "@/pages/nurse/NurseDashboard";
import PharmacistDashboard from "@/pages/pharmacist/PharmacistDashboard";
import PharmacistPrescriptions from "@/pages/pharmacist/PharmacistPrescriptions";
import PharmacistDispensing from "@/pages/pharmacist/PharmacistDispensing";
import PharmacistInventory from "@/pages/pharmacist/PharmacistInventory";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import PatientReport from "@/pages/PatientReport";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={isAuthenticated && user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/receptionist/*" element={<ProtectedRoute allowedRoles={['receptionist', 'admin']}><ReceptionistDashboard /></ProtectedRoute>}>
        <Route index element={<ReceptionistHome patients={[]} searchQuery={''} onSearchChange={() => {}} />} />
        <Route path="register" element={<ReceptionistRegister />} />
        <Route path="records" element={<ReceptionistRecords />} />
        <Route path="appointments" element={<ReceptionistAppointments />} />
        <Route path="consultations" element={<ReceptionistConsultations />} />
        <Route path="prescriptions" element={<ReceptionistPrescriptions />} />
        <Route path="pending-approvals" element={<ReceptionistPendingApprovals />} />
      </Route>
      <Route path="/doctor/*" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DoctorPortal /></ProtectedRoute>}>
        <Route index element={<DoctorDashboard />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="consultations" element={<DoctorDashboard />} />
        <Route path="prescriptions" element={<DoctorDashboard />} />
        <Route path="approvals" element={<DoctorDashboard />} />
      </Route>
      <Route path="/nurse/*" element={<ProtectedRoute allowedRoles={['nurse', 'admin']}><NurseDashboard /></ProtectedRoute>} />
      <Route path="/pharmacist" element={<ProtectedRoute allowedRoles={['pharmacist', 'admin']}><PharmacistDashboard /></ProtectedRoute>} />
      <Route path="/pharmacist/prescriptions" element={<ProtectedRoute allowedRoles={['pharmacist', 'admin']}><PharmacistPrescriptions /></ProtectedRoute>} />
      <Route path="/pharmacist/dispensing" element={<ProtectedRoute allowedRoles={['pharmacist', 'admin']}><PharmacistDispensing /></ProtectedRoute>} />
      <Route path="/pharmacist/inventory" element={<ProtectedRoute allowedRoles={['pharmacist', 'admin']}><PharmacistInventory /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/report/:patientId?" element={<ProtectedRoute><PatientReport /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <AuthProvider>
          <WorkflowProvider>
            <AppRoutes />
          </WorkflowProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
