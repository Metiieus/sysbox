import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Calendar,
  Truck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useFirebase, Order } from "@/hooks/useFirebase";

type MetricTrend = "up" | "down" | "neutral" | undefined;

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: MetricTrend;
  trendValue?: string;
  color?: "green" | "blue" | "orange" | "red";
}

const metricColors = {
  green: "bg-biobox-green/10 text-biobox-green",
  blue: "bg-blue-500/10 text-blue-500",
  orange: "bg-orange-500/10 text-orange-500",
  red: "bg-red-500/10 text-red-500",
};

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "green",
}: MetricCardProps) {
  return (
    <Card className="bg-card border-border transition-colors hover:bg-card/80">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className="mt-2 flex items-center space-x-1">
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-biobox-green" />
                ) : trend === "down" ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                <span
                  className={`text-xs font-medium ${
                    trend === "up"
                      ? "text-biobox-green"
                      : trend === "down"
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${metricColors[color]}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type EnrichedOrder = {
  raw: Order;
  status: Order["status"];
  totalAmount: number;
  createdAt: Date;
  deliveryDate: Date | null;
  completedDate: Date | null;
};

const normalizeStatus = (value: unknown): Order["status"] => {
  const normalized =
    typeof value === "string"
      ? value.toLowerCase()
      : (value as Order["status"] | undefined);
  const validStatuses: Order["status"][] = [
    "pending",
    "confirmed",
    "in_production",
    "quality_check",
    "ready",
    "delivered",
    "cancelled",
  ];

  return validStatuses.includes(normalized as Order["status"])
    ? (normalized as Order["status"])
    : "pending";
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[^0-9,-]+/g, "").replace(",", "."));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  if (typeof value === "object" && value !== null) {
    const maybeNumber = (value as { toNumber?: () => number }).toNumber?.();
    if (typeof maybeNumber === "number" && Number.isFinite(maybeNumber)) {
      return maybeNumber;
    }
  }
  return fallback;
};

const parseDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const computeOrderTotalAmount = (order: Order): number => {
  const direct = toNumber((order as any).total_amount);
  if (direct > 0) {
    return direct;
  }

  if (Array.isArray(order.products) && order.products.length > 0) {
    const productsTotal = order.products.reduce((sum, product) => {
      const productTotal = toNumber((product as any).total_price);
      if (productTotal > 0) {
        return sum + productTotal;
      }
      const quantity = toNumber((product as any).quantity, 1);
      const unitPrice = toNumber((product as any).unit_price);
      return sum + quantity * unitPrice;
    }, 0);

    if (productsTotal > 0) {
      return productsTotal;
    }
  }

  if (Array.isArray(order.fragments) && order.fragments.length > 0) {
    const fragmentsTotal = order.fragments.reduce(
      (sum, fragment) => sum + toNumber((fragment as any).value),
      0,
    );
    if (fragmentsTotal > 0) {
      return fragmentsTotal;
    }
  }

  const alternative = toNumber((order as any).totalAmount);
  return alternative > 0 ? alternative : 0;
};

export default function MetricsCards() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  
  // Inicializa com dados do cache se existir
  const [metrics, setMetrics] = useState(() => {
    try {
      const cached = localStorage.getItem('biobox_metrics_cache');
      if (cached) {
        console.log("💾 [MetricsCards] Carregando do cache");
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn("⚠️ Erro ao carregar cache:", err);
    }
    return {
      activeOrders: 0,
      urgentOrders: 0,
      inProductionOrders: 0,
      delayedOrders: 0,
      readyOrders: 0,
      monthlyRevenue: 0,
      completedToday: 0,
      receivableValue: 0,
      receivedValue: 0,
      receivableOrders: 0,
      deliveredOrders: 0,
    };
  });

  const { getOrders } = useFirebase();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadMetrics = async () => {
    if (loadingRef.current) {
      console.log("⏸️ [MetricsCards] Já está carregando, ignorando...");
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log("🔍 [MetricsCards] Iniciando carregamento de métricas...");
      
      const orders = await getOrders();
      
      console.log("📦 [MetricsCards] Pedidos recebidos:", {
        total: orders?.length || 0,
        amostra: orders?.slice(0, 2),
        tipoOrders: typeof orders,
        isArray: Array.isArray(orders),
        primeiroItem: orders?.[0]
      });

      if (!orders || orders.length === 0) {
        console.warn("⚠️ [MetricsCards] Nenhum pedido encontrado!");
        setMetrics({
          activeOrders: 0,
          urgentOrders: 0,
          inProductionOrders: 0,
          delayedOrders: 0,
          readyOrders: 0,
          monthlyRevenue: 0,
          completedToday: 0,
          receivableValue: 0,
          receivedValue: 0,
          receivableOrders: 0,
          deliveredOrders: 0,
        });
        loadingRef.current = false;
        setLoading(false);
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      console.log("📅 [MetricsCards] Datas de referência:", {
        hoje: today.toISOString(),
        inicioMes: monthStart.toISOString()
      });

      const enrichedOrders: EnrichedOrder[] = orders.map((order) => {
        const status = normalizeStatus((order as any).status);
        const createdAt = parseDate((order as any).created_at) ?? now;
        const deliveryDate = parseDate((order as any).delivery_date);
        const completedDate = parseDate((order as any).completed_date);
        const totalAmount = computeOrderTotalAmount(order);

        return {
          raw: { ...order, status } as Order,
          status,
          totalAmount,
          createdAt,
          deliveryDate,
          completedDate,
        };
      });

      console.log("✅ [MetricsCards] Pedidos enriquecidos:", {
        total: enrichedOrders.length,
        exemplo: enrichedOrders[0]
      });

      const activeOrders = enrichedOrders.filter(({ status }) =>
        [
          "pending",
          "confirmed",
          "in_production",
          "quality_check",
          "ready",
        ].includes(status),
      ).length;

      const urgentOrders = enrichedOrders.filter(
        ({ raw, status }) =>
          raw.priority === "urgent" &&
          !["delivered", "cancelled"].includes(status),
      ).length;

      const inProductionOrders = enrichedOrders.filter(
        ({ status }) => status === "in_production",
      ).length;
      
      const readyOrders = enrichedOrders.filter(
        ({ status }) => status === "ready",
      ).length;

      const delayedOrders = enrichedOrders.filter(
        ({ status, deliveryDate }) =>
          deliveryDate !== null &&
          deliveryDate < now &&
          !["delivered", "cancelled"].includes(status),
      ).length;

      const monthlyRevenue = enrichedOrders
        .filter(
          ({ status, createdAt }) =>
            createdAt >= monthStart && status !== "cancelled",
        )
        .reduce((sum, entry) => sum + entry.totalAmount, 0);

      const completedToday = enrichedOrders.filter(
        ({ status, completedDate }) =>
          status === "delivered" &&
          completedDate !== null &&
          completedDate >= today,
      ).length;

      const receivableEntries = enrichedOrders.filter(
        ({ status }) => !["delivered", "cancelled"].includes(status),
      );
      const receivableValue = receivableEntries.reduce(
        (sum, entry) => sum + entry.totalAmount,
        0,
      );

      const deliveredEntries = enrichedOrders.filter(
        ({ status }) => status === "delivered",
      );
      const receivedValue = deliveredEntries.reduce(
        (sum, entry) => sum + entry.totalAmount,
        0,
      );

      const calculatedMetrics = {
        activeOrders,
        urgentOrders,
        inProductionOrders,
        delayedOrders,
        readyOrders,
        monthlyRevenue,
        completedToday,
        receivableValue,
        receivedValue,
        receivableOrders: receivableEntries.length,
        deliveredOrders: deliveredEntries.length,
      };

      console.log("📊 [MetricsCards] Métricas calculadas:", calculatedMetrics);

      // Salvar no cache para persistir entre recarregamentos
      try {
        localStorage.setItem('biobox_metrics_cache', JSON.stringify(calculatedMetrics));
        console.log("💾 [MetricsCards] Métricas salvas no cache");
      } catch (err) {
        console.warn("⚠️ [MetricsCards] Erro ao salvar cache:", err);
      }

      if (isMountedRef.current) {
        setMetrics(calculatedMetrics);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ [MetricsCards] Erro ao carregar métricas:", error);
      console.error("Stack:", error instanceof Error ? error.stack : "N/A");
      if (isMountedRef.current) {
        setError(errorMsg);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();

    const onOrdersChanged = () => {
      console.log("🔄 [MetricsCards] Evento de mudança detectado, recarregando...");
      loadMetrics();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        "orders:changed",
        onOrdersChanged as EventListener,
      );
      window.addEventListener("storage", onOrdersChanged as EventListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "orders:changed",
          onOrdersChanged as EventListener,
        );
        window.removeEventListener("storage", onOrdersChanged as EventListener);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-8 w-3/4 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
        <p className="text-sm text-red-500">
          ❌ Erro ao carregar métricas: {error}
        </p>
        <button
          onClick={loadMetrics}
          className="mt-2 text-xs text-red-500 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const revenueTarget = 180000;
  const revenuePercentage =
    revenueTarget > 0
      ? Math.round((metrics.monthlyRevenue / revenueTarget) * 100)
      : 0;
  const revenueTrend: MetricTrend =
    revenuePercentage >= 50
      ? "up"
      : metrics.monthlyRevenue > 0
        ? "down"
        : "neutral";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <MetricCard
        title="Valor a Receber"
        value={formatCurrency(metrics.receivableValue)}
        subtitle={`${metrics.receivableOrders} pedido${metrics.receivableOrders !== 1 ? "s" : ""} aguardando entrega`}
        icon={Clock}
        color="orange"
      />

      <MetricCard
        title="Valor Recebido"
        value={formatCurrency(metrics.receivedValue)}
        subtitle={`${metrics.deliveredOrders} pedido${metrics.deliveredOrders !== 1 ? "s" : ""} entregues`}
        icon={CheckCircle}
        color="green"
      />

      <MetricCard
        title="Pedidos Ativos"
        value={metrics.activeOrders}
        subtitle={`${metrics.urgentOrders} urgente${metrics.urgentOrders !== 1 ? "s" : ""}`}
        icon={Calendar}
        trend={
          metrics.delayedOrders > 0
            ? "down"
            : metrics.activeOrders > 0
              ? "up"
              : "neutral"
        }
        trendValue={
          metrics.delayedOrders > 0
            ? `${metrics.delayedOrders} atrasado${metrics.delayedOrders !== 1 ? "s" : ""}`
            : "Sem atrasos"
        }
        color="blue"
      />

      <MetricCard
        title="Em Produção"
        value={metrics.inProductionOrders}
        subtitle={`${metrics.readyOrders} pronto${metrics.readyOrders !== 1 ? "s" : ""} para entrega`}
        icon={Package}
        trend={metrics.inProductionOrders > 0 ? "up" : "neutral"}
        trendValue={
          metrics.readyOrders > 0
            ? `${metrics.readyOrders} etapa${metrics.readyOrders !== 1 ? "s" : ""} concluída${
                metrics.readyOrders !== 1 ? "s" : ""
              }`
            : "Planejamento em dia"
        }
        color="orange"
      />

      <MetricCard
        title="Concluídos Hoje"
        value={metrics.completedToday}
        subtitle="Entregas realizadas"
        icon={Truck}
        trend={metrics.completedToday > 0 ? "up" : "neutral"}
        trendValue={
          metrics.completedToday > 0
            ? "Meta diária em andamento"
            : "Nenhuma entrega hoje"
        }
        color="green"
      />

      <MetricCard
        title="Receita Mensal"
        value={formatCurrency(metrics.monthlyRevenue)}
        subtitle={`Meta: ${formatCurrency(revenueTarget)}`}
        icon={DollarSign}
        trend={revenueTrend}
        trendValue={`${Math.max(0, revenuePercentage)}% da meta`}
        color={
          revenuePercentage >= 80
            ? "green"
            : revenuePercentage >= 50
              ? "orange"
              : "red"
        }
      />
    </div>
  );
}