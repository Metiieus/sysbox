import { useState, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import OrderPrintTemplate from "@/components/OrderPrintTemplate";
import DashboardLayout from "@/components/DashboardLayout";
import NewOrderForm from "@/components/NewOrderForm";
import OrderEditForm from "@/components/OrderEditForm";
import ProductionStagesTracker from "@/components/ProductionStagesTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Search,
  Eye,
  Edit,
  Printer,
  Download,
  Clock,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
  User,
  Calendar,
  DollarSign,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Phone,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFirebase, Order } from "@/hooks/useFirebase";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const statusLabels = {
  pending: "Pendente",
  awaiting_approval: "Aguardando Aprovação",
  confirmed: "Confirmado",
  in_production: "Em Produção",
  quality_check: "Controle de Qualidade",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  awaiting_approval: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_production: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  quality_check: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityLabels = {
  low: "Baixa",
  medium: "M��dia",
  high: "Alta",
  urgent: "Urgente",
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 10;

// Componente auxiliar para mudanças rápidas de status
const QuickStatusChange = ({
  order,
  onTransition,
}: {
  order: Order;
  onTransition: (
    order: Order,
    status: Order["status"],
    progress?: number,
  ) => void;
}) => {
  const { checkPermission, user } = useAuth();

  const nextStatuses = {
    pending: [
      {
        status: "confirmed",
        label: "Confirmar",
        color: "bg-blue-500",
        permission: "orders:approve",
      },
      {
        status: "awaiting_approval",
        label: "Enviar",
        color: "bg-blue-500",
        permission: "orders:create",
      },
      { status: "cancelled", label: "Cancelar", color: "bg-red-500" },
    ],
    awaiting_approval: [
      {
        status: "confirmed",
        label: "Confirmar",
        color: "bg-blue-500",
        permission: "orders:approve",
      },
      { status: "cancelled", label: "Cancelar", color: "bg-red-500" },
    ],
    confirmed: [
      {
        status: "in_production",
        label: "Iniciar Produção",
        color: "bg-purple-500",
      },
      { status: "cancelled", label: "Cancelar", color: "bg-red-500" },
    ],
    in_production: [
      { status: "quality_check", label: "CQ", color: "bg-orange-500" },
    ],
    quality_check: [
      { status: "ready", label: "Aprovar", color: "bg-green-500" },
      { status: "in_production", label: "Reprovar", color: "bg-purple-500" },
    ],
    ready: [{ status: "delivered", label: "Entregar", color: "bg-gray-500" }],
  } as const;

  // Lógica para remover ações subsequentes para o vendedor
  if (user && user.role !== "admin" && order.status === "awaiting_approval") {
    return null;
  }

  const options = (
    nextStatuses[order.status as keyof typeof nextStatuses] || []
  ).filter((option) => {
    if (!option.permission) return true;
    const [resource, action] = option.permission.split(":");

    // Lógica para o vendedor: só pode "Enviar" se o pedido for dele
    if (action === "create" && user?.role !== "admin") {
      return order.seller_id === user?.id;
    }

    // Lógica para o admin: só pode "Confirmar"
    if (action === "approve" && user?.role === "admin") {
      return true;
    }

    return checkPermission(resource, action);
  });

  if (options.length === 0) return null;

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <Button
          key={option.status}
          size="sm"
          className={`${option.color} hover:opacity-90 text-white`}
          onClick={async () => {
            const progress =
              option.status === "in_production"
                ? 10
                : option.status === "quality_check"
                  ? 80
                  : option.status === "ready"
                    ? 100
                    : undefined;
            onTransition(order, option.status as Order["status"], progress);
          }}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | Order["priority"]
  >("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { checkPermission, user } = useAuth();
  const firebaseHook = useFirebase();
  const { getOrders, createOrder, updateOrder, isConnected } = firebaseHook;

  // Verificar se deleteOrder existe, senão usar uma implementação local
  const deleteOrderFn =
    firebaseHook.deleteOrder ||
    (async (orderId: string) => {
      console.log(
        "⚠️ deleteOrder não existe no hook, usando implementação local",
      );
      // Implementação local usando updateOrder para marcar como deletado
      // ou remover do estado local
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      return true;
    });

  const { toast } = useToast();
  const navigate = useNavigate();

  const toDate = (value: any, fallback: Date = new Date()): Date => {
    if (!value) return fallback;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === "function") {
      try {
        return value.toDate();
      } catch {
        return fallback;
      }
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  };

  const toNumber = (value: any, fallback = 0): number => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    if (typeof value === "object" && value !== null) {
      const maybeValue = (value as any)?.toNumber?.();
      if (typeof maybeValue === "number" && Number.isFinite(maybeValue)) {
        return maybeValue;
      }
    }
    return fallback;
  };

  const computeOrderTotalQuantity = (order: Order): number => {
    if (order.total_quantity && order.total_quantity > 0) {
      return order.total_quantity;
    }
    if (Array.isArray(order.products) && order.products.length > 0) {
      return order.products.reduce(
        (sum, product) => sum + toNumber((product as any).quantity),
        0,
      );
    }
    return 0;
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        console.log("🔍 Buscando pedidos...", { isConnected });
        const ordersData = await getOrders();

        if (isMounted) {
          console.log("✅ Pedidos carregados:", ordersData.length);
          setOrders(ordersData);
        }
      } catch (error) {
        if (isMounted) {
          console.error("❌ Erro ao carregar pedidos:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    const handleOrdersChanged = () => {
      if (isMounted) {
        loadOrders();
      }
    };

    window.addEventListener("orders:changed", handleOrdersChanged);

    return () => {
      isMounted = false;
      window.removeEventListener("orders:changed", handleOrdersChanged);
    };
  }, []);

  useEffect(() => {
    if (isConnected && orders.length === 0 && !loading) {
      console.log("🔄 Reconectado ao Firebase, recarregando pedidos...");
      loadOrders();
    }
  }, [isConnected]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log("🔍 Buscando pedidos...", { isConnected });
      const ordersData = await getOrders();
      console.log("✅ Pedidos carregados:", ordersData.length, ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error("❌ Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || order.priority === priorityFilter;
      const matchesTab = activeTab === "all" || order.status === activeTab;
      return matchesSearch && matchesStatus && matchesPriority && matchesTab;
    });
  }, [orders, searchTerm, statusFilter, priorityFilter, activeTab]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, activeTab]);

  useEffect(() => {
    const nextMax = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    setCurrentPage((prev) => (prev > nextMax ? nextMax : prev));
  }, [filteredOrders.length]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const hasOrders = filteredOrders.length > 0;
  const rangeStart = hasOrders ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = hasOrders
    ? Math.min(
        filteredOrders.length,
        Math.max(rangeStart, rangeStart + paginatedOrders.length - 1),
      )
    : 0;

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const inProductionOrders = orders.filter(
      (o) => o.status === "in_production",
    ).length;
    const readyOrders = orders.filter((o) => o.status === "ready").length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0,
    );
    const urgentOrders = orders.filter((o) => o.priority === "urgent").length;
    const overdueOrders = orders.filter(
      (o) =>
        o.delivery_date &&
        new Date() > new Date(o.delivery_date) &&
        !["delivered", "cancelled"].includes(o.status),
    ).length;

    return {
      totalOrders,
      pendingOrders,
      inProductionOrders,
      readyOrders,
      totalRevenue,
      urgentOrders,
      overdueOrders,
    };
  }, [orders]);

  const handleOrderCreated = async (newOrderData: any) => {
    try {
      const createdOrder = await createOrder(newOrderData);
      if (createdOrder) {
        setOrders((prevOrders) => [createdOrder, ...prevOrders]);
        toast({
          title: "Pedido criado",
          description: `Pedido ${createdOrder.order_number} foi criado com sucesso`,
        });
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast({
        title: "Erro ao criar pedido",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // FUNÇÃO: Deletar pedido
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const order = orders.find((o) => o.id === orderId);

      if (!order) {
        toast({
          title: "Pedido não encontrado",
          variant: "destructive",
        });
        return;
      }

      const confirmed = window.confirm(
        `Tem certeza que deseja excluir o pedido ${order.order_number}?\n\n` +
          `Cliente: ${order.customer_name}\n` +
          `Valor: ${formatCurrency(order.total_amount)}\n\n` +
          `Esta ação não pode ser desfeita.`,
      );

      if (!confirmed) return;

      console.log("🗑️ Excluindo pedido:", orderId);

      // Usar deleteOrderFn que vem do useFirebase
      const success = await deleteOrderFn(orderId);

      if (!success) {
        toast({
          title: "Erro ao excluir pedido",
          description: "Não foi possível excluir o pedido",
          variant: "destructive",
        });
        return;
      }

      // Sucesso - atualizar UI
      toast({
        title: "Pedido excluído",
        description: `Pedido ${order.order_number} foi removido com sucesso`,
      });

      // Recarregar lista
      await loadOrders();

      // Fechar dialog se estiver aberto
      if (showOrderDetails && selectedOrder?.id === orderId) {
        setShowOrderDetails(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("❌ Erro ao excluir pedido:", error);
      toast({
        title: "Erro ao excluir pedido",
        description: (error as Error).message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  // NOVA FUNÇÃO: Abrir formulário de edição
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowEditForm(true);
    setShowOrderDetails(false);
  };

  // NOVA FUNÇÃO: Salvar edições do pedido
  const handleSaveEditedOrder = async (updatedOrder: Order) => {
    try {
      console.log("💾 Salvando alterações do pedido:", updatedOrder.id);

      const updated = await updateOrder(updatedOrder.id, {
        customer_name: updatedOrder.customer_name,
        customer_phone: updatedOrder.customer_phone,
        customer_email: updatedOrder.customer_email,
        seller_name: updatedOrder.seller_name,
        status: updatedOrder.status,
        priority: updatedOrder.priority,
        scheduled_date: updatedOrder.scheduled_date,
        delivery_date: updatedOrder.delivery_date,
        total_amount: updatedOrder.total_amount,
        total_quantity: updatedOrder.total_quantity,
        production_progress: updatedOrder.production_progress,
        notes: updatedOrder.notes,
        assigned_operator: updatedOrder.assigned_operator,
        products: updatedOrder.products,
        fragments: updatedOrder.fragments,
        is_fragmented: updatedOrder.is_fragmented,
      });

      if (updated) {
        toast({
          title: "Pedido atualizado",
          description: `Pedido ${updated.order_number} foi atualizado com sucesso`,
        });

        applyUpdate(updated);
        setShowEditForm(false);
        setEditingOrder(null);
        await loadOrders();
      } else {
        toast({
          title: "Erro ao atualizar pedido",
          description: "Não foi possível salvar as alterações",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao salvar pedido:", error);
      toast({
        title: "Erro ao salvar pedido",
        description: (error as Error).message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const applyUpdate = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    if (selectedOrder && selectedOrder.id === updated.id)
      setSelectedOrder(updated);
  };

  const handleTransition = async (
    order: Order,
    nextStatus: Order["status"],
    progress?: number,
  ) => {
    const updates: Partial<Order> = { status: nextStatus };
    if (typeof progress === "number") updates.production_progress = progress;
    if (nextStatus === "delivered") {
      (updates as any).completed_date = new Date().toISOString();
    }

    // Ao iniciar produção, iniciar automaticamente a primeira etapa (Corte e Costura)
    if (nextStatus === "in_production") {
      const productionStages = order.production_stages || [];
      const firstStage = productionStages.find(
        (s) => s.stage === "cutting_sewing",
      );

      if (!firstStage || firstStage.status === "pending") {
        const updatedStages = [...productionStages];
        const stageIndex = updatedStages.findIndex(
          (s) => s.stage === "cutting_sewing",
        );

        if (stageIndex >= 0) {
          updatedStages[stageIndex] = {
            ...updatedStages[stageIndex],
            status: "in_progress",
            started_at: new Date().toISOString(),
          };
        } else {
          updatedStages.push({
            stage: "cutting_sewing",
            status: "in_progress",
            started_at: new Date().toISOString(),
          });
        }

        (updates as any).production_stages = updatedStages;
      }
    }

    const updated = await updateOrder(order.id, updates);
    if (updated) {
      // applyUpdate(updated); // Removido, o listener orders:changed fará isso
      toast({
        title: "Status atualizado",
        description:
          nextStatus === "in_production"
            ? `Pedido ${updated.order_number} iniciado na etapa de Corte e Costura`
            : `Pedido ${updated.order_number} agora está em "${statusLabels[nextStatus]}"`,
      });
      if (nextStatus === "in_production") {
        navigate(`/production?orderId=${updated.id}`);
      }
    }
  };

  const formatDate = (value: any) => {
    return toDate(value).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getDaysUntilDelivery = (deliveryDate?: string) => {
    if (!deliveryDate) return null;
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePrintOrder = (order: Order | null) => {
    if (!order) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // Configurar documento HTML
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Pedido ${order.order_number}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .print-template {
                page-break-after: always;
              }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
      printWindow.document.close();

      // Criar container React e renderizar o template
      const container = printWindow.document.getElementById("print-root");
      if (container) {
        const root = createRoot(container);
        root.render(<OrderPrintTemplate order={order} />);

        // Aguardar renderização e imprimir
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();

          // Fechar após impressão (opcional)
          setTimeout(() => {
            printWindow.close();
          }, 100);
        }, 500);
      }
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      [
        "Pedido",
        "Cliente",
        "Vendedor",
        "Status",
        "Prioridade",
        "Data Produção",
        "Data Entrega",
        "Valor",
        "Progresso",
      ].join(","),
      ...filteredOrders.map((order) =>
        [
          order.order_number,
          order.customer_name,
          order.seller_name,
          statusLabels[order.status],
          priorityLabels[order.priority],
          formatDate(order.scheduled_date),
          order.delivery_date ? formatDate(order.delivery_date) : "N/A",
          (order.total_amount || 0).toFixed(2),
          `${order.production_progress}%`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pedidos_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-biobox-green mx-auto mb-4"></div>
            <p>Carregando pedidos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gerenciamento de Pedidos
            </h1>
            <p className="text-muted-foreground">
              Agende e acompanhe seus pedidos de produção
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {stats.totalOrders} total
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {stats.inProductionOrders} em produção
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {stats.pendingOrders} pendentes
              </span>
              {stats.urgentOrders > 0 && (
                <span className="text-red-500">
                  🚨 {stats.urgentOrders} urgentes
                </span>
              )}
              {stats.overdueOrders > 0 && (
                <span className="text-red-500">
                  ⚠️ {stats.overdueOrders} atrasados
                </span>
              )}
              {!isConnected && (
                <span className="text-orange-500">📱 Modo offline</span>
              )}
            </div>
          </div>
          {checkPermission("orders", "create") && (
            <Button
              className="bg-biobox-green hover:bg-biobox-green-dark"
              onClick={() => setShowNewOrderForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-biobox-green" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Pedidos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendentes
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.pendingOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Em Produção
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.inProductionOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Prontos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.readyOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-biobox-green" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Receita Total
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número do pedido ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all" value="all">
                Todos os Status
              </SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value: any) => setPriorityFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todas as Prioridades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all" value="all">
                Todas as Prioridades
              </SelectItem>
              {Object.entries(priorityLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleExportReport}
            title="Exportar Relatório"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePrintOrder(null)}
            title="Imprimir Lista"
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lista de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full overflow-x-auto whitespace-nowrap md:grid md:grid-cols-6">
                <TabsTrigger value="all">
                  Todos ({stats.totalOrders})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendentes ({stats.pendingOrders})
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  Confirmados (
                  {orders.filter((o) => o.status === "confirmed").length})
                </TabsTrigger>
                <TabsTrigger value="in_production">
                  Em Produção ({stats.inProductionOrders})
                </TabsTrigger>
                <TabsTrigger value="ready">
                  Prontos ({stats.readyOrders})
                </TabsTrigger>
                <TabsTrigger value="delivered">
                  Entregues (
                  {orders.filter((o) => o.status === "delivered").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Data Produção</TableHead>
                      <TableHead>Data Entrega</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Nenhum pedido encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrders.map((order) => {
                        const daysUntilDelivery = getDaysUntilDelivery(
                          order.delivery_date,
                        );
                        const isOverdue =
                          daysUntilDelivery !== null &&
                          daysUntilDelivery < 0 &&
                          !["delivered", "cancelled"].includes(order.status);

                        return (
                          <TableRow
                            key={order.id}
                            className={
                              isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""
                            }
                          >
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${priorityColors[order.priority]}`}
                                />
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {order.order_number}
                                  </div>
                                  {order.assigned_operator && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <User className="h-3 w-3 mr-1" />
                                      {order.assigned_operator}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {order.customer_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order.customer_phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-biobox-green">
                                  {order.seller_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Vendedor
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(order.scheduled_date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {order.delivery_date
                                  ? formatDate(order.delivery_date)
                                  : "-"}
                                {daysUntilDelivery !== null && (
                                  <div
                                    className={`text-xs ${isOverdue ? "text-red-500" : daysUntilDelivery <= 3 ? "text-orange-500" : "text-muted-foreground"}`}
                                  >
                                    {isOverdue
                                      ? `${Math.abs(daysUntilDelivery)} dias atrasado`
                                      : daysUntilDelivery === 0
                                        ? "Hoje"
                                        : daysUntilDelivery === 1
                                          ? "Amanhã"
                                          : `${daysUntilDelivery} dias`}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-biobox-green h-2 rounded-full"
                                    style={{
                                      width: `${order.production_progress}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {order.production_progress}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[order.status]}>
                                {statusLabels[order.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={priorityColors[order.priority]}>
                                {priorityLabels[order.priority]}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(order.total_amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {/* Botão Ver Detalhes */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewOrder(order)}
                                  title="Ver detalhes"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                {/* Mudanças Rápidas de Status */}
                                <QuickStatusChange
                                  order={order}
                                  onTransition={handleTransition}
                                />

                                {/* Botão Editar */}
                                {checkPermission("orders", "edit") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditOrder(order);
                                    }}
                                    title="Editar pedido"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}

                                {/* Botão Imprimir */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintOrder(order);
                                  }}
                                  title="Imprimir pedido"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>

                                {/* Botão Deletar */}
                                {checkPermission("orders", "delete") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteOrder(order.id);
                                    }}
                                    title="Excluir pedido"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {hasOrders ? `${rangeStart}–${rangeEnd}` : "0"} de{" "}
                    {filteredOrders.length} pedidos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(pageCount, prev + 1))
                      }
                      disabled={currentPage === pageCount || !hasOrders}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(pageCount)}
                      disabled={currentPage === pageCount || !hasOrders}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="w-full max-w-[min(100%,48rem)] md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalhes do Pedido {selectedOrder?.order_number}
              </DialogTitle>
              <DialogDescription>
                Visualize e gerencie as informações completas do pedido
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Cabeçalho com Status e Ações Rápidas */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge className={statusColors[selectedOrder.status]}>
                      {statusLabels[selectedOrder.status]}
                    </Badge>
                    <Badge className={priorityColors[selectedOrder.priority]}>
                      {priorityLabels[selectedOrder.priority]}
                    </Badge>
                  </div>
                  <QuickStatusChange
                    order={selectedOrder}
                    onTransition={handleTransition}
                  />
                </div>

                {/* Informações do Cliente e Pedido */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Informações do Cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {selectedOrder.customer_name}
                          </p>
                          {selectedOrder.customer_trade_name && (
                            <p className="text-sm text-biobox-green">
                              {selectedOrder.customer_trade_name}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Cliente
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {selectedOrder.customer_phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Telefone
                          </p>
                        </div>
                      </div>
                      {selectedOrder.customer_email && (
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {selectedOrder.customer_email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              E-mail
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedOrder.payment_condition && (
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {selectedOrder.payment_condition}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Condição de Pagamento
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Informações do Pedido
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {selectedOrder.representative || selectedOrder.seller_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedOrder.representative ? "Representante" : "Vendedor"}
                          </p>
                        </div>
                      </div>
                      {selectedOrder.representative && selectedOrder.seller_name && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">
                              {selectedOrder.seller_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vendedor (Digitador)
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedOrder.assigned_operator && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {selectedOrder.assigned_operator}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Operador
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {selectedOrder.production_progress}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Progresso
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Datas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cronograma</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Criado em
                        </p>
                        <p className="font-medium">
                          {formatDate(selectedOrder.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Produção
                        </p>
                        <p className="font-medium">
                          {formatDate(selectedOrder.scheduled_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Entrega
                        </p>
                        <p className="font-medium">
                          {selectedOrder.delivery_date
                            ? formatDate(selectedOrder.delivery_date)
                            : "Não definida"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Produtos */}
                {selectedOrder.products &&
                  selectedOrder.products.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Produtos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedOrder.products.map((product, index) => {
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-start p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium">
                                      {product.product_name || "Produto"}
                                    </p>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {[
                                      product.model,
                                      product.size,
                                      product.color,
                                      product.fabric,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {product.quantity}x{" "}
                                    {formatCurrency(product.unit_price)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatCurrency(product.total_price)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Etapas de Produção */}
                {selectedOrder.status !== "pending" &&
                  selectedOrder.status !== "awaiting_approval" &&
                  selectedOrder.status !== "cancelled" && (
                    <ProductionStagesTracker
                      orderId={selectedOrder.id}
                      orderNumber={selectedOrder.order_number}
                      stages={selectedOrder.production_stages || []}
                      onUpdateStage={async (stageId, updates) => {
                        const updatedStages = [
                          ...(selectedOrder.production_stages || []),
                        ];
                        const stageIndex = updatedStages.findIndex(
                          (s) => s.stage === stageId,
                        );

                        if (stageIndex >= 0) {
                          updatedStages[stageIndex] = {
                            ...updatedStages[stageIndex],
                            ...updates,
                          };
                        } else {
                          updatedStages.push({
                            stage: stageId,
                            ...updates,
                          } as any);
                        }

                        await updateOrder(selectedOrder.id, {
                          ...selectedOrder,
                          production_stages: updatedStages,
                        });

                        // Recarregar a lista de pedidos
                        const updatedOrders = await getOrders();
                        setOrders(updatedOrders);

                        // Atualizar o pedido selecionado
                        const refreshedOrder = updatedOrders.find(
                          (o) => o.id === selectedOrder.id,
                        );
                        if (refreshedOrder) {
                          setSelectedOrder(refreshedOrder);
                        }
                      }}
                      operators={[
                        { id: "1", name: "João Silva" },
                        { id: "2", name: "Maria Santos" },
                        { id: "3", name: "Pedro Costa" },
                      ]}
                    />
                  )}

                {/* Observações */}
                {selectedOrder.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedOrder.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Resumo Financeiro */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-4 bg-biobox-green/10 border border-biobox-green/20 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total do Pedido
                    </p>
                    <p className="text-2xl font-bold text-biobox-green">
                      {formatCurrency(selectedOrder.total_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Quantidade Total
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedOrder.total_quantity}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handlePrintOrder(selectedOrder)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>

                  {checkPermission("orders", "edit") && (
                    <Button
                      className="bg-biobox-green hover:bg-biobox-green-dark"
                      onClick={() => handleEditOrder(selectedOrder)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Pedido
                    </Button>
                  )}

                  {checkPermission("orders", "delete") && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowOrderDetails(false);
                        handleDeleteOrder(selectedOrder.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Pedido
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Order Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="w-full max-w-[min(100%,56rem)] md:max-w-5xl max-h-[95vh] overflow-hidden">
            {editingOrder && (
              <OrderEditForm
                order={editingOrder}
                onSave={handleSaveEditedOrder}
                onCancel={() => {
                  setShowEditForm(false);
                  setEditingOrder(null);
                }}
                saving={false}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* New Order Form */}
        <NewOrderForm
          open={showNewOrderForm}
          onOpenChange={setShowNewOrderForm}
          onOrderCreated={handleOrderCreated}
        />
      </div>
    </DashboardLayout>
  );
}
