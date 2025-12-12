// client/pages/Dashboard.tsx (atualização)
import { useEffect, useState } from "react";
import MetricsCards from "@/components/MetricsCards";
import RecentActivity from "@/components/RecentActivity";
import ProductionChart from "@/components/ProductionChart";
import ProductionOverview from "@/components/ProductionOverview";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Garantir que os dados sejam carregados após a autenticação
    if (!isLoading && user) {
      setDataLoaded(true);
      console.log("📊 Dashboard carregado para:", user.name);
    }
  }, [isLoading, user]);

  if (isLoading || !dataLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-biobox-green mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {user?.name || 'Usuário'}!
        </p>
      </div>

      <MetricsCards />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <ProductionChart />
        <ProductionOverview />
      </div>
      
      <RecentActivity />
    </div>
  );
}