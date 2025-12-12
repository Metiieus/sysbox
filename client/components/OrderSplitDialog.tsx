import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order, OrderProduct } from "@/hooks/useFirebase";
import { AlertCircle, Minus, Plus, Check } from "lucide-react";

interface OrderSplitDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSplit: (fragments: any[]) => Promise<void>;
}

export default function OrderSplitDialog({
  order,
  open,
  onOpenChange,
  onSplit,
}: OrderSplitDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const getAvailableQuantity = (product: OrderProduct): number => {
    const totalQuantity = product.quantity;
    const actualProductId = product.product_id || product.id;
    const alreadyFragmented =
      order.fragments?.reduce((sum, f) => {
        return (
          sum +
          (f.product_id === actualProductId || f.product_id === product.id
            ? f.quantity
            : 0)
        );
      }, 0) || 0;

    return totalQuantity - alreadyFragmented;
  };

  const handleQuantityChange = (
    index: number,
    product: OrderProduct,
    value: string,
  ) => {
    const availableQty = getAvailableQuantity(product);
    const num = Math.min(availableQty, Math.max(0, parseInt(value) || 0));
    setQuantities((prev) => ({
      ...prev,
      [index]: num,
    }));
  };

  const incrementQuantity = (index: number, product: OrderProduct) => {
    const availableQty = getAvailableQuantity(product);
    const current = quantities[index] || 0;
    if (current < availableQty) {
      setQuantities((prev) => ({
        ...prev,
        [index]: current + 1,
      }));
    }
  };

  const decrementQuantity = (index: number) => {
    const current = quantities[index] || 0;
    if (current > 0) {
      setQuantities((prev) => ({
        ...prev,
        [index]: current - 1,
      }));
    }
  };

  const toggleProductSelection = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedProducts((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSplit = async () => {
    try {
      setLoading(true);

      const selectedProductIndices = Object.entries(selectedProducts)
        .filter(([_, selected]) => selected)
        .map(([index, _]) => parseInt(index));

      if (selectedProductIndices.length === 0) {
        alert("Por favor, selecione pelo menos um produto para fragmentar");
        return;
      }

      const hasQuantity = selectedProductIndices.some(
        (index) => (quantities[index] || 0) > 0,
      );
      if (!hasQuantity) {
        alert(
          "Por favor, especifique a quantidade para os produtos selecionados",
        );
        return;
      }

      const hasExcess = selectedProductIndices.some((index) => {
        const qty = quantities[index] || 0;
        const product = order.products?.[index];
        if (!product) return false;
        const availableQty = getAvailableQuantity(product);
        return qty > availableQty;
      });

      if (hasExcess) {
        alert(
          "A quantidade especificada não pode ser maior que a quantidade disponível para fragmentar",
        );
        return;
      }

      const fragments =
        order.products
          ?.map((product, index) => ({
            product,
            index,
            qty: quantities[index] || 0,
            isSelected: selectedProducts[index],
          }))
          .filter(({ isSelected, qty }) => isSelected && qty > 0)
          .map(({ product, index }, fragmentIndex) => ({
            id: `${order.id}-frag-${Date.now()}-${fragmentIndex}`,
            order_id: order.id,
            product_id: product.product_id || product.id,
            product_name: product.product_name,
            size: product.size,
            color: product.color,
            fragment_number: (order.fragments?.length || 0) + fragmentIndex + 1,
            quantity: quantities[index] || 0,
            scheduled_date: new Date().toISOString(),
            status: "pending" as const,
            progress: 0,
            value:
              (product.total_price / product.quantity) *
              (quantities[index] || 0),
            assigned_operator: undefined,
            started_at: undefined,
            completed_at: undefined,
          })) || [];

      await onSplit(fragments);

      setQuantities({});
      setSelectedProducts({});
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao fragmentar pedido:", error);
      alert("Erro ao fragmentar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl">Fragmentar Pedido</DialogTitle>
          <div className="mt-2 space-y-1 text-sm">
            <div>
              <strong>Pedido:</strong> {order.order_number}
            </div>
            <div>
              <strong>Cliente:</strong> {order.customer_name}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Especifique quantos itens de cada produto deseja enviar para
              produção. Os itens restantes ficarão como saldo.
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-6">
          {order.products && order.products.length > 0 ? (
            order.products.map((product, index) => {
              const maxQty = product.quantity;
              const currentQty = quantities[index] || 0;
              const remaining = maxQty - currentQty;
              const unitPrice = product.unit_price;
              const selectedValue = unitPrice * currentQty;
              const isSelected = selectedProducts[index] || false;

              return (
                <Card
                  key={`${index}`}
                  className={`border transition-all ${
                    isSelected
                      ? "border-biobox-green bg-biobox-green/5"
                      : "border-muted opacity-75"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <button
                        onClick={(e) => toggleProductSelection(index, e)}
                        className="flex items-start gap-3 flex-1 text-left hover:opacity-100 transition-opacity"
                      >
                        <div
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-biobox-green border-biobox-green"
                              : "border-muted-foreground hover:border-foreground"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {product.product_name}
                          </CardTitle>
                          {product.model && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Modelo: {product.model}
                            </p>
                          )}
                        </div>
                      </button>
                      <div className="text-right">
                        <div className="text-sm font-medium text-muted-foreground">
                          Valor Unitário
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(unitPrice)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent
                    className="space-y-4"
                    style={{
                      opacity: isSelected ? 1 : 0.6,
                      pointerEvents: isSelected ? "auto" : "none",
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tamanho</p>
                        <p className="font-medium">{product.size || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cor</p>
                        <p className="font-medium">{product.color || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tecido</p>
                        <p className="font-medium">{product.fabric || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Quantidade Total
                        </p>
                        <p className="font-medium text-lg">{maxQty}</p>
                      </div>
                    </div>

                    {!isSelected && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-600 dark:text-gray-400">
                        ℹ️ Clique no nome do produto acima para selecioná-lo e
                        fragmentá-lo
                      </div>
                    )}

                    {isSelected &&
                      (() => {
                        const availableQty = getAvailableQuantity(product);
                        const actualProductId =
                          product.product_id || product.id;
                        const alreadyFragmented =
                          order.fragments?.reduce((sum, f) => {
                            return (
                              sum +
                              (f.product_id === actualProductId ||
                              f.product_id === product.id
                                ? f.quantity
                                : 0)
                            );
                          }, 0) || 0;

                        return (
                          <div className="border-t pt-4">
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded border border-green-200 dark:border-green-500/30">
                                <p className="text-xs text-muted-foreground">
                                  Já Fragmentado
                                </p>
                                <p className="font-bold text-green-700 dark:text-green-400">
                                  {alreadyFragmented} un.
                                </p>
                              </div>
                              <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded border border-orange-200 dark:border-orange-500/30">
                                <p className="text-xs text-muted-foreground">
                                  Disponível
                                </p>
                                <p className="font-bold text-orange-700 dark:text-orange-400">
                                  {availableQty} un.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold mb-3 block">
                        Quantidade para Produção
                      </Label>

                      {(() => {
                        const availableQty = getAvailableQuantity(product);
                        const remainingAfterSplit = availableQty - currentQty;
                        const isAllFragmented = availableQty <= 0;

                        return (
                          <>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center border rounded-lg bg-muted/30">
                                <button
                                  onClick={() => decrementQuantity(index)}
                                  disabled={
                                    loading || currentQty === 0 || !isSelected
                                  }
                                  className="p-2 hover:bg-muted disabled:opacity-50"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <Input
                                  type="number"
                                  min="0"
                                  max={Math.max(0, availableQty)}
                                  value={currentQty}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      index,
                                      product,
                                      e.target.value,
                                    )
                                  }
                                  className="border-0 text-center w-16 bg-transparent text-lg font-semibold disabled:opacity-50"
                                  disabled={
                                    loading || isAllFragmented || !isSelected
                                  }
                                />
                                <button
                                  onClick={() =>
                                    incrementQuantity(index, product)
                                  }
                                  disabled={
                                    loading ||
                                    currentQty >= availableQty ||
                                    availableQty <= 0 ||
                                    !isSelected
                                  }
                                  className="p-2 hover:bg-muted disabled:opacity-50"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">
                                    Faltará Fragmentar:
                                  </span>
                                  <span
                                    className={`text-lg font-semibold ${
                                      remainingAfterSplit > 0
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {remainingAfterSplit}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">
                                    Valor Selecionado:
                                  </span>
                                  <span className="text-lg font-semibold">
                                    {formatCurrency(selectedValue)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isAllFragmented && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-600 dark:text-gray-400">
                                ✓ Produto totalmente fragmentado
                              </div>
                            )}
                            {!isAllFragmented && currentQty > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded text-sm text-blue-700 dark:text-blue-400">
                                ✓ {currentQty} unidade(s) será(ão) enviada(s)
                                para produção
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-orange-800">
                Este pedido não possui produtos cadastrados
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSplit} disabled={loading}>
            {loading ? "Fragmentando..." : "Fragmentar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
