import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AddFoodPage from './pages/AddFoodPage';
import ScanBarcodePage from './pages/ScanBarcodePage';
import FoodDiaryPage from './pages/FoodDiaryPage';
import NutritionSummaryPage from './pages/NutritionSummaryPage';
import HistoryPage from './pages/HistoryPage';
import GoalsPage from './pages/GoalsPage';
import FoodDatabasePage from './pages/FoodDatabasePage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/add-food" element={<AddFoodPage />} />
                <Route path="/scan-barcode" element={<ScanBarcodePage />} />
                <Route path="/diary" element={<FoodDiaryPage />} />
                <Route path="/summary" element={<NutritionSummaryPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/foods" element={<FoodDatabasePage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
