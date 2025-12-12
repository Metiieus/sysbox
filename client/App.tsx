// client/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import LoginForm from "@/components/LoginForm";
import DashboardPage from "@/pages/Dashboard";
import OrdersPage from "@/pages/Orders";
import CustomersPage from "@/pages/Customers";
import ProductsPage from "@/pages/Products";
import ProductionPage from "@/pages/Production";
import AgendaPage from "@/pages/Agenda";
import SettingsPage from "@/pages/Settings";
import { useAuth } from "@/hooks/useAuth";

// Componente separado para as rotas que usa o contexto de auth
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-biobox-green mx-auto mb-4">
            <span className="text-lg font-bold text-biobox-dark">BB</span>
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginForm /> : <Navigate to="/" replace />} />
      
      <Route path="/" element={
        <ProtectedRoute module="dashboard" action="view">
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <ProtectedRoute module="orders" action="view">
          <DashboardLayout>
            <OrdersPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/customers" element={
        <ProtectedRoute module="customers" action="view">
          <DashboardLayout>
            <CustomersPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/products" element={
        <ProtectedRoute module="products" action="view">
          <DashboardLayout>
            <ProductsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/production" element={
        <ProtectedRoute module="production" action="view">
          <DashboardLayout>
            <ProductionPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/agenda" element={
        <ProtectedRoute module="orders" action="approve">
          <DashboardLayout>
            <AgendaPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute module="settings" action="view">
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;