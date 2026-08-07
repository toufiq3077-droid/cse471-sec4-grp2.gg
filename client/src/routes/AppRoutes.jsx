import { Navigate, Route, Routes } from 'react-router-dom';
import ExpertBookingPage from '../pages/expert/ExpertBookingPage';
import ExpertRegistrationPage from '../pages/expert/ExpertRegistrationPage';
import DiseaseDiagnosis from '../features/ai/pages/DiseaseDiagnosis';
import DiagnosisHistory from '../features/ai/pages/DiagnosisHistory';
import HomePage from '../pages/HomePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/experts" element={<ExpertBookingPage />} />
      <Route path="/experts/register" element={<ExpertRegistrationPage />} />
      <Route path="/ai/diagnosis" element={<DiseaseDiagnosis />} />
      <Route path="/ai/history" element={<DiagnosisHistory />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
