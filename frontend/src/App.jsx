import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { YogaProvider } from './context/YogaContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import YogaStudio from './pages/YogaStudio';
import AIAssistant from './pages/AIAssistant';
import DietPlanner from './pages/DietPlanner';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <YogaProvider>
          <Routes>
            {/* Public Authentication Routes (accessible only when NOT logged in) */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />

            {/* Email Verification & Password Recovery Routes */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Private Protected Routes (Login required) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Default root path opens Dashboard when authenticated */}
              <Route index element={<Dashboard />} />
              {/* Explicit /dashboard route also renders Dashboard */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="studio" element={<YogaStudio />} />
              <Route path="yoga-studio" element={<YogaStudio />} />
              <Route path="assistant" element={<AIAssistant />} />
              <Route path="diet" element={<DietPlanner />} />
              <Route path="diet-planner" element={<DietPlanner />} />
              <Route path="profile" element={<Profile />} />
              <Route path="activity" element={<Dashboard />} />
              <Route path="activity-tracker" element={<Dashboard />} />
              <Route path="wellness" element={<Dashboard />} />
              <Route path="progress" element={<Dashboard />} />
            </Route>

            {/* Fallback route: redirects to / (which evaluates auth state) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </YogaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
