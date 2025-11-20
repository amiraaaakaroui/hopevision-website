import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landing } from './components/Landing';
// Auth components
import { RoleSelection } from './components/auth/RoleSelection';
import { LoginPatient } from './components/auth/LoginPatient';
import { LoginDoctor } from './components/auth/LoginDoctor';
import { LoginHospital } from './components/auth/LoginHospital';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { EmailVerification } from './components/auth/EmailVerification';
import { SignupPatientStep1 } from './components/auth/SignupPatientStep1';
import { SignupPatientStep2 } from './components/auth/SignupPatientStep2';
import { SignupDoctorStep1 } from './components/auth/SignupDoctorStep1';
import { SignupDoctorStep2 } from './components/auth/SignupDoctorStep2';
import { SignupDoctorStep3 } from './components/auth/SignupDoctorStep3';
import { SignupHospitalStep1 } from './components/auth/SignupHospitalStep1';
import { SignupHospitalStep2 } from './components/auth/SignupHospitalStep2';
import { Consent } from './components/auth/Consent';
// Patient components
import { PatientLanding } from './components/PatientLanding';
import { PatientConsent } from './components/PatientConsent';
import { PatientSymptoms } from './components/PatientSymptoms';
import { PatientResults } from './components/PatientResults';
import { PatientDetailedReport } from './components/PatientDetailedReport';
import { PatientOrientation } from './components/PatientOrientation';
import { PatientHistory } from './components/PatientHistory';
import { PatientChatPrecision } from './components/PatientChatPrecision';
import { PatientTimeline } from './components/PatientTimeline';
import { DoctorLogin } from './components/DoctorLogin';
import { DoctorDashboard } from './components/DoctorDashboard';
import { DoctorPatientFile } from './components/DoctorPatientFile';
import { DoctorCollaboration } from './components/DoctorCollaboration';
import { DoctorAudit } from './components/DoctorAudit';
import { DoctorAnamnesisAI } from './components/DoctorAnamnesisAI';
import { DoctorAnamnesisConsolidation } from './components/DoctorAnamnesisConsolidation';
import { DoctorChatRelay } from './components/DoctorChatRelay';
import { DoctorDetailedReport } from './components/DoctorDetailedReport';
import { DoctorPatientManagement } from './components/DoctorPatientManagement';
import { DoctorNewPatient } from './components/DoctorNewPatient';
import { DoctorKanban } from './components/DoctorKanban';
import { BookingServiceSelection } from './components/BookingServiceSelection';
import { BookingProviderSelection } from './components/BookingProviderSelection';
import { BookingSchedule } from './components/BookingSchedule';
import { BookingPayment } from './components/BookingPayment';
import { BookingConfirmation } from './components/BookingConfirmation';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminUsers } from './components/AdminUsers';
import { AdminIntegrations } from './components/AdminIntegrations';
import { AdminValidation } from './components/AdminValidation';
import { AdminSecurity } from './components/AdminSecurity';
import { AdminInsights } from './components/AdminInsights';

export type Screen = 
  | 'landing'
  // Auth screens
  | 'role-selection'
  | 'auth-login-patient'
  | 'auth-login-doctor'
  | 'auth-login-hospital'
  | 'auth-forgot-password'
  | 'auth-reset-password'
  | 'auth-email-verification'
  | 'signup-patient-step1'
  | 'signup-patient-step2'
  | 'signup-doctor-step1'
  | 'signup-doctor-step2'
  | 'signup-doctor-step3'
  | 'signup-hospital-step1'
  | 'signup-hospital-step2'
  | 'auth-consent'
  // Patient screens
  | 'patient-landing'
  | 'patient-consent'
  | 'patient-symptoms'
  | 'patient-results'
  | 'patient-detailed-report'
  | 'patient-orientation'
  | 'patient-history'
  | 'patient-chat-precision'
  | 'patient-timeline'
  | 'doctor-login'
  | 'doctor-dashboard'
  | 'doctor-patient-file'
  | 'doctor-collaboration'
  | 'doctor-audit'
  | 'doctor-anamnesis-ai'
  | 'doctor-anamnesis-consolidation'
  | 'doctor-chat-relay'
  | 'doctor-detailed-report'
  | 'doctor-patient-management'
  | 'doctor-new-patient'
  | 'doctor-kanban'
  | 'booking-service-selection'
  | 'booking-provider-selection'
  | 'booking-schedule'
  | 'booking-payment'
  | 'booking-confirmation'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-integrations'
  | 'admin-validation'
  | 'admin-security'
  | 'admin-insights';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | 'admin'>('patient');

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const switchRole = (role: 'patient' | 'doctor' | 'admin') => {
    setUserRole(role);
    if (role === 'patient') setCurrentScreen('patient-landing');
    if (role === 'doctor') setCurrentScreen('doctor-login');
    if (role === 'admin') setCurrentScreen('admin-dashboard');
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Role Switcher for Demo */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setCurrentScreen('landing')}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            currentScreen === 'landing' 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Landing
        </button>
        <button
          onClick={() => switchRole('patient')}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            userRole === 'patient' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Patient
        </button>
        <button
          onClick={() => switchRole('doctor')}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            userRole === 'doctor' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Médecin
        </button>
        <button
          onClick={() => switchRole('admin')}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            userRole === 'admin' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Admin
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {currentScreen === 'landing' && <Landing onNavigate={navigateTo} />}
          {currentScreen === 'role-selection' && <RoleSelection onNavigate={navigateTo} />}
          {currentScreen === 'auth-login-patient' && <LoginPatient onNavigate={navigateTo} />}
          {currentScreen === 'auth-login-doctor' && <LoginDoctor onNavigate={navigateTo} />}
          {currentScreen === 'auth-login-hospital' && <LoginHospital onNavigate={navigateTo} />}
          {currentScreen === 'auth-forgot-password' && <ForgotPassword onNavigate={navigateTo} />}
          {currentScreen === 'auth-reset-password' && <ResetPassword onNavigate={navigateTo} />}
          {currentScreen === 'auth-email-verification' && <EmailVerification onNavigate={navigateTo} />}
          {currentScreen === 'signup-patient-step1' && <SignupPatientStep1 onNavigate={navigateTo} />}
          {currentScreen === 'signup-patient-step2' && <SignupPatientStep2 onNavigate={navigateTo} />}
          {currentScreen === 'signup-doctor-step1' && <SignupDoctorStep1 onNavigate={navigateTo} />}
          {currentScreen === 'signup-doctor-step2' && <SignupDoctorStep2 onNavigate={navigateTo} />}
          {currentScreen === 'signup-doctor-step3' && <SignupDoctorStep3 onNavigate={navigateTo} />}
          {currentScreen === 'signup-hospital-step1' && <SignupHospitalStep1 onNavigate={navigateTo} />}
          {currentScreen === 'signup-hospital-step2' && <SignupHospitalStep2 onNavigate={navigateTo} />}
          {currentScreen === 'auth-consent' && <Consent onNavigate={navigateTo} />}
          {currentScreen === 'patient-landing' && <PatientLanding onNavigate={navigateTo} />}
          {currentScreen === 'patient-consent' && <PatientConsent onNavigate={navigateTo} />}
          {currentScreen === 'patient-symptoms' && <PatientSymptoms onNavigate={navigateTo} />}
          {currentScreen === 'patient-results' && <PatientResults onNavigate={navigateTo} />}
          {currentScreen === 'patient-detailed-report' && <PatientDetailedReport onNavigate={navigateTo} />}
          {currentScreen === 'patient-orientation' && <PatientOrientation onNavigate={navigateTo} />}
          {currentScreen === 'patient-history' && <PatientHistory onNavigate={navigateTo} />}
          {currentScreen === 'patient-chat-precision' && <PatientChatPrecision onNavigate={navigateTo} />}
          {currentScreen === 'patient-timeline' && <PatientTimeline onNavigate={navigateTo} />}
          {currentScreen === 'doctor-login' && <DoctorLogin onNavigate={navigateTo} />}
          {currentScreen === 'doctor-dashboard' && <DoctorDashboard onNavigate={navigateTo} />}
          {currentScreen === 'doctor-patient-file' && <DoctorPatientFile onNavigate={navigateTo} />}
          {currentScreen === 'doctor-collaboration' && <DoctorCollaboration onNavigate={navigateTo} />}
          {currentScreen === 'doctor-audit' && <DoctorAudit onNavigate={navigateTo} />}
          {currentScreen === 'doctor-anamnesis-ai' && <DoctorAnamnesisAI onNavigate={navigateTo} />}
          {currentScreen === 'doctor-anamnesis-consolidation' && <DoctorAnamnesisConsolidation onNavigate={navigateTo} />}
          {currentScreen === 'doctor-chat-relay' && <DoctorChatRelay onNavigate={navigateTo} />}
          {currentScreen === 'doctor-detailed-report' && <DoctorDetailedReport onNavigate={navigateTo} />}
          {currentScreen === 'doctor-patient-management' && <DoctorPatientManagement onNavigate={navigateTo} />}
          {currentScreen === 'doctor-new-patient' && <DoctorNewPatient onNavigate={navigateTo} />}
          {currentScreen === 'doctor-kanban' && <DoctorKanban onNavigate={navigateTo} />}
          {currentScreen === 'booking-service-selection' && <BookingServiceSelection onNavigate={navigateTo} />}
          {currentScreen === 'booking-provider-selection' && <BookingProviderSelection onNavigate={navigateTo} />}
          {currentScreen === 'booking-schedule' && <BookingSchedule onNavigate={navigateTo} />}
          {currentScreen === 'booking-payment' && <BookingPayment onNavigate={navigateTo} />}
          {currentScreen === 'booking-confirmation' && <BookingConfirmation onNavigate={navigateTo} />}
          {currentScreen === 'admin-dashboard' && <AdminDashboard onNavigate={navigateTo} />}
          {currentScreen === 'admin-users' && <AdminUsers onNavigate={navigateTo} />}
          {currentScreen === 'admin-integrations' && <AdminIntegrations onNavigate={navigateTo} />}
          {currentScreen === 'admin-validation' && <AdminValidation onNavigate={navigateTo} />}
          {currentScreen === 'admin-security' && <AdminSecurity onNavigate={navigateTo} />}
          {currentScreen === 'admin-insights' && <AdminInsights onNavigate={navigateTo} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}