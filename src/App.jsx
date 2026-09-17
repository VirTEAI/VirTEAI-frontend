import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Services from './pages/Services';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyResetCode from './pages/VerifyResetCode';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import ProfilePsicologo from './pages/ProfilePsicologo';
import Dashboard from './pages/Dashboard';
import DashboardWorld from './pages/DashboardWorld';
import SessionSummary from './pages/SessionSummary';
import DashboardAdmin from './pages/DashboardAdmin';
import AccessCodes from './pages/AccessCodes';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/about-us" element={<PageTransition><AboutUs /></PageTransition>} />
        <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route
          path="/esqueci-senha"
          element={
            <PageTransition>
              <ForgotPassword />
            </PageTransition>
          }
        />
        <Route
          path="/verificar-codigo"
          element={
            <PageTransition>
              <VerifyResetCode />
            </PageTransition>
          }
        />
        <Route
          path="/redefinir-senha"
          element={
            <PageTransition>
              <ResetPassword />
            </PageTransition>
          }
        />

        <Route
          path="/paciente"
          element={
            <RequireAuth role={['paciente', 'terapeuta', 'admin']}>
              <PageTransition>
                <Profile />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/psicologo"
          element={
            <RequireAuth role={['terapeuta', 'admin']}>
              <PageTransition>
                <ProfilePsicologo />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth role={['paciente', 'terapeuta']}>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/mundo/:worldId"
          element={
            <RequireAuth>
              <PageTransition>
                <DashboardWorld />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/mundo/:worldId/resumo"
          element={
            <RequireAuth>
              <PageTransition>
                <SessionSummary />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <PageTransition>
                <DashboardAdmin />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/codigos"
          element={
            <RequireAuth role={['terapeuta', 'admin']}>
              <PageTransition>
                <AccessCodes />
              </PageTransition>
            </RequireAuth>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
