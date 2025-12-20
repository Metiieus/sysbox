import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useFirebase, Order } from "@/hooks/useFirebase";
import { useToast } from "@/components/ui/use-toast";

interface CustomerOrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  awaiting_approval: "Aguardando Aprovação",
  confirmed: "Confirmado",
  in_production: "Em Produção",
  quality_check: "Controle de Qualidade",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  awaiting_approval: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_production: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  quality_check: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function CustomerOrderHistory({
  isOpen,
  onClose,
  customerId,
  customerName,
}: CustomerOrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getOrders } = useFirebase();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const allOrders = await getOrders();
        const customerOrders = allOrders.filter(
          (order) => order.customer_id === customerId
        );
        setOrders(customerOrders);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao carregar pedidos";
        setError(errorMessage);
        toast({
          title: "Erro ao carregar pedidos",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isOpen, customerId, getOrders, toast]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    try {
      return new Intl.DateTimeFormat("pt-BR").format(new Date(dateString));
    } catch {
      return "-";
    }
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    return priorityColors[priority] || "bg-gray-100 text-gray-800";
  };

  const getPriorityLabel = (priority: string) => {
    return priorityLabels[priority] || priority;
  };

  // Group orders by status for summary
  const ordersByStatus = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const status = order.status || "pending";
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(order);
        return acc;
      },
      {} as Record<string, Order[]>
    );
  }, [orders]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-biobox-green" />
            <span>Histórico de Pedidos</span>
          </DialogTitle>
          <DialogDescription>
            Todos os pedidos de <span className="font-semibold">{customerName}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-biobox-green" />
              <p className="text-muted-foreground">Carregando pedidos...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-6 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-500">Erro ao carregar pedidos</p>
                <p className="text-sm text-red-500/70">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Nenhum pedido encontrado para este cliente
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Pedidos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {orders.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Valor Total
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(
                      orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Status Predominante
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {useMemo(() => {
                      const entries = Object.entries(ordersByStatus);
                      if (entries.length === 0) return "-";
                      const [topStatus] = entries.sort((a, b) => b[1].length - a[1].length)[0];
                      return getStatusLabel(topStatus);
                    }, [ordersByStatus])}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Orders Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Detalhes dos Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Data Agendada</TableHead>
                        <TableHead>Data Entrega</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Data Criação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <span className="font-medium">
                              {order.order_number}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(order.status)}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={getPriorityColor(order.priority)}
                            >
                              {getPriorityLabel(order.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{formatDate(order.scheduled_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>
                                {formatDate(order.delivery_date) || "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 font-medium">
                              <DollarSign className="h-4 w-4 text-biobox-green" />
                              <span>
                                {formatCurrency(order.total_amount || 0)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-biobox-green"
                                  style={{
                                    width: `${order.production_progress || 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {order.production_progress || 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {formatDate(order.created_at)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            {Object.keys(ordersByStatus).length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(status)}`}
                          >
                            {getStatusLabel(status)}
                          </Badge>
                        </div>
                        <span className="font-bold text-foreground">
                          {statusOrders.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
