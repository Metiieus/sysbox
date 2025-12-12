import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useFirebase, Order } from "@/hooks/useFirebase";

interface NewProductionTaskProps {
  onClose: () => void;
  onSaved?: () => void;
}

export default function NewProductionTask({
  onClose,
  onSaved,
}: NewProductionTaskProps) {
  const { getOrders } = useFirebase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({
    order_id: "",
    task_name: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    assigned_operator: "",
    estimated_hours: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const os = await getOrders();
      setOrders(os);
    })();
  }, []);

  const canSave = () => !!form.order_id && !!form.task_name;

  const handleSave = () => {
    const tasksRaw = localStorage.getItem("biobox_tasks");
    const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
    const newTask = {
      id: `task-${Date.now()}`,
      order_id: form.order_id,
      task_name: form.task_name,
      priority: form.priority,
      assigned_operator: form.assigned_operator || null,
      estimated_hours: form.estimated_hours
        ? Number(form.estimated_hours)
        : null,
      notes: form.notes || null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem("biobox_tasks", JSON.stringify([newTask, ...tasks]));
    onSaved?.();
    onClose();
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Pedido</Label>
            <Select
              value={form.order_id}
              onValueChange={(v: any) =>
                setForm((prev) => ({ ...prev, order_id: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.order_number} • {o.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select
              value={form.priority}
              onValueChange={(v: any) =>
                setForm((prev) => ({ ...prev, priority: v }))
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
        <div>
          <Label>Nome da Tarefa</Label>
          <Input
            value={form.task_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, task_name: e.target.value }))
            }
            placeholder="Ex: Corte de MDF"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Operador (opcional)</Label>
            <Input
              value={form.assigned_operator}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  assigned_operator: e.target.value,
                }))
              }
              placeholder="Nome do operador"
            />
          </div>
          <div>
            <Label>Horas Estimadas (opcional)</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={form.estimated_hours}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  estimated_hours: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <div>
          <Label>Observações</Label>
          <Textarea
            rows={3}
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-biobox-green hover:bg-biobox-green-dark"
            onClick={handleSave}
            disabled={!canSave()}
          >
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
