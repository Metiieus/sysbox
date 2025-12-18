import { useState } from "react";
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
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  User,
  Package,
} from "lucide-react";
import { Order, OrderProduct, OrderFragment, Product } from "@/types/order";
import { Customer } from "@/types/customer";
import OrderFragmentForm from "@/components/OrderFragmentForm";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderFormProps {
  order?: Order;
  onSave: (order: Partial<Order>) => void;
  onCancel: () => void;
  customers?: Customer[];
  products?: Product[];
}

export default function OrderForm({
  order,
  onSave,
  onCancel,
  customers = [],
  products = [],
}: OrderFormProps) {
  const [formData, setFormData] = useState({
    customerId: order?.customerId || "",
    customerName: order?.customerName || "",
    customerTradeName: order?.customerTradeName || "",
    paymentCondition: order?.paymentCondition || "",
    representative: order?.representative || "",
    status: order?.status || ("pending" as Order["status"]),
    priority: order?.priority || ("medium" as Order["priority"]),
    scheduledDate: order?.scheduledDate || new Date(),
    deliveryDate: order?.deliveryDate || new Date(),
    notes: order?.notes || "",
    products: order?.products || ([] as OrderProduct[]),
  });

  const [showCalendar, setShowCalendar] = useState<
    "scheduled" | "delivery" | null
  >(null);
  const [newProduct, setNewProduct] = useState({
    productId: "",
    model: "",
    size: "",
    color: "",
    fabric: "",
    quantity: 1,
    specifications: {} as Record<string, string>,
  });
  const [fragments, setFragments] = useState<OrderFragment[]>([]);
  const [showFragmentForm, setShowFragmentForm] = useState(false);
  const [fragmentData, setFragmentData] = useState<{
    quantity: number;
    value: number;
  } | null>(null);

  const selectedCustomer = customers.find((c) => c.id === formData.customerId);
  const selectedProduct = products.find((p) => p.id === newProduct.productId);
  const selectedModel = selectedProduct?.models.find(
    (m) => m.id === newProduct.model,
  );

  const calculateProductPrice = () => {
    if (!selectedProduct || !selectedModel) return 0;
    return (
      selectedProduct.basePrice *
      selectedModel.priceModifier *
      newProduct.quantity
    );
  };

  const calculateTotalAmount = () => {
    return formData.products.reduce(
      (total, product) => total + product.totalPrice,
      0,
    );
  };

  const handleAddProduct = () => {
    if (!selectedProduct || !selectedModel) return;

    const productToAdd: OrderProduct = {
      id: Date.now().toString(),
      productId: newProduct.productId,
      productName: selectedProduct.name,
      model: selectedModel.name,
      size: newProduct.size,
      color: newProduct.color,
      fabric: newProduct.fabric,
      quantity: newProduct.quantity,
      unitPrice: selectedProduct.basePrice * selectedModel.priceModifier,
      totalPrice: calculateProductPrice(),
      specifications: newProduct.specifications,
    };

    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, productToAdd],
    }));

    setNewProduct({
      productId: "",
      model: "",
      size: "",
      color: "",
      fabric: "",
      quantity: 1,
      specifications: {},
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalOrderData = {
      ...formData,
      orderNumber:
        order?.orderNumber ||
        `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      totalAmount: calculateTotalAmount(),
      productionProgress: order?.productionProgress || 0,
      createdAt: order?.createdAt || new Date(),
      updatedAt: new Date(),
      isFragmented: fragments.length > 0,
      fragments: fragments.length > 0 ? fragments : undefined,
      totalQuantity:
        fragments.length > 0
          ? fragments.reduce((sum, f) => sum + f.quantity, 0)
          : formData.products?.reduce((sum, p) => sum + p.quantity, 0),
    };

    onSave(finalOrderData);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setFormData((prev) => ({
      ...prev,
      customerId,
      customerName: customer?.name || "",
      customerTradeName: customer?.tradeName || "",
      paymentCondition: customer?.paymentCondition || "",
      representative: customer?.representative || "",
    }));
  };

  const handleFragmentProduction = () => {
    const totalQuantity = formData.products.reduce(
      (sum, product) => sum + product.quantity,
      0,
    );
    const totalValue = calculateTotalAmount();

    if (totalQuantity >= 10) {
      // Only allow fragmentation for orders with 10+ items
      setFragmentData({ quantity: totalQuantity, value: totalValue });
      setShowFragmentForm(true);
    }
  };

  const handleSaveFragments = (orderFragments: OrderFragment[]) => {
    setFragments(orderFragments);
    setShowFragmentForm(false);
    setFragmentData(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{order ? "Editar Pedido" : "Novo Pedido"}</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Cliente</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={handleCustomerSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.type === "individual"
                              ? customer.cpf
                              : customer.cnpj}
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
                      priority: value as Order["priority"],
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

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data de Produção</Label>
                <Popover
                  open={showCalendar === "scheduled"}
                  onOpenChange={(open) =>
                    setShowCalendar(open ? "scheduled" : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.scheduledDate, "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledDate}
                      onSelect={(date) => {
                        if (date) {
                          setFormData((prev) => ({
                            ...prev,
                            scheduledDate: date,
                          }));
                          setShowCalendar(null);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Data de Entrega</Label>
                <Popover
                  open={showCalendar === "delivery"}
                  onOpenChange={(open) =>
                    setShowCalendar(open ? "delivery" : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.deliveryDate, "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.deliveryDate}
                      onSelect={(date) => {
                        if (date) {
                          setFormData((prev) => ({
                            ...prev,
                            deliveryDate: date,
                          }));
                          setShowCalendar(null);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Add Product Section */}
            <Card className="bg-muted/5 border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Adicionar Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Produto</Label>
                    <Select
                      value={newProduct.productId}
                      onValueChange={(value) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          productId: value,
                          model: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.basePrice)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Select
                      value={newProduct.model}
                      onValueChange={(value) =>
                        setNewProduct((prev) => ({ ...prev, model: value }))
                      }
                      disabled={!selectedProduct}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct?.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}{" "}
                            {model.priceModifier !== 1.0 &&
                              `(+${Math.round((model.priceModifier - 1) * 100)}%)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newProduct.quantity}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>
                </div>

                {selectedModel && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tamanho</Label>
                      <Select
                        value={newProduct.size}
                        onValueChange={(value) =>
                          setNewProduct((prev) => ({ ...prev, size: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tamanho" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModel.sizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cor</Label>
                      <Select
                        value={newProduct.color}
                        onValueChange={(value) =>
                          setNewProduct((prev) => ({ ...prev, color: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Cor" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModel.colors.map((color) => (
                            <SelectItem key={color} value={color}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tecido</Label>
                      <Select
                        value={newProduct.fabric}
                        onValueChange={(value) =>
                          setNewProduct((prev) => ({ ...prev, fabric: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tecido" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModel.fabrics.map((fabric) => (
                            <SelectItem key={fabric} value={fabric}>
                              {fabric}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {calculateProductPrice() > 0 && (
                      <>Preço: {formatCurrency(calculateProductPrice())}</>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={
                      !newProduct.productId ||
                      !newProduct.model ||
                      !newProduct.size ||
                      !newProduct.color ||
                      !newProduct.fabric
                    }
                    className="bg-biobox-green hover:bg-biobox-green-dark"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            {formData.products.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Produtos do Pedido
                    </CardTitle>
                    {formData.products.reduce(
                      (sum, p) => sum + p.quantity,
                      0,
                    ) >= 10 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFragmentProduction}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Fragmentar Produção
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {formData.products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {product.productName} - {product.model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {product.size} • {product.color} • {product.fabric}{" "}
                            • Qtd: {product.quantity}
                          </div>
                          <div className="text-sm font-medium">
                            {formatCurrency(product.totalPrice)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <span className="font-medium">Total do Pedido:</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(calculateTotalAmount())}
                      </span>
                    </div>
                    {fragments.length > 0 && (
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Produção Fragmentada:
                          </span>
                          <Badge className="bg-biobox-green/10 text-biobox-green border-biobox-green/20">
                            {fragments.length} fragmentos
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {fragments.map((fragment, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                Fragmento {fragment.fragmentNumber}:{" "}
                                {fragment.quantity} unidades
                              </span>
                              <span className="font-medium">
                                {formatCurrency(fragment.value)} -{" "}
                                {format(fragment.scheduledDate, "dd/MM", {
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Observações especiais do pedido..."
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
                disabled={
                  !formData.customerId || formData.products.length === 0
                }
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Pedido
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Fragment Form Modal */}
      {showFragmentForm && fragmentData && (
        <OrderFragmentForm
          totalQuantity={fragmentData.quantity}
          totalValue={fragmentData.value}
          onSave={handleSaveFragments}
          onCancel={() => {
            setShowFragmentForm(false);
            setFragmentData(null);
          }}
        />
      )}
    </div>
  );
}
