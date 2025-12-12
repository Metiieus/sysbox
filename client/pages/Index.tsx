import DashboardLayout from "@/components/DashboardLayout";
import MetricsCards from "@/components/MetricsCards";
import ProductionChart from "@/components/ProductionChart";
import RecentActivity from "@/components/RecentActivity";
import ProductionOverview from "@/components/ProductionOverview";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user } = useAuth();

  const displayName = user?.name
    ? user.name.split(" ")[0]
    : user?.email?.split("@")[0];

  const roleLabel =
    user?.role === "admin"
      ? "Administrador"
      : user?.role === "vendedor"
        ? "Vendedor"
        : "Usuário";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo ao BioBoxsys, {displayName}
          </h1>
          <p className="text-muted-foreground">
            Sistema de Gerenciamento de Produção
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Logado como: {roleLabel}
          </p>
        </div>

        {/* Metrics Cards */}
        <MetricsCards />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Production Chart */}
          <div className="lg:col-span-1">
            <ProductionChart />
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </div>

        {/* Production Overview */}
        <ProductionOverview />
      </div>
    </DashboardLayout>
  );
}
