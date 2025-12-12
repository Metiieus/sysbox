import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Clock,
  AlertTriangle,
  Package,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import {
  ProductionTask,
  productionStages,
  statusColors,
  statusLabels,
  priorityColors,
} from "@/types/production";
import { statusLabels as orderStatusLabels } from "@/types/order";
import { Order } from "@/hooks/useFirebase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFirebase } from "@/hooks/useFirebase";
import { useLocation, useSearchParams } from "react-router-dom";

interface ProductionDashboardProps {
  tasks?: ProductionTask[];
  refreshToken?: number;
}

interface EnrichedTask extends ProductionTask {
  dueInMinutes?: number;
}

type StoredTask = {
  id: string;
  order_id: string;
  task_name?: string;
  priority?: string;
  assigned_operator?: string | null;
  estimated_hours?: number | string | null;
  notes?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

const PRODUCTION_STATUSES: Order["status"][] = [
  "confirmed",
  "in_production",
  "quality_check",
  "ready",
];

const TASK_STATUSES: ProductionTask["status"][] = [
  "pending",
  "in_progress",
  "completed",
  "paused",
  "blocked",
];

const TASK_PRIORITIES: ProductionTask["priority"][] = [
  "low",
  "medium",
  "high",
  "urgent",
];

const normalizeTaskStatusValue = (value: unknown): ProductionTask["status"] => {
  if (typeof value === "string") {
    const candidate = value.toLowerCase() as ProductionTask["status"];
    if (TASK_STATUSES.includes(candidate)) {
      return candidate;
    }
  }
  return "pending";
};

const normalizeTaskPriority = (value: unknown): ProductionTask["priority"] => {
  if (typeof value === "string") {
    const candidate = value.toLowerCase() as ProductionTask["priority"];
    if (TASK_PRIORITIES.includes(candidate)) {
      return candidate;
    }
  }
  return "medium";
};

const normalizeStatus = (value: unknown): Order["status"] => {
  if (typeof value === "string") {
    const candidate = value.toLowerCase() as Order["status"];
    if (
      PRODUCTION_STATUSES.concat([
        "pending",
        "delivered",
        "cancelled",
      ]).includes(candidate)
    ) {
      return candidate;
    }
  }
  return "pending";
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === "object" && value !== null) {
    const maybeNumber = (value as { toNumber?: () => number }).toNumber?.();
    if (typeof maybeNumber === "number" && Number.isFinite(maybeNumber)) {
      return maybeNumber;
    }
  }
  return fallback;
};

const parseDate = (value: unknown): Date | undefined => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return undefined;
    }
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const orderStatusToTaskStage = (
  status: Order["status"],
): ProductionTask["status"] => {
  switch (status) {
    case "confirmed":
      return "pending";
    case "in_production":
    case "quality_check":
    case "ready":
      return "in_progress";
    case "delivered":
      return "completed";
    default:
      return "pending";
  }
};

const orderStatusToProductionStage = (status: Order["status"]): string => {
  switch (status) {
    case "confirmed":
      return "cutting";
    case "in_production":
      return "assembly";
    case "quality_check":
      return "quality_control";
    case "ready":
      return "packaging";
    default:
      return "design";
  }
};

const computeProgress = (order: Order): number => {
  const progress = toNumber((order as any).production_progress);
  if (progress > 0) {
    return Math.min(progress, 100);
  }

  const status = normalizeStatus((order as any).status);
  switch (status) {
    case "confirmed":
      return 10;
    case "in_production":
      return 60;
    case "quality_check":
      return 85;
    case "ready":
      return 95;
    case "delivered":
      return 100;
    default:
      return 0;
  }
};

const mapOrderToTask = (order: Order): ProductionTask => {
  const status = normalizeStatus(order.status);
  const stageId = orderStatusToProductionStage(status);
  const stage = productionStages.find((item) => item.id === stageId);

  return {
    id: `task-${order.id}`,
    orderId: order.id,
    orderNumber: order.order_number,
    productName:
      order.products?.[0]?.product_name ||
      order.products?.[0]?.productName ||
      "Pedido",
    customerId: order.customer_id,
    customerName: order.customer_name || "Cliente",
    stage: stage?.id || "design",
    stageOrder: stage?.order ?? 1,
    status: orderStatusToTaskStage(status),
    priority: (order.priority || "medium") as ProductionTask["priority"],
    assignedOperator: order.assigned_operator || undefined,
    startTime:
      parseDate((order as any).started_at) || parseDate(order.updated_at),
    estimatedCompletionTime: parseDate(order.delivery_date),
    actualCompletionTime: parseDate(order.completed_date),
    progress: computeProgress(order),
    notes: order.notes || undefined,
  };
};

const enrichTask = (task: ProductionTask): EnrichedTask => {
  const dueInMinutes = task.estimatedCompletionTime
    ? Math.floor((task.estimatedCompletionTime.getTime() - Date.now()) / 60000)
    : undefined;

  return {
    ...task,
    dueInMinutes,
  };
};

export default function ProductionDashboard({
  tasks,
  refreshToken,
}: ProductionDashboardProps) {
  const { getOrders, updateOrder } = useFirebase();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [storedTasks, setStoredTasks] = useState<StoredTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const loadStoredTasks = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem("biobox_tasks");
      if (!raw) {
        setStoredTasks([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setStoredTasks([]);
        return;
      }

      const sanitized = parsed
        .filter(
          (item): item is StoredTask =>
            item !== null &&
            typeof item === "object" &&
            typeof (item as StoredTask).id === "string" &&
            typeof (item as StoredTask).order_id === "string",
        )
        .map((item) => item as StoredTask);

      setStoredTasks(sanitized);
    } catch (error) {
      console.error("Erro ao carregar tarefas locais:", error);
      setStoredTasks([]);
    }
  }, []);

  useEffect(() => {
    loadStoredTasks();
  }, [loadStoredTasks, refreshToken]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "biobox_tasks") {
        loadStoredTasks();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadStoredTasks]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersData = await getOrders();
        setOrders(ordersData);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const mapStoredTaskToProductionTask = useCallback(
    (task: StoredTask): ProductionTask => {
      const relatedOrder = orders.find((order) => order.id === task.order_id);
      const normalizedOrderStatus = relatedOrder
        ? normalizeStatus(relatedOrder.status)
        : "pending";
      const stageId = orderStatusToProductionStage(normalizedOrderStatus);
      const stage = productionStages.find((item) => item.id === stageId);

      const baseStatus = normalizeTaskStatusValue(task.status);
      const priority = normalizeTaskPriority(task.priority);
      const startTime =
        parseDate(task.created_at) ||
        (relatedOrder ? parseDate(relatedOrder.updated_at) : undefined);
      const estimatedHours = toNumber(task.estimated_hours);
      const estimatedCompletionTime =
        estimatedHours > 0 && startTime
          ? new Date(startTime.getTime() + estimatedHours * 60 * 60 * 1000)
          : relatedOrder
            ? parseDate(relatedOrder.delivery_date)
            : undefined;

      const actualCompletionTime =
        baseStatus === "completed"
          ? parseDate(task.updated_at) ||
            (relatedOrder ? parseDate(relatedOrder.completed_date) : undefined)
          : relatedOrder
            ? parseDate(relatedOrder.completed_date)
            : undefined;

      const productName =
        relatedOrder?.products?.[0]?.product_name ||
        (relatedOrder?.products?.[0] as any)?.productName ||
        task.task_name ||
        "Tarefa de produção";

      const progress =
        relatedOrder != null
          ? computeProgress(relatedOrder)
          : baseStatus === "completed"
            ? 100
            : baseStatus === "in_progress"
              ? 50
              : 0;

      return {
        id: task.id,
        orderId: task.order_id,
        orderNumber: relatedOrder?.order_number ?? task.order_id,
        productName,
        customerId: relatedOrder?.customer_id ?? task.order_id,
        customerName: relatedOrder?.customer_name ?? "Cliente",
        stage: stage?.id || "design",
        stageOrder: stage?.order ?? 1,
        status: baseStatus,
        priority,
        assignedOperator: task.assigned_operator ?? undefined,
        startTime,
        estimatedCompletionTime,
        actualCompletionTime,
        progress,
        notes: task.notes ?? undefined,
      };
    },
    [orders],
  );

  const localProductionTasks = useMemo(() => {
    if (storedTasks.length === 0) {
      return [];
    }

    const mapped = storedTasks.map(mapStoredTaskToProductionTask);
    const dedup = new Map<string, ProductionTask>();
    mapped.forEach((task) => {
      dedup.set(task.id, task);
    });
    return Array.from(dedup.values());
  }, [storedTasks, mapStoredTaskToProductionTask]);

  const mergedTasks = useMemo(() => {
    const baseMap = new Map<string, ProductionTask>();

    localProductionTasks.forEach((task) => {
      baseMap.set(task.id, task);
    });

    (tasks ?? []).forEach((task) => {
      baseMap.set(task.id, task);
    });

    const baseTasks = Array.from(baseMap.values());

    const orderTasks = orders
      .filter((order) =>
        PRODUCTION_STATUSES.includes(normalizeStatus(order.status)),
      )
      .map(mapOrderToTask);

    const existingOrderIds = new Set(
      baseTasks
        .map((task) => task.orderId)
        .filter((id): id is string => Boolean(id)),
    );

    const combined = [
      ...baseTasks,
      ...orderTasks.filter(
        (task) => task.orderId && !existingOrderIds.has(task.orderId),
      ),
    ];

    const dedupById = new Map<string, ProductionTask>();
    combined.forEach((task) => {
      dedupById.set(task.id, task);
    });

    return Array.from(dedupById.values())
      .sort((a, b) => a.stageOrder - b.stageOrder || b.progress - a.progress)
      .map(enrichTask);
  }, [tasks, orders, localProductionTasks]);

  useEffect(() => {
    if (mergedTasks.length === 0) {
      setSelectedTask(null);
      return;
    }

    const preferredOrderId =
      searchParams.get("orderId") || (location.state as any)?.orderId || null;

    if (preferredOrderId) {
      const preferred = mergedTasks.find(
        (task) =>
          task.orderId === preferredOrderId ||
          task.id === `task-${preferredOrderId}`,
      );
      if (preferred) {
        setSelectedTask(preferred);
        return;
      }
    }

    setSelectedTask((current) => {
      if (!current) {
        return mergedTasks[0];
      }
      const updated = mergedTasks.find((task) => task.id === current.id);
      return updated ?? mergedTasks[0];
    });
  }, [mergedTasks, searchParams, location.state]);

  const taskStats = useMemo(() => {
    const active = mergedTasks.filter(
      (task) => task.status === "in_progress",
    ).length;
    const pending = mergedTasks.filter(
      (task) => task.status === "pending",
    ).length;
    const completed = mergedTasks.filter(
      (task) => task.status === "completed",
    ).length;
    const delayed = mergedTasks.filter(
      (task) =>
        typeof task.dueInMinutes === "number" &&
        task.dueInMinutes < 0 &&
        task.status !== "completed",
    ).length;

    const averageProgress = mergedTasks.length
      ? Math.round(
          mergedTasks.reduce((sum, task) => sum + task.progress, 0) /
            mergedTasks.length,
        )
      : 0;

    return {
      total: mergedTasks.length,
      active,
      pending,
      completed,
      delayed,
      averageProgress,
    };
  }, [mergedTasks]);

  const renderTaskCard = (task: EnrichedTask) => {
    const stage = productionStages.find((item) => item.id === task.stage);
    const hasIssues = Array.isArray(task.issues) && task.issues.length > 0;

    return (
      <Card
        key={task.id}
        className={cn(
          "cursor-pointer border-border bg-card transition-colors hover:bg-muted/5",
          selectedTask?.id === task.id && "ring-2 ring-biobox-green",
        )}
        onClick={() => setSelectedTask(task)}
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  priorityColors[task.priority],
                )}
              />
              <span className="text-sm font-medium">{task.orderNumber}</span>
            </div>
            <Badge
              variant="outline"
              className={cn("text-xs", statusColors[task.status])}
            >
              {statusLabels[task.status]}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">{task.productName}</p>
            <p className="text-xs text-muted-foreground">{task.customerName}</p>
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <Package className="mr-1 h-3 w-3" />
            <span>{stage?.name ?? "Etapa de produção"}</span>
          </div>

          {task.assignedOperator && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Avatar className="mr-2 h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {task.assignedOperator
                    .split(" ")
                    .map((item) => item[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{task.assignedOperator}</span>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Progresso</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>

          {typeof task.dueInMinutes === "number" &&
            task.status === "in_progress" && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                <span>
                  {task.dueInMinutes > 0
                    ? `${task.dueInMinutes} min restantes`
                    : "Atrasado"}
                </span>
              </div>
            )}

          {hasIssues && (
            <div className="flex items-center text-xs text-red-500">
              <AlertTriangle className="mr-1 h-3 w-3" />
              <span>{task.issues!.length} problema(s)</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTaskDetail = () => {
    if (!selectedTask) {
      return (
        <Card className="border-border bg-card">
          <CardContent className="flex h-full items-center justify-center p-10 text-center text-sm text-muted-foreground">
            Selecione uma tarefa para ver os detalhes.
          </CardContent>
        </Card>
      );
    }

    const stage = productionStages.find(
      (item) => item.id === selectedTask.stage,
    );
    const startedAt = selectedTask.startTime
      ? format(selectedTask.startTime, "dd 'de' MMMM yyyy, HH:mm", {
          locale: ptBR,
        })
      : "Não iniciado";
    const dueAt = selectedTask.estimatedCompletionTime
      ? format(
          selectedTask.estimatedCompletionTime,
          "dd 'de' MMMM yyyy, HH:mm",
          { locale: ptBR },
        )
      : "Não definido";

    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>{selectedTask.orderNumber}</span>
            <Badge
              variant="outline"
              className={cn("text-xs", statusColors[selectedTask.status])}
            >
              {statusLabels[selectedTask.status]}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium">{selectedTask.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Produto</p>
              <p className="text-sm font-medium">{selectedTask.productName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Etapa</p>
              <p className="text-sm font-medium">
                {stage?.name ?? "Etapa de produção"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prioridade</p>
              <Badge
                variant="outline"
                className={cn("text-xs", priorityColors[selectedTask.priority])}
              >
                {selectedTask.priority === "low"
                  ? "Baixa"
                  : selectedTask.priority === "medium"
                    ? "Média"
                    : selectedTask.priority === "high"
                      ? "Alta"
                      : "Urgente"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Início</p>
              <p className="text-sm font-medium">{startedAt}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Previsão de término
              </p>
              <p className="text-sm font-medium">{dueAt}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Progresso</p>
            <Progress value={selectedTask.progress} className="h-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedTask.progress}% concluído
            </p>
          </div>

          {selectedTask.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="text-sm text-muted-foreground">
                {selectedTask.notes}
              </p>
            </div>
          )}

          {selectedTask.issues && selectedTask.issues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-red-500">
                <AlertTriangle className="h-4 w-4" />
                <span>Problemas registrados</span>
              </div>
              <ul className="space-y-2 text-xs text-red-500">
                {selectedTask.issues.map((issue) => (
                  <li
                    key={issue.id}
                    className="rounded border border-red-500/20 p-2"
                  >
                    <p className="font-medium">{issue.type.toUpperCase()}</p>
                    <p>{issue.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-border mt-4">
            {(() => {
              const relatedOrder = orders.find(
                (o) => o.id === selectedTask.orderId,
              );
              if (!relatedOrder) return null;

              const nextStatuses: Record<
                string,
                { status: any; label: string; color: string }[]
              > = {
                pending: [
                  {
                    status: "confirmed",
                    label: "Confirmar",
                    color: "bg-blue-500",
                  },
                  {
                    status: "cancelled",
                    label: "Cancelar",
                    color: "bg-red-500",
                  },
                ],
                confirmed: [
                  {
                    status: "in_production",
                    label: "Iniciar Produção",
                    color: "bg-purple-500",
                  },
                  {
                    status: "cancelled",
                    label: "Cancelar",
                    color: "bg-red-500",
                  },
                ],
                in_production: [
                  {
                    status: "quality_check",
                    label: "CQ",
                    color: "bg-orange-500",
                  },
                  {
                    status: "cancelled",
                    label: "Cancelar Produção",
                    color: "bg-red-500",
                  },
                ],
                quality_check: [
                  { status: "ready", label: "Aprovar", color: "bg-green-500" },
                  {
                    status: "in_production",
                    label: "Reprovar",
                    color: "bg-purple-500",
                  },
                  {
                    status: "cancelled",
                    label: "Cancelar Produção",
                    color: "bg-red-500",
                  },
                ],
                ready: [
                  {
                    status: "delivered",
                    label: "Entregar",
                    color: "bg-gray-500",
                  },
                  {
                    status: "cancelled",
                    label: "Cancelar Produção",
                    color: "bg-red-500",
                  },
                ],
              };

              const options = nextStatuses[relatedOrder.status] || [];
              if (options.length === 0) return null;

              const handleTransition = async (nextStatus: any) => {
                const updates: any = { status: nextStatus };
                if (nextStatus === "in_production")
                  updates.production_progress = 10;
                if (nextStatus === "quality_check")
                  updates.production_progress = 80;
                if (nextStatus === "ready") updates.production_progress = 100;
                if (nextStatus === "delivered")
                  updates.completed_date = new Date().toISOString();
                if (nextStatus === "cancelled") updates.production_progress = 0;

                const updated = await updateOrder(relatedOrder.id, updates);
                if (updated) {
                  setOrders((prev) =>
                    prev.map((o) => (o.id === updated.id ? updated : o)),
                  );
                  setSelectedTask((current) =>
                    current && current.orderId === updated.id
                      ? enrichTask(mapOrderToTask(updated))
                      : current,
                  );
                  toast({
                    title: "Status atualizado",
                    description: `Pedido ${updated.order_number} agora está em "${orderStatusLabels[updated.status]}"`,
                  });
                }
              };

              return (
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground">
                    Alterar status do pedido
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                      <Button
                        key={option.status}
                        size="sm"
                        className={`${option.color} hover:opacity-90 text-white`}
                        onClick={() => handleTransition(option.status)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && mergedTasks.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-border bg-card">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Tarefas em andamento
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {taskStats.active}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Tarefas pendentes
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {taskStats.pending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-biobox-green" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Concluídas
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {taskStats.completed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Atrasadas
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {taskStats.delayed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fila de produção</span>
            <Badge variant="outline" className="text-xs">
              {taskStats.total} tarefa{taskStats.total !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="w-full overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="active">Em andamento</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="completed">Concluídas</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {mergedTasks.filter((task) => task.status === "in_progress")
                .length === 0 ? (
                <div className="rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  Nenhuma tarefa em progresso.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {mergedTasks
                    .filter((task) => task.status === "in_progress")
                    .map(renderTaskCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {mergedTasks.filter((task) => task.status === "pending")
                .length === 0 ? (
                <div className="rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  Nenhuma tarefa pendente.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {mergedTasks
                    .filter((task) => task.status === "pending")
                    .map(renderTaskCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {mergedTasks.filter((task) => task.status === "completed")
                .length === 0 ? (
                <div className="rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  Nenhuma tarefa concluída.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {mergedTasks
                    .filter((task) => task.status === "completed")
                    .map(renderTaskCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Detalhes da tarefa selecionada</CardTitle>
        </CardHeader>
        <CardContent>{renderTaskDetail()}</CardContent>
      </Card>
    </div>
  );
}
