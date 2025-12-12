import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, Package } from "lucide-react";
import { useFirebase } from "@/hooks/useFirebase";

const statusColors = {
  cutting: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  assembly: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  finishing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  quality: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  completed: "bg-biobox-green/10 text-biobox-green border-biobox-green/20",
  pending: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_production: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  quality_check: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  ready: "bg-biobox-green/10 text-biobox-green border-biobox-green/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels = {
  cutting: "Corte",
  assembly: "Montagem",
  finishing: "Acabamento",
  quality: "Qualidade",
  completed: "Concluído",
  pending: "Pendente",
  confirmed: "Confirmado",
  in_production: "Em Produção",
  quality_check: "Controle de Qualidade",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-orange-500",
  low: "bg-green-500",
  urgent: "bg-red-600",
};

export default function ProductionOverview() {
  const [loading, setLoading] = useState(true);
  const [productionItems, setProductionItems] = useState<any[]>([]);
  const { getOrders } = useFirebase();

  useEffect(() => {
    loadProductionData();
  }, []);

  const loadProductionData = async () => {
    try {
      setLoading(true);
      const orders = await getOrders();

      const inProduction = orders.filter((order) =>
        ["confirmed", "in_production", "quality_check"].includes(order.status),
      );

      setProductionItems(inProduction);
    } catch (error) {
      console.error("Erro ao carregar dados de produção:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedCompletion = (progress: number) => {
    if (progress >= 90) return "1h";
    if (progress >= 70) return "2h";
    if (progress >= 50) return "4h";
    if (progress >= 30) return "6h";
    return "8h";
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Visão Geral da Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (productionItems.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Visão Geral da Produção
            </CardTitle>
            <Badge variant="outline" className="border-gray-500 text-gray-500">
              Nenhum pedido em produção
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pedido em produção no momento</p>
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
            Visão Geral da Produção
          </CardTitle>
          <Badge
            variant="outline"
            className="border-biobox-green text-biobox-green"
          >
            {productionItems.length} em produção
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {productionItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg border border-border hover:bg-muted/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {item.order_number}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${priorityColors[item.priority]}`}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pedido para {item.customer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vendedor: {item.seller_name}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColors[item.status]}`}
                >
                  {statusLabels[item.status]}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso</span>
                    <span>{item.production_progress}%</span>
                  </div>
                  <Progress value={item.production_progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  {item.assigned_operator && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{item.assigned_operator}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Conclusão em{" "}
                      {calculateEstimatedCompletion(item.production_progress)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
