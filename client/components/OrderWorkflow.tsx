// client/components/OrderWorkflow.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  Truck,
  User,
  Calendar,
  FileText,
  ArrowRight,
  Play,
  Pause,
  XCircle,
  CheckCheck,
} from "lucide-react";
import { Order } from "@/hooks/useFirebase";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface OrderWorkflowProps {
  order: Order;
  onUpdate: (orderId: string, updates: Partial<Order>) => Promise<void>;
  operators?: string[];
}

interface WorkflowStep {
  id: Order["status"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiredFields?: string[];
  actions?: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    handler: () => void;
    variant?: "default" | "secondary" | "outline" | "destructive";
  }[];
}

export default function OrderWorkflow({
  order,
  onUpdate,
  operators = [],
}: OrderWorkflowProps) {
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<
    "advance" | "issue" | "cancel" | null
  >(null);
  const [actionData, setActionData] = useState<any>({
    notes: "",
    operator: "",
    estimatedTime: "",
    issueDescription: "",
    cancelReason: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const workflowSteps: WorkflowStep[] = [
    {
      id: "pending",
      label: "Pendente",
      icon: Clock,
      description: "Aguardando confirmação do pedido",
      actions: [
        {
          label: "Aceitar Pedido",
          icon: CheckCircle,
          handler: () => openActionDialog("advance"),
          variant: "default",
        },
        {
          label: "Cancelar",
          icon: XCircle,
          handler: () => openActionDialog("cancel"),
          variant: "destructive",
        },
      ],
    },
    {
      id: "confirmed",
      label: "Confirmado",
      icon: CheckCircle,
      description: "Pedido confirmado e aguardando produção",
      requiredFields: ["operator"],
      actions: [
        {
          label: "Iniciar Produção",
          icon: Play,
          handler: () => openActionDialog("advance"),
          variant: "default",
        },
        {
          label: "Reportar Problema",
          icon: AlertTriangle,
          handler: () => openActionDialog("issue"),
          variant: "outline",
        },
      ],
    },
    {
      id: "in_production",
      label: "Em Produção",
      icon: Package,
      description: "Produto sendo fabricado",
      actions: [
        {
          label: "Atualizar Progresso",
          icon: ArrowRight,
          handler: () => openActionDialog("advance"),
          variant: "default",
        },
        {
          label: "Pausar",
          icon: Pause,
          handler: () => openActionDialog("issue"),
          variant: "secondary",
        },
      ],
    },
    {
      id: "quality_check",
      label: "Controle de Qualidade",
      icon: CheckCheck,
      description: "Verificando qualidade do produto",
      actions: [
        {
          label: "Aprovar Qualidade",
          icon: CheckCircle,
          handler: () => openActionDialog("advance"),
          variant: "default",
        },
        {
          label: "Reprovar",
          icon: XCircle,
          handler: () => openActionDialog("issue"),
          variant: "destructive",
        },
      ],
    },
    {
      id: "ready",
      label: "Pronto para Entrega",
      icon: Truck,
      description: "Produto finalizado aguardando transporte",
      actions: [
        {
          label: "Confirmar Entrega",
          icon: CheckCircle,
          handler: () => openActionDialog("advance"),
          variant: "default",
        },
      ],
    },
    {
      id: "delivered",
      label: "Entregue",
      icon: CheckCircle,
      description: "Pedido entregue ao cliente",
    },
    {
      id: "cancelled",
      label: "Cancelado",
      icon: XCircle,
      description: "Pedido cancelado",
    },
  ];

  const currentStepIndex = workflowSteps.findIndex(
    (step) => step.id === order.status,
  );
  const currentStep = workflowSteps[currentStepIndex];

  const openActionDialog = (type: "advance" | "issue" | "cancel") => {
    setActionType(type);
    setShowActionDialog(true);
    setActionData({
      notes: "",
      operator: order.assigned_operator || "",
      estimatedTime: "",
      issueDescription: "",
      cancelReason: "",
      progressUpdate: order.production_progress || 0,
    });
  };

  const getNextStatus = (): Order["status"] | null => {
    const statusFlow: Record<Order["status"], Order["status"] | null> = {
      pending: "confirmed",
      confirmed: "in_production",
      in_production: "quality_check",
      quality_check: "ready",
      ready: "delivered",
      delivered: null,
      cancelled: null,
    };
    return statusFlow[order.status];
  };

  const handleAction = async () => {
    try {
      setLoading(true);

      const updates: Partial<Order> = {
        notes: actionData.notes || order.notes,
      };

      if (actionType === "advance") {
        const nextStatus = getNextStatus();
        if (nextStatus) {
          updates.status = nextStatus;

          // Atualizar progresso baseado no status
          const progressMap: Record<Order["status"], number> = {
            pending: 0,
            confirmed: 10,
            in_production: 50,
            quality_check: 80,
            ready: 95,
            delivered: 100,
            cancelled: 0,
          };
          updates.production_progress = progressMap[nextStatus];

          // Adicionar operador se especificado
          if (actionData.operator) {
            updates.assigned_operator = actionData.operator;
          }

          // Marcar data de conclusão se entregue
          if (nextStatus === "delivered") {
            updates.completed_date = new Date().toISOString();
          }
        }
      } else if (actionType === "cancel") {
        updates.status = "cancelled";
        updates.production_progress = 0;
        updates.notes = `Cancelado: ${actionData.cancelReason}. ${actionData.notes || ""}`;
      } else if (actionType === "issue") {
        // Manter status atual mas adicionar nota sobre o problema
        updates.notes = `PROBLEMA: ${actionData.issueDescription}. ${actionData.notes || ""}`;
      }

      await onUpdate(order.id, updates);

      toast({
        title: "Pedido atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      setShowActionDialog(false);
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o pedido.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    const colors = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      in_production: "bg-purple-500",
      quality_check: "bg-orange-500",
      ready: "bg-green-500",
      delivered: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status];
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "Não definido";
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Fluxo do Pedido #{order.order_number}
          </span>
          <Badge className={cn("text-white", getStatusColor(order.status))}>
            {currentStep?.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso Total</span>
            <span className="font-medium">{order.production_progress}%</span>
          </div>
          <Progress value={order.production_progress} className="h-3" />
        </div>

        {/* Workflow Steps */}
        <div className="relative">
          {workflowSteps.slice(0, -1).map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <div key={step.id} className="flex items-start mb-8 last:mb-0">
                {/* Step Indicator */}
                <div className="flex flex-col items-center mr-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isCompleted && "bg-biobox-gold text-white",
                      isCurrent && "bg-blue-500 text-white animate-pulse",
                      isFuture && "bg-gray-300 text-gray-500",
                    )}
                  >
                    <StepIcon className="h-5 w-5" />
                  </div>
                  {index < workflowSteps.length - 2 && (
                    <div
                      className={cn(
                        "w-0.5 h-20 mt-2",
                        isCompleted ? "bg-biobox-gold" : "bg-gray-300",
                      )}
                    />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{step.label}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {step.description}
                  </p>

                  {isCurrent && (
                    <div className="space-y-3">
                      {/* Action Buttons */}
                      {step.actions && (
                        <div className="flex gap-2 flex-wrap">
                          {step.actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant={action.variant || "default"}
                              size="sm"
                              onClick={action.handler}
                              disabled={loading}
                            >
                              <action.icon className="h-4 w-4 mr-2" />
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Current Status Info */}
                      <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                        {order.assigned_operator && (
                          <div className="flex items-center text-sm">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Operador: {order.assigned_operator}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            Atualizado: {formatDate(order.updated_at)}
                          </span>
                        </div>
                        {order.notes && (
                          <div className="flex items-start text-sm">
                            <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                            <span className="flex-1">{order.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "advance" && "Avançar Etapa"}
                {actionType === "issue" && "Reportar Problema"}
                {actionType === "cancel" && "Cancelar Pedido"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "advance" &&
                  "Confirme os detalhes para avançar o pedido para a próxima etapa."}
                {actionType === "issue" &&
                  "Descreva o problema encontrado no processamento do pedido."}
                {actionType === "cancel" &&
                  "Informe o motivo do cancelamento do pedido."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {actionType === "advance" &&
                currentStep?.requiredFields?.includes("operator") && (
                  <div>
                    <Label>Operador Responsável</Label>
                    <Select
                      value={actionData.operator}
                      onValueChange={(value) =>
                        setActionData((prev: any) => ({
                          ...prev,
                          operator: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um operador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Carlos Mendes">
                          Carlos Mendes
                        </SelectItem>
                        <SelectItem value="Ana Lima">Ana Lima</SelectItem>
                        <SelectItem value="José Roberto">
                          José Roberto
                        </SelectItem>
                        <SelectItem value="Maria Silva">Maria Silva</SelectItem>
                        <SelectItem value="Pedro Santos">
                          Pedro Santos
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {actionType === "issue" && (
                <div>
                  <Label>Descrição do Problema</Label>
                  <Textarea
                    value={actionData.issueDescription}
                    onChange={(e) =>
                      setActionData((prev: any) => ({
                        ...prev,
                        issueDescription: e.target.value,
                      }))
                    }
                    placeholder="Descreva o problema encontrado..."
                    rows={3}
                  />
                </div>
              )}

              {actionType === "cancel" && (
                <div>
                  <Label>Motivo do Cancelamento</Label>
                  <Select
                    value={actionData.cancelReason}
                    onValueChange={(value) =>
                      setActionData((prev: any) => ({
                        ...prev,
                        cancelReason: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cliente cancelou">
                        Cliente cancelou
                      </SelectItem>
                      <SelectItem value="Falta de material">
                        Falta de material
                      </SelectItem>
                      <SelectItem value="Problema na produção">
                        Problema na produção
                      </SelectItem>
                      <SelectItem value="Erro no pedido">
                        Erro no pedido
                      </SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Observações Adicionais</Label>
                <Textarea
                  value={actionData.notes}
                  onChange={(e) =>
                    setActionData((prev: any) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Adicione observações relevantes..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowActionDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAction}
                disabled={loading}
                className={
                  actionType === "cancel" ? "bg-red-500 hover:bg-red-600" : ""
                }
              >
                {loading ? "Processando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
