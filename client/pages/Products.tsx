import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductForm, { ProductFormValues } from "@/components/ProductForm";
import BarcodeGenerator from "@/components/BarcodeGenerator";
import ThermalPrintManager from "@/components/ThermalPrintManager";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/components/ui/use-toast";
import {
  Package,
  Plus,
  QrCode,
  Search,
  Edit,
  AlertTriangle,
  TrendingUp,
  Box,
  Barcode,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import {
  Product,
  RawMaterial,
  mockRawMaterials,
  categoryLabels,
  statusLabels,
  statusColors,
  materialCategoryLabels,
  unitLabels,
} from "@/types/inventory";
import { cn } from "@/lib/utils";

export default function Products() {
  const {
    products: productsFromDb,
    loading: loadingProductsFromDb,
    createProduct,
    updateProduct,
    deleteProduct: deleteProductFn,
    fetchProducts,
  } = useProducts();

  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] =
    useState<RawMaterial[]>(mockRawMaterials);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );

  // Sincronizar produtos do hook com o estado local
  useEffect(() => {
    setProducts(productsFromDb);
  }, [productsFromDb]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSaveProduct = async (formData: ProductFormValues) => {
    try {
      setSavingProduct(true);

      // Se tem selectedProduct.id, é uma edição; caso contrário, é criação
      if (selectedProduct?.id) {
        // EDITAR produto existente
        const modelId =
          selectedProduct.models[0]?.id ||
          (typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `model-${Date.now()}`);

        const productData: Partial<Product> = {
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          category: formData.category,
          description: formData.description || "",
          basePrice: formData.basePrice || 0,
          costPrice: formData.costPrice || 0,
          margin: formData.margin || 0,
          status: formData.status || "active",
          models: [
            {
              id: modelId,
              name: formData.modelName || "Standard",
              priceModifier: 1,
              stockQuantity: formData.stockQuantity || 0,
              minimumStock: formData.minimumStock || 0,
              isActive: true,
              sizes: formData.sizes || [],
              colors: formData.colors || [],
              fabrics: formData.fabrics || [],
            },
          ],
          specifications: [],
          images: [],
        };

        if (formData.barcode && formData.barcode.trim() !== "") {
          productData.barcode = formData.barcode.trim();
        }

        console.log("🔄 Atualizando produto:", selectedProduct.id, productData);

        const updated = await updateProduct(selectedProduct.id, productData);

        console.log("✅ Produto atualizado com sucesso:", updated);

        setSelectedProduct(updated);
        setShowProductForm(false);

        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso.",
        });
      } else {
        // CRIAR novo produto
        const modelId =
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `model-${Date.now()}`;

        const productData: Partial<Product> = {
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          category: formData.category,
          description: formData.description || "",
          basePrice: formData.basePrice || 0,
          costPrice: formData.costPrice || 0,
          margin: formData.margin || 0,
          status: formData.status || "active",
          models: [
            {
              id: modelId,
              name: formData.modelName || "Standard",
              priceModifier: 1,
              stockQuantity: formData.stockQuantity || 0,
              minimumStock: formData.minimumStock || 0,
              isActive: true,
              sizes: formData.sizes || [],
              colors: formData.colors || [],
              fabrics: formData.fabrics || [],
            },
          ],
          specifications: [],
          images: [],
        };

        if (formData.barcode && formData.barcode.trim() !== "") {
          productData.barcode = formData.barcode.trim();
        }

        console.log("🔄 Criando produto:", productData);

        const saved = await createProduct(productData);

        console.log("✅ Produto criado com sucesso:", saved);

        setSelectedProduct(saved);
        setShowProductForm(false);

        toast({
          title: "Produto criado",
          description: "O produto foi salvo com sucesso.",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao salvar produto:", error);
      toast({
        title: "Erro ao salvar produto",
        description:
          (error as Error).message || "Não foi possível salvar o produto.",
        variant: "destructive",
      });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (
    e: React.MouseEvent,
    productId: string,
  ) => {
    e.stopPropagation();

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o produto "${product.name}"?\n\nEsta ação não pode ser desfeita.`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingProductId(productId);

      console.log("🗑️ Excluindo produto:", productId);

      await deleteProductFn(productId);

      console.log("✅ Produto excluído com sucesso");

      setSelectedProduct((prev) => (prev?.id === productId ? null : prev));

      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso.",
      });
    } catch (error) {
      console.error("❌ Erro ao excluir produto:", error);
      toast({
        title: "Erro ao excluir produto",
        description:
          (error as Error).message || "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleEditProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Statistics
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "active").length;
  const lowStockProducts = products.filter((p) =>
    p.models.some((m) => m.stockQuantity <= m.minimumStock),
  ).length;
  const lowStockMaterials = rawMaterials.filter(
    (m) => m.quantity <= m.minimumStock,
  ).length;

  const ProductCard = ({ product }: { product: Product }) => {
    const totalStock = product.models.reduce(
      (sum, model) => sum + model.stockQuantity,
      0,
    );
    const lowStock = product.models.some(
      (model) => model.stockQuantity <= model.minimumStock,
    );
    const isDeleting = deletingProductId === product.id;

    return (
      <Card
        className="bg-card border-border hover:bg-muted/5 transition-colors cursor-pointer"
        onClick={() => !isDeleting && setSelectedProduct(product)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-muted-foreground">{product.sku}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={(e) => handleEditProduct(e, product)}
                  disabled={isDeleting}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                  onClick={(e) => handleDeleteProduct(e, product.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </Button>
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs", statusColors[product.status])}
              >
                {statusLabels[product.status]}
              </Badge>
              {lowStock && (
                <div className="flex items-center text-red-500 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Estoque baixo
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Estoque Total:</span>
              <span className="font-medium">{totalStock} unidades</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Preço Base:</span>
              <span className="font-medium">
                {formatCurrency(product.basePrice)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Margem:</span>
              <span className="font-medium">{product.margin}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Modelos:</span>
              <span className="font-medium">{product.models.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const MaterialCard = ({ material }: { material: RawMaterial }) => {
    const stockPercentage =
      (material.quantity / (material.minimumStock * 2)) * 100;
    const isLowStock = material.quantity <= material.minimumStock;

    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium">{material.name}</h4>
              <p className="text-sm text-muted-foreground">
                {materialCategoryLabels[material.category]}
              </p>
            </div>
            {isLowStock && (
              <Badge
                variant="outline"
                className="text-red-500 border-red-500/20 bg-red-500/10"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Baixo
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Quantidade:</span>
              <span className="font-medium">
                {material.quantity} {unitLabels[material.unit]}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Mínimo:</span>
              <span className="font-medium">
                {material.minimumStock} {unitLabels[material.unit]}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Fornecedor:</span>
              <span className="font-medium">{material.supplier}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Custo Unit.:</span>
              <span className="font-medium">
                {formatCurrency(material.unitCost)}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Nível de Estoque</span>
                <span>{Math.min(100, Math.round(stockPercentage))}%</span>
              </div>
              <Progress
                value={Math.min(100, stockPercentage)}
                className={cn("h-2", isLowStock && "bg-red-500/20")}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loadingProductsFromDb) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-biobox-green" />
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Produtos e Estoque
            </h1>
            <p className="text-muted-foreground">
              Gerencie produtos, estoque e códigos de barras
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowBarcode(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Gerar Etiquetas
            </Button>
            <Button variant="outline" onClick={() => setShowLabels(true)}>
              <Barcode className="h-4 w-4 mr-2" />
              Imprimir Códigos
            </Button>
            <Button
              className="bg-biobox-green hover:bg-biobox-green-dark"
              onClick={() => {
                setSelectedProduct(null);
                setShowProductForm(true);
              }}
              disabled={savingProduct}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-biobox-green" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Produtos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Produtos Ativos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {activeProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Estoque Baixo
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {lowStockProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Box className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Materiais Baixos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {lowStockMaterials}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="w-full overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="products">Catálogo de Produtos</TabsTrigger>
              <TabsTrigger value="barcode">Códigos de Barra</TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>

          <TabsContent value="products">
            {filteredProducts.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    Nenhum produto cadastrado
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comece cadastrando seu primeiro produto
                  </p>
                  <Button
                    className="bg-biobox-green hover:bg-biobox-green-dark"
                    onClick={() => {
                      setSelectedProduct(null);
                      setShowProductForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="barcode">
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-biobox-green hover:bg-biobox-green-dark"
                onClick={() => setShowBarcode(true)}
              >
                Gerar Códigos
              </Button>
              <Button variant="outline" onClick={() => setShowLabels(true)}>
                Imprimir Etiquetas
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Product Detail Modal */}
        {selectedProduct && !showProductForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-[min(100%,40rem)] md:max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Detalhes do Produto</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProduct(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nome
                    </p>
                    <p className="font-medium">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      SKU
                    </p>
                    <p className="font-medium">{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Categoria
                    </p>
                    <p className="font-medium">
                      {categoryLabels[selectedProduct.category]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <Badge className={statusColors[selectedProduct.status]}>
                      {statusLabels[selectedProduct.status]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Descrição
                  </p>
                  <p className="text-sm bg-muted/5 p-3 rounded-lg">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Preço Base
                    </p>
                    <p className="font-medium">
                      {formatCurrency(selectedProduct.basePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Custo
                    </p>
                    <p className="font-medium">
                      {formatCurrency(selectedProduct.costPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Margem
                    </p>
                    <p className="font-medium">{selectedProduct.margin}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Modelos Disponíveis
                  </p>
                  <div className="space-y-3">
                    {selectedProduct.models.map((model) => (
                      <Card key={model.id} className="bg-muted/5">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{model.name}</h4>
                            <Badge
                              variant={model.isActive ? "default" : "secondary"}
                            >
                              {model.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                            <div>
                              <p className="text-muted-foreground">Estoque</p>
                              <p className="font-medium">
                                {model.stockQuantity}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Mínimo</p>
                              <p className="font-medium">
                                {model.minimumStock}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Modificador
                              </p>
                              <p className="font-medium">
                                {model.priceModifier}x
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Tamanhos:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {model.sizes.length > 0 ? (
                                  model.sizes.map((size) => (
                                    <Badge
                                      key={size.id}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {size.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Nenhum tamanho configurado
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Cores:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {model.colors.length > 0 ? (
                                  model.colors.map((color) => (
                                    <Badge
                                      key={color.id}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {color.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Nenhuma cor configurada
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialogs */}
        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
          <DialogContent className="w-full max-w-[min(100%,40rem)] md:max-w-3xl max-h-[90vh] overflow-y-auto">
            <ProductForm
              product={selectedProduct}
              onSave={handleSaveProduct}
              onCancel={() => {
                setShowProductForm(false);
                setSelectedProduct(null);
              }}
              saving={savingProduct}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showBarcode} onOpenChange={setShowBarcode}>
          <DialogContent className="w-full max-w-[min(100%,40rem)] md:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="sr-only">
                Gerar Códigos de Barra
              </DialogTitle>
            </DialogHeader>
            <BarcodeGenerator />
          </DialogContent>
        </Dialog>

        <Dialog open={showLabels} onOpenChange={setShowLabels}>
          <DialogContent className="w-full max-w-[min(100%,40rem)] md:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="sr-only">Imprimir Etiquetas</DialogTitle>
            </DialogHeader>
            <ThermalPrintManager />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
