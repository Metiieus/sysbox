import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Minus,
  Search,
  Package,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFirebase } from "@/hooks/useFirebase";
import { useToast } from "@/components/ui/use-toast";
import ProductSearchCombobox from "@/components/ProductSearchCombobox";

interface OrderProduct {
  id: string;
  productId: string;
  productName: string;
  model: string;
  size: string;
  color: string;
  fabric: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface NewOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: (order: any) => void;
}

export default function NewOrderForm({
  open,
  onOpenChange,
  onOrderCreated,
}: NewOrderFormProps) {
  const { user, checkPermission } = useAuth();
  const { getCustomers, getProducts } = useFirebase();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Função segura para selecionar cliente
  const handleSelectCustomer = (customer: any) => {
    console.log("🔄 Selecionando cliente:", customer);

    // Verificar se já está selecionado
    if (selectedCustomer?.id === customer.id) {
      console.log("⚠️ Cliente já selecionado, mantendo seleção");
      return;
    }

    // Limpar formulário de novo cliente
    if (showNewCustomerForm) {
      setShowNewCustomerForm(false);
    }

    setSelectedCustomer(customer);

    // Aplicar desconto padrão do cliente
    if (customer.default_discount && customer.default_discount > 0) {
      setOrderDetails((prev) => ({
        ...prev,
        discount_percentage: customer.default_discount,
      }));
    }

    console.log("✅ Cliente selecionado com sucesso");
  };
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    tradeName: "",
    phone: "",
    email: "",
    paymentCondition: "",
    representative: "",
    type: "individual" as "individual" | "business",
  });
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [orderDetails, setOrderDetails] = useState({
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    scheduledDate: "",
    deliveryDate: "",
    notes: "",
    discount_percentage: 0,
    discount_volume: 0,
    shipping_value: 0,
    shipping_discount: 0,
  });
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Carregar dados ao abrir o modal
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Carregando dados para novo pedido...");

      // Carregar clientes
      const customersData = await getCustomers();
      console.log("👥 Clientes carregados:", customersData?.length || 0);
      setCustomers(customersData || []);

      // Não carregar todos os produtos - usar busca sob demanda
      // const productsData = await getProducts();
      // console.log("📦 Produtos carregados:", productsData?.length || 0);
      // setProducts(productsData || []);
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar clientes e produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers
    .filter((customer) => {
      const searchLower = customerSearch.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(customerSearch) ||
        customer.email?.toLowerCase().includes(searchLower)
      );
    })
    // Remover duplicatas baseado no ID
    .filter(
      (customer, index, self) =>
        index === self.findIndex((c) => c.id === customer.id),
    );

  const addProduct = () => {
    const newProduct: OrderProduct = {
      id: `temp-${Date.now()}`,
      productId: "",
      productName: "",
      model: "",
      size: "",
      color: "",
      fabric: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setOrderProducts([...orderProducts, newProduct]);
  };

  const removeProduct = (index: number) => {
    setOrderProducts(orderProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (
    index: number,
    field: string,
    value: any,
    productData?: any,
  ) => {
    const updated = [...orderProducts];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill product details when product is selected
    if (field === "productId") {
      console.log("🔄 updateProduct chamado para productId:", value);
      console.log("📋 Lista de produtos disponível:", products.length);

      // Usar productData passado diretamente ou buscar na lista
      const product = productData || products.find((p) => p.id === value);
      console.log("🎯 Produto encontrado:", product ? "SIM" : "NÃO");
      if (product) {
        console.log("📦 Estrutura do produto:", product);
        console.log("📋 Tem models?", product.models ? "SIM" : "NÃO");
        console.log("📋 Quantidade de models:", product.models?.length);

        // Obter o primeiro modelo disponível
        const firstModel =
          product.models && product.models.length > 0
            ? product.models[0]
            : null;

        console.log("🎯 Primeiro modelo:", firstModel);

        // Obter primeira opção de tamanho, cor e tecido do modelo
        const firstSize = firstModel?.sizes?.[0]?.name || "";
        const firstColor = firstModel?.colors?.[0]?.name || "";
        const firstFabric = firstModel?.fabrics?.[0]?.name || "";

        console.log("📊 Valores extraídos:");
        console.log("  - Tamanho:", firstSize);
        console.log("  - Cor:", firstColor);
        console.log("  - Tecido:", firstFabric);
        console.log("  - Preço:", product.base_price || product.basePrice || 0);

        updated[index] = {
          ...updated[index],
          productName: product.name,
          model: firstModel?.name || product.sku || "Standard",
          size: firstSize,
          color: firstColor,
          fabric: firstFabric,
          unitPrice: product.base_price || product.basePrice || 0,
          totalPrice:
            (product.base_price || product.basePrice || 0) *
            updated[index].quantity,
        };

        console.log("✅ Produto atualizado:", updated[index]);
      }
    }

    // Recalculate total when quantity or unit price changes
    if (field === "quantity" || field === "unitPrice") {
      updated[index].totalPrice =
        updated[index].quantity * updated[index].unitPrice;
    }

    setOrderProducts(updated);
  };

  const calculateSubtotal = () => {
    return orderProducts.reduce((sum, product) => sum + product.totalPrice, 0);
  };

  const calculateFinancialDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    const discount = (subtotal * (orderDetails.discount_percentage || 0)) / 100;
    // Arredondar para 2 casas decimais para evitar erros de ponto flutuante
    return Math.round(discount * 100) / 100;
  };

  const calculateVolumeDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    const discount = (subtotal * (orderDetails.discount_volume || 0)) / 100;
    return Math.round(discount * 100) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const financialDiscount = calculateFinancialDiscountAmount();
    const volumeDiscount = calculateVolumeDiscountAmount();
    const shippingNet = Math.max(
      0,
      (orderDetails.shipping_value || 0) - (orderDetails.shipping_discount || 0),
    );

    const total = subtotal - financialDiscount - volumeDiscount + shippingNet;
    // Arredondar para 2 casas decimais
    return Math.round(total * 100) / 100;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `ORD-${year}-${random}`;
  };

  const handleCreateOrder = async () => {
    if (!user) {
      console.error("Erro: Usuário não autenticado ao tentar criar pedido.");
      toast({
        title: "Erro de autenticação",
        description: "Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }
    try {
      // Validações
      if (!selectedCustomer && !newCustomer.name) {
        toast({
          title: "Cliente obrigatório",
          description: "Selecione um cliente ou cadastre um novo",
          variant: "destructive",
        });
        return;
      }

      if (orderProducts.length === 0) {
        toast({
          title: "Produtos obrigatórios",
          description: "Adicione pelo menos um produto ao pedido",
          variant: "destructive",
        });
        return;
      }

      // Data de produção é opcional - será definida na Agenda pelo admin
      // if (!orderDetails.scheduledDate) {
      //   toast({
      //     title: "Campos obrigatórios",
      //     description: "Por favor, preencha a data de produção",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      // Verificar se todos os produtos estão completos
      const hasIncompleteProducts = orderProducts.some(
        (p) =>
          !p.productId ||
          !p.size ||
          !p.color ||
          !p.fabric ||
          p.quantity <= 0 ||
          p.unitPrice <= 0,
      );

      if (hasIncompleteProducts) {
        toast({
          title: "Produtos incompletos",
          description: "Preencha todos os campos dos produtos",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);

      const customer = selectedCustomer || {
        id: `temp-${Date.now()}`,
        ...newCustomer,
      };

      const newOrder = {
        order_number: generateOrderNumber(),
        customer_id: customer.id,
        customer_name: customer.name,
        customer_trade_name: customer.tradeName || customer.trade_name || "",
        payment_condition:
          customer.paymentCondition || customer.payment_condition || "",
        representative: customer.representative || "",
        customer_phone: customer.phone,
        customer_email: customer.email || "",
        seller_id: user?.id || "",
        seller_name: user?.name || "",
        status: (user && user.role === "admin"
          ? "pending"
          : "awaiting_approval") as const,
        priority: orderDetails.priority,
        subtotal: calculateSubtotal(),
        discount_percentage: orderDetails.discount_percentage || 0,
        discount_amount: calculateFinancialDiscountAmount(),
        financial_discount: orderDetails.discount_percentage || 0,
        volume_discount: orderDetails.discount_volume || 0,
        shipping_value: orderDetails.shipping_value || 0,
        shipping_discount: orderDetails.shipping_discount || 0,
        total_amount: calculateTotal(),
        scheduled_date: orderDetails.scheduledDate,
        delivery_date: orderDetails.deliveryDate || null,
        production_progress: 0,
        notes: orderDetails.notes || "",
        products: orderProducts.map((p) => ({
          product_id: p.productId,
          product_name: p.productName,
          model: p.model,
          size: p.size,
          color: p.color,
          fabric: p.fabric,
          quantity: p.quantity,
          unit_price: p.unitPrice,
          total_price: p.totalPrice,
        })),
      };

      console.log("💾 Criando pedido:", newOrder);

      // Passar para o componente pai que irá salvar no Firebase
      await onOrderCreated(newOrder);

      toast({
        title: "Pedido criado!",
        description: `Pedido ${newOrder.order_number} criado com sucesso`,
      });

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("❌ Erro ao criar pedido:", error);
      toast({
        title: "Erro ao criar pedido",
        description: (error as Error).message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedCustomer(null);
    setNewCustomer({ name: "", phone: "", email: "", type: "individual" });
    setOrderProducts([]);
    setOrderDetails({
      priority: "medium",
      scheduledDate: "",
      deliveryDate: "",
      notes: "",
      discount_percentage: 0,
      discount_volume: 0,
      shipping_value: 0,
      shipping_discount: 0,
    });
    setShowNewCustomerForm(false);
    setCustomerSearch("");
  };

  const canProceedToNextStep = () => {
    switch (step) {
      case 1:
        return selectedCustomer || (newCustomer.name && newCustomer.phone);
      case 2:
        return (
          orderProducts.length > 0 &&
          orderProducts.every(
            (p) =>
              p.productId &&
              p.size &&
              p.color &&
              p.fabric &&
              p.quantity > 0 &&
              p.unitPrice > 0,
          )
        );
      case 3:
        return true; // Data Programada não é mais obrigatória para habilitar o botão
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-biobox-green" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Selecionar Cliente</h3>
              <Button
                variant="outline"
                onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>

            {showNewCustomerForm ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Cadastrar Novo Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nome/Razão Social *</Label>
                      <Input
                        id="customerName"
                        value={newCustomer.name}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            name: e.target.value,
                          })
                        }
                        placeholder="Nome ou Razão Social"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerTradeName">Nome Fantasia</Label>
                      <Input
                        id="customerTradeName"
                        value={newCustomer.tradeName}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            tradeName: e.target.value,
                          })
                        }
                        placeholder="Nome Fantasia"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerPhone">Telefone *</Label>
                      <Input
                        id="customerPhone"
                        value={newCustomer.phone}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            phone: e.target.value,
                          })
                        }
                        placeholder="(99) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            email: e.target.value,
                          })
                        }
                        placeholder="cliente@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentCondition">
                        Condição de Pagamento
                      </Label>
                      <Input
                        id="paymentCondition"
                        value={newCustomer.paymentCondition}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            paymentCondition: e.target.value,
                          })
                        }
                        placeholder="Ex: 30/60/90 dias"
                      />
                    </div>
                    <div>
                      <Label htmlFor="representative">Representante</Label>
                      <Input
                        id="representative"
                        value={newCustomer.representative}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            representative: e.target.value,
                          })
                        }
                        placeholder="Nome do Representante"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1">
                    <div>
                      <Label htmlFor="customerType">Tipo de Cliente</Label>
                      <Select
                        value={newCustomer.type}
                        onValueChange={(value) =>
                          setNewCustomer({
                            ...newCustomer,
                            type: value as "individual" | "business",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">
                            Pessoa Física
                          </SelectItem>
                          <SelectItem value="business">
                            Pessoa Jurídica
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente por nome, telefone ou email..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {customers.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      Nenhum cliente cadastrado
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Novo Cliente" para cadastrar
                    </p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredCustomers.map((customer) => (
                      <Card
                        key={customer.id}
                        className={`cursor-pointer transition-colors ${
                          selectedCustomer?.id === customer.id
                            ? "border-biobox-green bg-biobox-green/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {customer.phone} •{" "}
                                {customer.email || "Sem email"}
                              </div>
                            </div>
                            <Badge
                              variant={
                                customer.type === "business"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {customer.type === "business" ? "PJ" : "PF"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Produtos do Pedido</h3>
              <Button onClick={addProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>

            {orderProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto adicionado</p>
                <p className="text-sm">
                  Clique em "Adicionar Produto" para começar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto *</TableHead>
                        <TableHead>Tamanho *</TableHead>
                        <TableHead>Cor *</TableHead>
                        <TableHead>Tecido *</TableHead>
                        <TableHead>Qtd *</TableHead>
                        <TableHead>Valor Unit. *</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderProducts.map((product, index) => {
                        const selectedProduct = products.find(
                          (p) => p.id === product.productId,
                        );

                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <ProductSearchCombobox
                                value={product.productId}
                                onSelect={(productId, productData) => {
                                  console.log(
                                    "🔍 Produto selecionado:",
                                    productId,
                                  );
                                  console.log(
                                    "📦 Dados do produto:",
                                    productData,
                                  );

                                  // Atualizar o produto na lista local para uso posterior
                                  setProducts((prev) => {
                                    const exists = prev.find(
                                      (p) => p.id === productId,
                                    );
                                    if (!exists) {
                                      console.log(
                                        "➕ Adicionando produto à lista local",
                                      );
                                      return [
                                        ...prev,
                                        { ...productData, id: productId },
                                      ];
                                    }
                                    console.log("✓ Produto já existe na lista");
                                    return prev;
                                  });

                                  // Passar productData diretamente para updateProduct
                                  updateProduct(
                                    index,
                                    "productId",
                                    productId,
                                    productData,
                                  );
                                }}
                                placeholder="Buscar produto..."
                                className="w-full min-w-[250px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={product.size}
                                onValueChange={(value) =>
                                  updateProduct(index, "size", value)
                                }
                                disabled={
                                  !product.productId ||
                                  !selectedProduct?.models?.[0]?.sizes
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Tamanho" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedProduct?.models?.[0]?.sizes?.map(
                                    (size: any) => (
                                      <SelectItem
                                        key={size.id}
                                        value={size.name}
                                      >
                                        {size.name}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={product.color}
                                onValueChange={(value) =>
                                  updateProduct(index, "color", value)
                                }
                                disabled={
                                  !product.productId ||
                                  !selectedProduct?.models?.[0]?.colors
                                }
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue placeholder="Cor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedProduct?.models?.[0]?.colors?.map(
                                    (color: any) => (
                                      <SelectItem
                                        key={color.id}
                                        value={color.name}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-4 h-4 rounded border"
                                            style={{
                                              backgroundColor: color.hexCode,
                                            }}
                                          />
                                          {color.name}
                                        </div>
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={product.fabric}
                                onValueChange={(value) =>
                                  updateProduct(index, "fabric", value)
                                }
                                disabled={
                                  !product.productId ||
                                  !selectedProduct?.models?.[0]?.fabrics
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Tecido" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedProduct?.models?.[0]?.fabrics?.map(
                                    (fabric: any) => (
                                      <SelectItem
                                        key={fabric.id}
                                        value={fabric.name}
                                      >
                                        {fabric.name}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) =>
                                  updateProduct(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="w-16 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={product.unitPrice}
                                onChange={(e) =>
                                  updateProduct(
                                    index,
                                    "unitPrice",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-24 text-right"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(product.totalPrice)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeProduct(index)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <Card className="w-64">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total do Pedido:</span>
                        <span className="text-lg font-bold text-biobox-green">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detalhes do Pedido</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={orderDetails.priority}
                  onValueChange={(value) =>
                    setOrderDetails({
                      ...orderDetails,
                      priority: value as "low" | "medium" | "high" | "urgent",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
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


            {/* Campos de Desconto e Frete */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount_percentage">
                  Desconto Financeiro (%)
                  {selectedCustomer?.default_discount > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Padrão do cliente: {selectedCustomer.default_discount}%)
                    </span>
                  )}
                </Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={orderDetails.discount_percentage}
                  onChange={(e) =>
                    setOrderDetails({
                      ...orderDetails,
                      discount_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="discount_volume">Desconto por Volume (%)</Label>
                <Input
                  id="discount_volume"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={orderDetails.discount_volume}
                  onChange={(e) =>
                    setOrderDetails({
                      ...orderDetails,
                      discount_volume: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="shipping_value">Valor do Frete (R$)</Label>
                <Input
                  id="shipping_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderDetails.shipping_value}
                  onChange={(e) =>
                    setOrderDetails({
                      ...orderDetails,
                      shipping_value: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="shipping_discount">Desconto no Frete (R$)</Label>
                <Input
                  id="shipping_discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderDetails.shipping_discount}
                  onChange={(e) =>
                    setOrderDetails({
                      ...orderDetails,
                      shipping_discount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="text-right"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={orderDetails.notes}
                onChange={(e) =>
                  setOrderDetails({ ...orderDetails, notes: e.target.value })
                }
                placeholder="Observações sobre o pedido..."
                rows={3}
              />
            </div>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <div className="text-right">
                    <span className="font-medium block">
                      {selectedCustomer?.name || newCustomer.name}
                    </span>
                    {(selectedCustomer?.tradeName || newCustomer.tradeName) && (
                      <span className="text-xs text-muted-foreground block">
                        Fantasia:{" "}
                        {selectedCustomer?.tradeName || newCustomer.tradeName}
                      </span>
                    )}
                  </div>
                </div>
                {(selectedCustomer?.paymentCondition ||
                  newCustomer.paymentCondition) && (
                  <div className="flex justify-between text-sm">
                    <span>Cond. Pagamento:</span>
                    <span className="font-medium">
                      {selectedCustomer?.paymentCondition ||
                        newCustomer.paymentCondition}
                    </span>
                  </div>
                )}
                {(selectedCustomer?.representative ||
                  newCustomer.representative) && (
                  <div className="flex justify-between text-sm">
                    <span>Representante:</span>
                    <span className="font-medium">
                      {selectedCustomer?.representative ||
                        newCustomer.representative}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Vendedor:</span>
                  <span className="font-medium text-biobox-green">
                    {user?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Produtos:</span>
                  <span>{orderProducts.length} item(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantidade Total:</span>
                  <span>
                    {orderProducts.reduce((sum, p) => sum + p.quantity, 0)}{" "}
                    unidades
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Desconto Financeiro ({orderDetails.discount_percentage}%):</span>
                    <span>- {formatCurrency(calculateFinancialDiscountAmount())}</span>
                  </div>
                  {orderDetails.discount_volume > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Desconto por Volume ({orderDetails.discount_volume}%):</span>
                      <span>- {formatCurrency(calculateVolumeDiscountAmount())}</span>
                    </div>
                  )}
                  {orderDetails.shipping_value > 0 && (
                    <div className="flex justify-between">
                      <span>Valor do Frete:</span>
                      <span>{formatCurrency(orderDetails.shipping_value)}</span>
                    </div>
                  )}
                  {orderDetails.shipping_discount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Desconto no Frete:</span>
                      <span>- {formatCurrency(Math.min(orderDetails.shipping_discount, orderDetails.shipping_value))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-biobox-green">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Novo Pedido</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? "bg-biobox-green text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stepNumber}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= stepNumber
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {stepNumber === 1 && "Cliente"}
                  {stepNumber === 2 && "Produtos"}
                  {stepNumber === 3 && "Detalhes"}
                </span>
                {stepNumber < 3 && (
                  <div
                    className={`w-8 h-0.5 mx-4 ${
                      step > stepNumber ? "bg-biobox-green" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || saving}
            >
              Anterior
            </Button>

            <div className="space-x-2">
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceedToNextStep() || loading}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  onClick={handleCreateOrder}
                  disabled={!canProceedToNextStep() || saving}
                  className="bg-biobox-green hover:bg-biobox-green-dark"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Pedido"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
