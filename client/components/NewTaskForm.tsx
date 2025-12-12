import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  Calendar as CalendarIcon,
  User,
  Package,
  Clock,
} from "lucide-react";
import { ProductionTask, productionStages } from "@/types/production";
import { useFirebase, Order } from "@/hooks/useFirebase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewTaskFormProps {
  onSave: (task: Partial<ProductionTask>) => void;
  onCancel: () => void;
}

export default function NewTaskForm({ onSave, onCancel }: NewTaskFormProps) {
  const [formData, setFormData] = useState({
    orderId: "",
    stage: "",
    priority: "medium" as ProductionTask["priority"],
    assignedOperator: "",
    estimatedCompletionTime: new Date(),
    notes: "",
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { getOrders } = useFirebase();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const orders = await getOrders();
      const filtered = orders.filter((order) =>
        ["confirmed", "in_production"].includes(order.status),
      );
      setAvailableOrders(filtered);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedOrder = availableOrders.find(
    (order) => order.id === formData.orderId,
  );
  const selectedStage = productionStages.find(
    (stage) => stage.id === formData.stage,
  );
  const availableOperators: any[] = [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder || !selectedStage) return;

    const newTask: Partial<ProductionTask> = {
      ...formData,
      id: Date.now().toString(),
      orderNumber: selectedOrder.order_number,
      productName: selectedOrder.products?.[0]?.product_name || "Produto",
      customerId: selectedOrder.customer_id,
      customerName: selectedOrder.customer_name || "Cliente",
      stageOrder: selectedStage.order,
      status: "pending",
      progress: 0,
      startTime: undefined,
      actualCompletionTime: undefined,
    };

    onSave(newTask);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Nova Tarefa de Produção</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order">Pedido</Label>
                <Select
                  value={formData.orderId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, orderId: value }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loading
                          ? "Carregando pedidos..."
                          : availableOrders.length === 0
                            ? "Nenhum pedido disponível"
                            : "Selecione um pedido"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        <div>
                          <div className="font-medium">
                            {order.order_number}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer_name} -{" "}
                            {order.products?.[0]?.product_name || "Produto"}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: value as ProductionTask["priority"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stage">Etapa de Produção</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, stage: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {productionStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div>
                          <div className="font-medium">{stage.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ~{stage.estimatedTime} min
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="operator">Operador</Label>
                <Select
                  value={formData.assignedOperator}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      assignedOperator: value,
                    }))
                  }
                  disabled={!selectedStage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.name}>
                        <div>
                          <div className="font-medium">{operator.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Eficiência: {operator.efficiency}% •{" "}
                            {operator.status === "available"
                              ? "Disponível"
                              : "Ocupado"}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Data de Conclusão Estimada</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(
                      formData.estimatedCompletionTime,
                      "dd/MM/yyyy HH:mm",
                      { locale: ptBR },
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.estimatedCompletionTime}
                    onSelect={(date) => {
                      if (date) {
                        setFormData((prev) => ({
                          ...prev,
                          estimatedCompletionTime: date,
                        }));
                        setShowCalendar(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {selectedStage && (
              <div className="p-4 bg-muted/5 rounded-lg">
                <h4 className="font-medium mb-2">Detalhes da Etapa</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Tempo Estimado:
                    </span>
                    <span className="ml-2 font-medium">
                      {selectedStage.estimatedTime} minutos
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Habilidades:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedStage.requiredSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground">Descrição:</span>
                  <p className="text-sm mt-1">{selectedStage.description}</p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Observações especiais para esta tarefa..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-biobox-green hover:bg-biobox-green-dark"
                disabled={!formData.orderId || !formData.stage}
              >
                <Save className="h-4 w-4 mr-2" />
                Criar Tarefa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
