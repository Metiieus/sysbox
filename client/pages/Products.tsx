import { useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import ProductForm, { ProductFormValues } from "@/components/ProductForm";
import ProductSearch from "@/components/ProductSearch";
import Pagination from "@/components/Pagination";
import { useProductsPaginated } from "@/hooks/useProductsPaginated";
import { useToast } from "@/components/ui/use-toast";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Product, categoryLabels, statusColors } from "@/types/inventory";
import { cn } from "@/lib/utils";

export default function ProductsOptimized() {
  const {
    products,
    loading,
    hasMore,
    currentPage,
    totalCount,
    totalPages,
    pageSize,
    searchTerm,
    searchProducts,
    nextPage,
    previousPage,
    goToFirstPage,
    createProduct,
    updateProduct,
    deleteProduct: deleteProductFn,
  } = useProductsPaginated();

  const { toast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSaveProduct = async (formData: ProductFormValues) => {
    try {
      setSavingProduct(true);

      if (selectedProduct?.id) {
        // Editar produto existente
        const modelId =
          selectedProduct.models[0]?.id ||
          (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
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

        await updateProduct(selectedProduct.id, productData);
        setShowProductForm(false);

        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso.",
        });
      } else {
        // Criar novo produto
        const modelId =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
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

        await createProduct(productData);
        setShowProductForm(false);

        toast({
          title: "Produto criado",
          description: "O produto foi criado com sucesso.",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao salvar produto:", error);
      toast({
        title: "Erro ao salvar produto",
        description: (error as Error).message || "Não foi possível salvar o produto.",
        variant: "destructive",
      });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o produto "${product.name}"?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingProductId(productId);
      await deleteProductFn(productId);

      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso.",
      });
    } catch (error) {
      console.error("❌ Erro ao excluir produto:", error);
      toast({
        title: "Erro ao excluir produto",
        description: (error as Error).message || "Não foi possível excluir o produto.",
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

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleSearch = useCallback((term: string) => {
    searchProducts(term);
  }, [searchProducts]);

  const handleClearSearch = useCallback(() => {
    goToFirstPage();
  }, [goToFirstPage]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: totalCount,
      active: products.filter((p) => p.status === "active").length,
      lowStock: products.filter((p) =>
        p.models.some((m) => m.stockQuantity <= m.minimumStock)
      ).length,
    };
  }, [products, totalCount]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie seu catálogo de produtos
            </p>
          </div>
          <Button onClick={handleNewProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Página Atual</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentPage}</div>
              <p className="text-xs text-muted-foreground">
                de {totalPages} páginas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStock}</div>
              <p className="text-xs text-muted-foreground">
                nesta página
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <ProductSearch
              onSearch={handleSearch}
              onClear={handleClearSearch}
              loading={loading}
            />
            {searchTerm && (
              <p className="mt-2 text-sm text-muted-foreground">
                Buscando por: <span className="font-medium">{searchTerm}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && products.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm
                    ? "Tente buscar com outros termos"
                    : "Comece criando seu primeiro produto"}
                </p>
                {!searchTerm && (
                  <Button onClick={handleNewProduct}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Produto
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative">
                {loading && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Estoque</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const totalStock = product.models.reduce(
                        (sum, m) => sum + m.stockQuantity,
                        0
                      );
                      const minStock = product.models[0]?.minimumStock || 0;
                      const isLowStock = totalStock <= minStock;

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">
                            {product.sku}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium truncate">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {categoryLabels[product.category as keyof typeof categoryLabels] ||
                                product.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(product.basePrice)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "border",
                                statusColors[product.status as keyof typeof statusColors]
                              )}
                            >
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                "font-medium",
                                isLowStock && "text-orange-500"
                              )}
                            >
                              {totalStock}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleEditProduct(e, product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDeleteProduct(e, product.id)}
                                disabled={deletingProductId === product.id}
                              >
                                {deletingProductId === product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {products.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onNextPage={nextPage}
              onPreviousPage={previousPage}
              onFirstPage={goToFirstPage}
              hasMore={hasMore}
              loading={loading}
            />
          )}
        </Card>

        {/* Product Form Dialog */}
        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <ProductForm
              product={selectedProduct}
              onSave={handleSaveProduct}
              onCancel={() => setShowProductForm(false)}
              saving={savingProduct}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
