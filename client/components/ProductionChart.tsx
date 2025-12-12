import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  Line,
} from "recharts";
import { useFirebase } from "@/hooks/useFirebase";
import { Package } from "lucide-react";

interface ProductionData {
  day: string;
  produced: number;
  planned: number;
}

export default function ProductionChart() {
  const [loading, setLoading] = useState(true);
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const { getOrders, isConnected } = useFirebase();

  useEffect(() => {
    loadProductionData();
  }, []);

  const loadProductionData = async () => {
    try {
      setLoading(true);
      const orders = await getOrders();

      console.log("📦 Total de pedidos carregados:", orders.length);

      const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira

      console.log(
        "📅 Semana atual começa em:",
        weekStart.toLocaleDateString("pt-BR"),
      );

      const weekData = days.map((day, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        date.setHours(0, 0, 0, 0);

        // Filtrar pedidos do dia
        const dayOrders = orders.filter((order) => {
          const orderDate = new Date(order.scheduled_date);
          orderDate.setHours(0, 0, 0, 0);
          return (
            orderDate.getTime() === date.getTime() &&
            ["in_production", "quality_check", "ready", "delivered"].includes(
              order.status,
            )
          );
        });

        console.log(
          `📅 ${day} (${date.toLocaleDateString("pt-BR")}):`,
          dayOrders.length,
          "pedidos",
        );

        // Calcular quantidade produzida
        const produced = dayOrders.reduce((sum, order) => {
          // Se tem produtos
          if (order.products && Array.isArray(order.products)) {
            return (
              sum +
              order.products.reduce(
                (pSum, product) => pSum + (product.quantity || 0),
                0,
              )
            );
          }
          // Se tem quantidade total
          if (order.total_quantity) {
            return sum + order.total_quantity;
          }
          return sum;
        }, 0);

        // Calcular planejado (todos os pedidos agendados para o dia)
        const dayPlannedOrders = orders.filter((order) => {
          const orderDate = new Date(order.scheduled_date);
          orderDate.setHours(0, 0, 0, 0);
          return (
            orderDate.getTime() === date.getTime() &&
            !["cancelled"].includes(order.status)
          );
        });

        const planned = dayPlannedOrders.reduce((sum, order) => {
          if (order.products && Array.isArray(order.products)) {
            return (
              sum +
              order.products.reduce(
                (pSum, product) => pSum + (product.quantity || 0),
                0,
              )
            );
          }
          if (order.total_quantity) {
            return sum + order.total_quantity;
          }
          return sum + 1; // Se não tem quantidade, conta como 1 item
        }, 0);

        return {
          day,
          produced,
          planned: Math.max(produced, planned), // Planejado sempre >= produzido
        };
      });

      console.log("📊 Dados da semana:", weekData);
      setProductionData(weekData);
    } catch (error) {
      console.error("❌ Erro ao carregar dados de produção:", error);
      // Dados de fallback
      const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
      setProductionData(days.map((day) => ({ day, produced: 0, planned: 0 })));
    } finally {
      setLoading(false);
    }
  };

  const totalProduced = productionData.reduce(
    (sum, data) => sum + data.produced,
    0,
  );
  const totalPlanned = productionData.reduce(
    (sum, data) => sum + data.planned,
    0,
  );

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Produção Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-biobox-green mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Carregando dados de produção...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Produção Semanal
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={
                isConnected
                  ? "border-biobox-green text-biobox-green"
                  : "border-orange-500 text-orange-500"
              }
            >
              {isConnected ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalProduced === 0 && totalPlanned === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2 font-medium">
              Nenhum dado de produção nesta semana
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              Crie pedidos com datas de produção nesta semana para ver o
              gráfico. Os pedidos agendados aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productionData}>
                  <defs>
                    <linearGradient
                      id="colorProduced"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(144 61% 54%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(144 61% 54%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(220 13% 15%)"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 13% 9%)",
                      border: "1px solid hsl(220 13% 15%)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "hsl(210 40% 98%)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="produced"
                    stroke="hsl(144 61% 54%)"
                    fillOpacity={1}
                    fill="url(#colorProduced)"
                    strokeWidth={2}
                    name="Produzido"
                  />
                  <Line
                    type="monotone"
                    dataKey="planned"
                    stroke="hsl(215 20.2% 65.1%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Planejado"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-biobox-green"></div>
                  <span className="text-muted-foreground">Produzido</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-1 bg-muted-foreground"></div>
                  <span className="text-muted-foreground">Planejado</span>
                </div>
              </div>
              <div className="text-foreground">
                <span className="font-semibold">{totalProduced}</span>
                {totalPlanned > 0 && (
                  <>
                    {" / "}
                    <span className="text-muted-foreground">
                      {totalPlanned} planejado
                    </span>
                  </>
                )}{" "}
                esta semana
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
