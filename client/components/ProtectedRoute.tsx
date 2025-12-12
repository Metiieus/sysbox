import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  module: string;
  action: string;
}

export default function ProtectedRoute({
  children,
  module,
  action,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkPermission } = useAuth();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (module && action && !checkPermission(module, action)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta área.
          </p>
          <Navigate to="/orders" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
