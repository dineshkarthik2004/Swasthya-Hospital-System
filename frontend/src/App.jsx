import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import AppLayout from "./layouts/AppLayout"
import LoginPage from "./pages/LoginPage"
import AdminLayout from "./layouts/AdminLayout"


// Receptionist Pages
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard"
import PatientDirectoryPage from "./pages/receptionist/PatientDirectoryPage"
import VisitHistoryPage from "./pages/receptionist/VisitHistoryPage"
import VisitsPage from "./pages/receptionist/VisitsPage"
import StaffManagementPage from "./pages/receptionist/StaffManagementPage"
import CreatePatientVisitPage from "./pages/receptionist/CreatePatientVisitPage"
import StaffRegistrationPage from "./pages/receptionist/StaffRegistrationPage"

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard"
import ConsultationPage from "./pages/doctor/ConsultationPage"
import MyPatientsHistory from "./pages/doctor/MyPatientsHistory"
import DoctorPatientHistoryDetails from "./pages/doctor/DoctorPatientHistoryDetails"

// Patient Pages
import PatientRecordsPage from "./pages/patient/PatientRecordsPage"
import CreateVisitPage from "./pages/patient/CreateVisitPage"

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard"
import HospitalManagement from "./pages/admin/HospitalManagement"
import DoctorManagement from "./pages/admin/DoctorManagement"
import PatientManagement from "./pages/admin/PatientManagement"
import PaymentManagement from "./pages/admin/PaymentManagement"
import AdminSettings from "./pages/admin/AdminSettings"
import ChangeBranchPage from "./pages/admin/ChangeBranchPage"
import MedicineManagement from "./pages/admin/MedicineManagement"


// Auth
import PatientRegisterPage from "./pages/patient/PatientRegisterPage"

// Print
import PrintPrescription from "./pages/PrintPrescription"

function App() {
  console.log("App component rendered. Current path:", window.location.pathname);
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<PatientRegisterPage />} />
        
        {/* Receptionist Routes */}
        <Route path="/receptionist" element={<AppLayout allowedRoles={["RECEPTIONIST"]} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ReceptionistDashboard />} />
          <Route path="visit-history" element={<VisitHistoryPage />} />
          <Route path="visits" element={<VisitsPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="staff/register" element={<StaffRegistrationPage />} />
          <Route path="staff/change-branch/:id" element={<ChangeBranchPage />} />
          <Route path="patients" element={<PatientDirectoryPage />} />
          <Route path="create-visit" element={<CreatePatientVisitPage />} />
        </Route>

        {/* Doctor Routes */}
        <Route path="/doctor" element={<AppLayout allowedRoles={["DOCTOR", "ADMIN"]} />}>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="consultation" element={<div className="p-10 text-gray-400">Select a patient from dashboard</div>} />
          <Route path="consultation/:id" element={<ConsultationPage />} />
          <Route path="history" element={<MyPatientsHistory />} />
          <Route path="history/:visitId" element={<DoctorPatientHistoryDetails />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="hospitals" element={<HospitalManagement />} />
          <Route path="doctors" element={<DoctorManagement />} />
          <Route path="patients" element={<PatientManagement />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="staff/register" element={<StaffRegistrationPage />} />
          <Route path="staff/change-branch/:id" element={<ChangeBranchPage />} />
          <Route path="visits" element={<VisitsPage />} />
          <Route path="consultations" element={<MyPatientsHistory />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="medicines" element={<MedicineManagement />} />
        </Route>


        {/* Patient Routes */}
        <Route path="/patient" element={<AppLayout allowedRoles={["PATIENT"]} />}>
          <Route path="dashboard" element={<PatientRecordsPage />} />
          <Route path="records" element={<PatientRecordsPage />} />
          <Route path="create-visit" element={<CreateVisitPage />} />
        </Route>

        {/* Unprotected Print Route */}
        <Route path="/print/:visitId" element={<PrintPrescription />} />

        {/* Default Redirect */}
        <Route path="*" element={<div className="h-screen w-full flex items-center justify-center font-black uppercase text-gray-300 tracking-[0.4em] bg-[#F8F9FA]">Error 404: Wing Not Found</div>} />
      </Routes>
    </AuthProvider>
  )
}

export default App
