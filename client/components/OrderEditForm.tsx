import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  Plus,
  Trash2,
  Edit,
  Package,
  AlertCircle,
} from "lucide-react";

// Tipos
interface OrderProduct {
  product_name: string;
  model: string;
  size: string;
  color: string;
  fabric: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderFragment {
  id: string;
  order_id: string;
  product_id?: string;
  product_name?: string;
  size?: string;
  color?: string;
  fragment_number: number;
  quantity: number;
  scheduled_date: string;
  status: "pending" | "in_production" | "completed";
  progress: number;
  value: number;
  assigned_operator?: string;
  started_at?: string;
  completed_at?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_trade_name?: string;
  payment_condition?: string;
  representative?: string;
  customer_phone: string;
  customer_email?: string;
  seller_name: string;
  status:
    | "pending"
    | "confirmed"
    | "in_production"
    | "quality_check"
    | "ready"
    | "delivered"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  scheduled_date: string;
  delivery_date?: string;
  total_amount: number;
  total_quantity: number;
  production_progress: number;
  notes?: string;
  assigned_operator?: string;
  products: OrderProduct[];
  fragments: OrderFragment[];
  is_fragmented: boolean;
}

interface OrderEditFormProps {
  order: Order;
  onSave: (order: Order) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_production: "Em Produção",
  quality_check: "Controle de Qualidade",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const fragmentStatusLabels = {
  pending: "Pendente",
  in_production: "Em Produção",
  completed: "Concluído",
};

export default function OrderEditForm({
  order,
  onSave,
  onCancel,
  saving = false,
}: OrderEditFormProps) {
  // Inicializar com valores seguros
  const [formData, setFormData] = useState<Order>(() => ({
    ...order,
    products: order.products || [],
    fragments: order.fragments || [],
  }));

  useEffect(() => {
    setFormData({
      ...order,
      products: order.products || [],
      fragments: order.fragments || [],
    });
  }, [order]);

  const handleChange = (field: keyof Order, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (
    index: number,
    field: keyof OrderProduct,
    value: any,
  ) => {
    const newProducts = [...(formData.products || [])];
    newProducts[index] = { ...newProducts[index], [field]: value };

    if (field === "quantity" || field === "unit_price") {
      newProducts[index].total_price =
        newProducts[index].quantity * newProducts[index].unit_price;
    }

    const totalAmount = newProducts.reduce(
      (sum, p) => sum + (p.total_price || 0),
      0,
    );
    const totalQuantity = newProducts.reduce(
      (sum, p) => sum + (p.quantity || 0),
      0,
    );

    setFormData((prev) => ({
      ...prev,
      products: newProducts,
      total_amount: totalAmount,
      total_quantity: totalQuantity,
    }));
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...(prev.products || []),
        {
          product_name: "",
          model: "",
          size: "",
          color: "",
          fabric: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
        },
      ],
    }));
  };

  const removeProduct = (index: number) => {
    const newProducts = (formData.products || []).filter((_, i) => i !== index);
    const totalAmount = newProducts.reduce(
      (sum, p) => sum + (p.total_price || 0),
      0,
    );
    const totalQuantity = newProducts.reduce(
      (sum, p) => sum + (p.quantity || 0),
      0,
    );

    setFormData((prev) => ({
      ...prev,
      products: newProducts,
      total_amount: totalAmount,
      total_quantity: totalQuantity,
    }));
  };

  const handleFragmentChange = (
    index: number,
    field: keyof OrderFragment,
    value: any,
  ) => {
    const newFragments = [...(formData.fragments || [])];
    newFragments[index] = { ...newFragments[index], [field]: value };
    setFormData((prev) => ({ ...prev, fragments: newFragments }));
  };

  const addFragment = () => {
    const newFragment: OrderFragment = {
      id: `frag-${Date.now()}`,
      order_id: formData.id,
      fragment_number: (formData.fragments || []).length + 1,
      quantity: 0,
      scheduled_date: formData.scheduled_date,
      status: "pending",
      progress: 0,
      value: 0,
      assigned_operator: "",
    };

    setFormData((prev) => ({
      ...prev,
      fragments: [...(prev.fragments || []), newFragment],
      is_fragmented: true,
    }));
  };

  const removeFragment = (index: number) => {
    const newFragments = (formData.fragments || []).filter(
      (_, i) => i !== index,
    );
    setFormData((prev) => ({
      ...prev,
      fragments: newFragments,
      is_fragmented: newFragments.length > 0,
    }));
  };

  const handleSubmit = async () => {
    await onSave(formData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Editar Pedido {order.order_number}
        </DialogTitle>
        <DialogDescription>
          Atualize as informações do pedido e gerencie fragmentação
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Cliente *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    handleChange("customer_name", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Telefone *</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    handleChange("customer_phone", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_trade_name">Nome Fantasia</Label>
                <Input
                  id="customer_trade_name"
                  value={formData.customer_trade_name || ""}
                  onChange={(e) =>
                    handleChange("customer_trade_name", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="representative">Representante</Label>
                <Input
                  id="representative"
                  value={formData.representative || ""}
                  onChange={(e) =>
                    handleChange("representative", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="payment_condition">Condição de Pagamento</Label>
                <Input
                  id="payment_condition"
                  value={formData.payment_condition || ""}
                  onChange={(e) =>
                    handleChange("payment_condition", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seller_name">Vendedor *</Label>
                <Input
                  id="seller_name"
                  value={formData.seller_name}
                  onChange={(e) => handleChange("seller_name", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_email">E-mail</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email || ""}
                  onChange={(e) =>
                    handleChange("customer_email", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_date">Data de Produção</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date?.split("T")[0] || ""}
                  onChange={(e) =>
                    handleChange("scheduled_date", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="delivery_date">Data de Entrega</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date?.split("T")[0] || ""}
                  onChange={(e) =>
                    handleChange("delivery_date", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_operator">Operador Responsável</Label>
                <Input
                  id="assigned_operator"
                  value={formData.assigned_operator || ""}
                  onChange={(e) =>
                    handleChange("assigned_operator", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="production_progress">Progresso (%)</Label>
                <Input
                  id="production_progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.production_progress}
                  onChange={(e) =>
                    handleChange(
                      "production_progress",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Produtos do Pedido</CardTitle>
              <Button onClick={addProduct} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!formData.products || formData.products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto adicionado</p>
              </div>
            ) : (
              formData.products.map((product, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Produto {index + 1}</span>
                    <Button
                      onClick={() => removeProduct(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nome do Produto *</Label>
                      <Input
                        value={product.product_name}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "product_name",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Modelo</Label>
                      <Input
                        value={product.model}
                        onChange={(e) =>
                          handleProductChange(index, "model", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Tamanho</Label>
                      <Input
                        value={product.size}
                        onChange={(e) =>
                          handleProductChange(index, "size", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Cor</Label>
                      <Input
                        value={product.color}
                        onChange={(e) =>
                          handleProductChange(index, "color", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Tecido</Label>
                      <Input
                        value={product.fabric}
                        onChange={(e) =>
                          handleProductChange(index, "fabric", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Preço Unit. (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.unit_price}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "unit_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Subtotal</Label>
                      <Input
                        value={formatCurrency(product.total_price)}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Fragmentação */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Fragmentação de Produção
              </CardTitle>
              <Button onClick={addFragment} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Fragmento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.fragments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Pedido não fragmentado</p>
                <p className="text-sm mt-1">
                  Adicione fragmentos para dividir a produção
                </p>
              </div>
            ) : (
              formData.fragments.map((fragment, index) => (
                <div
                  key={fragment.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Fragmento {fragment.fragment_number}
                    </span>
                    <Button
                      onClick={() => removeFragment(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={fragment.quantity}
                        onChange={(e) =>
                          handleFragmentChange(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fragment.value}
                        onChange={(e) =>
                          handleFragmentChange(
                            index,
                            "value",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Progresso (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={fragment.progress}
                        onChange={(e) =>
                          handleFragmentChange(
                            index,
                            "progress",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Data Agendada</Label>
                      <Input
                        type="date"
                        value={fragment.scheduled_date?.split("T")[0] || ""}
                        onChange={(e) =>
                          handleFragmentChange(
                            index,
                            "scheduled_date",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={fragment.status}
                        onValueChange={(value) =>
                          handleFragmentChange(index, "status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(fragmentStatusLabels).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Operador Responsável</Label>
                    <Input
                      value={fragment.assigned_operator || ""}
                      onChange={(e) =>
                        handleFragmentChange(
                          index,
                          "assigned_operator",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total de Produtos
                </p>
                <p className="text-2xl font-bold">{formData.products.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Quantidade Total
                </p>
                <p className="text-2xl font-bold">{formData.total_quantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Valor Total
                </p>
                <p className="text-2xl font-bold text-biobox-green">
                  {formatCurrency(formData.total_amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter className="gap-2">
        <Button onClick={onCancel} variant="outline" disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-biobox-green hover:bg-biobox-green-dark"
          disabled={saving || formData.products.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </DialogFooter>
    </div>
  );
}
