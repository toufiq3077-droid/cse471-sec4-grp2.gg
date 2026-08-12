import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExpertBookingPage from '../pages/expert/ExpertBookingPage';
import ExpertRegistrationPage from '../pages/expert/ExpertRegistrationPage';
import DiseaseDiagnosis from '../features/ai/pages/DiseaseDiagnosis';
import DiagnosisHistory from '../features/ai/pages/DiagnosisHistory';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ProfilePage from '../pages/auth/ProfilePage';
import AdminLoginPage from '../pages/auth/AdminLoginPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserDashboard from '../pages/dashboard/UserDashboard';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RiderDashboard from '../pages/rider/RiderDashboard';
import MarketplacePage from '../pages/marketplace/MarketplacePage';
import ListingDetailPage from '../pages/marketplace/ListingDetailPage';
import MyListingsPage from '../pages/marketplace/MyListingsPage';
import CreateListingPage from '../pages/marketplace/CreateListingPage';
import EditListingPage from '../pages/marketplace/EditListingPage';
import CartPage from '../pages/marketplace/CartPage';
import CheckoutPage from '../pages/marketplace/CheckoutPage';
import OrderInvoicePage from '../pages/marketplace/OrderInvoicePage';
import OrderHistoryPage from '../pages/marketplace/OrderHistoryPage';
import WeatherDashboardPage from '../pages/weather/WeatherDashboardPage';
import FarmerMarketplaceSummaryPage from '../pages/marketplace/FarmerMarketplaceSummaryPage';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm font-medium">Loading application...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root Route: Redirects based on Auth Status & Role */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* User Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      {/* User Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Rider Dashboard */}
      <Route
        path="/rider"
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderDashboard />
          </ProtectedRoute>
        }
      />

      {/* Ecosystem Modules */}
      <Route
        path="/experts"
        element={
          <ProtectedRoute>
            <ExpertBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/experts/register"
        element={
          <ProtectedRoute>
            <ExpertRegistrationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai/diagnosis"
        element={
          <ProtectedRoute>
            <DiseaseDiagnosis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai/history"
        element={
          <ProtectedRoute>
            <DiagnosisHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weather"
        element={
          <ProtectedRoute>
            <WeatherDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Marketplace */}
      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <MarketplacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace/new"
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <EditListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace/:id"
        element={
          <ProtectedRoute>
            <ListingDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-listings"
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <MyListingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer-marketplace-summary"
        element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerMarketplaceSummaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <OrderHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'farmer', 'admin', 'rider']}>
            <OrderInvoicePage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
