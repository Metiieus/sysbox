import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order, OrderProduct } from "@/hooks/useFirebase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronRight, Package, AlertCircle, Printer } from "lucide-react";

interface GenerateProductionProps {
  orders: Order[];
  onSelectOrder: (order: Order, selectedProducts?: OrderProduct[]) => void;
}

const statusLabels = {
  pending: "Pendente",
  awaiting_approval: "Aguardando Aprovação",
  confirmed: "Confirmado",
  in_production: "Em Produção",
  quality_check: "Controle de Qualidade",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors = {
  pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  awaiting_approval: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_production: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  quality_check: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export default function GenerateProduction({
  orders,
  onSelectOrder,
}: GenerateProductionProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const printRef = useRef<HTMLDivElement>(null);

  // Filtrar pedidos disponíveis para produção
  const availableOrders = orders.filter(
    (order) =>
      order.status === "pending" ||
      order.status === "awaiting_approval" ||
      order.status === "confirmed"
  );

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setSelectedProducts(new Set());
  };

  const toggleProductSelection = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (selectedOrder?.products) {
      if (checked) {
        const allIds = new Set(
          selectedOrder.products.map((_, idx) => String(idx))
        );
        setSelectedProducts(allIds);
      } else {
        setSelectedProducts(new Set());
      }
    }
  };

  const handleStartProduction = () => {
    if (!selectedOrder) return;

    if (selectedProducts.size === 0) {
      // Se nenhum item selecionado, enviar todos
      onSelectOrder(selectedOrder, selectedOrder.products);
    } else {
      // Enviar apenas itens selecionados
      const productsToSend = selectedOrder.products?.filter((_, idx) =>
        selectedProducts.has(String(idx))
      );
      onSelectOrder(selectedOrder, productsToSend);
    }
    setSelectedOrder(null);
    setSelectedProducts(new Set());
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Panorama de Produção - ${selectedOrder?.order_number}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #10B981;
              color: white;
              font-weight: bold;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .order-info {
              font-size: 13px;
              margin-bottom: 15px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              background-color: #f3f4f6;
            }
            @media print {
              body { padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (!selectedOrder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Pedidos Disponíveis para Produção
          </h2>
          <Badge variant="outline" className="text-sm">
            {availableOrders.length} pedidos
          </Badge>
        </div>

        {availableOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum pedido disponível para produção
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {availableOrders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="h-5 w-5 text-biobox-green" />
                        <h3 className="font-bold text-lg">
                          {order.order_number}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border",
                            statusColors[
                              order.status as keyof typeof statusColors
                            ]
                          )}
                        >
                          {
                            statusLabels[
                              order.status as keyof typeof statusLabels
                            ]
                          }
                        </Badge>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full ml-2",
                            priorityColors[
                              order.priority as keyof typeof priorityColors
                            ]
                          )}
                        />
                        <span className="text-xs text-muted-foreground ml-1">
                          {
                            priorityLabels[
                              order.priority as keyof typeof priorityLabels
                            ]
                          }
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Cliente</p>
                          <p className="font-medium">{order.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valor Total</p>
                          <p className="font-bold text-biobox-green">
                            R$ {order.total_amount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Data Agendada
                          </p>
                          <p className="font-medium">
                            {format(
                              new Date(order.scheduled_date),
                              "dd/MM/yyyy",
                              { locale: ptBR }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Itens</p>
                          <p className="font-medium">
                            {order.products?.length || 0}
                          </p>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          <p className="font-medium mb-1">Observações:</p>
                          <p>{order.notes}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSelectOrder(order)}
                      className="ml-4 bg-biobox-green hover:bg-biobox-green-dark"
                    >
                      <span>Iniciar Produção</span>
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Exibir detalhes do pedido selecionado
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Produção: {selectedOrder.order_number}
          </h2>
          <p className="text-muted-foreground">
            {selectedOrder.customer_name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setSelectedOrder(null);
            setSelectedProducts(new Set());
          }}
          className="border-biobox-green text-biobox-green hover:bg-biobox-green/5"
        >
          Voltar para Lista
        </Button>
      </div>

      {/* Informações do Pedido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <Badge
              variant="outline"
              className={cn(
                "border",
                statusColors[
                  selectedOrder.status as keyof typeof statusColors
                ]
              )}
            >
              {
                statusLabels[
                  selectedOrder.status as keyof typeof statusLabels
                ]
              }
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Prioridade</p>
            <Badge variant="outline">
              {
                priorityLabels[
                  selectedOrder.priority as keyof typeof priorityLabels
                ]
              }
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">
              Data Agendada
            </p>
            <p className="font-bold">
              {format(new Date(selectedOrder.scheduled_date), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="font-bold text-biobox-green">
              R$ {selectedOrder.total_amount.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Itens */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Itens para Produção</CardTitle>
            {selectedProducts.size > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedProducts.size} de {selectedOrder.products?.length || 0}{" "}
                selecionado(s)
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-biobox-green text-biobox-green hover:bg-biobox-green/5"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Panorama
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedOrder.products || selectedOrder.products.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mr-4" />
              <p className="text-muted-foreground">Nenhum item neste pedido</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Conteúdo para impressão */}
              <div ref={printRef} className="hidden">
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    pageBreakInside: "avoid",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      marginBottom: "10px",
                    }}
                  >
                    PANORAMA DE PRODUÇÃO
                  </h1>
                  <p style={{ fontSize: "13px", marginBottom: "5px" }}>
                    <strong>Pedido:</strong> {selectedOrder.order_number}
                  </p>
                  <p style={{ fontSize: "13px", marginBottom: "5px" }}>
                    <strong>Cliente:</strong> {selectedOrder.customer_name}
                  </p>
                  <p style={{ fontSize: "13px", marginBottom: "5px" }}>
                    <strong>Data Agendada:</strong>{" "}
                    {format(new Date(selectedOrder.scheduled_date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                    Gerado em:{" "}
                    {format(new Date(), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "20px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#10B981", color: "white" }}>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        Produto
                      </th>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        Modelo
                      </th>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        Cor
                      </th>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        Tamanho
                      </th>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        Tecido
                      </th>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "center",
                        }}
                      >
                        Quantidade
                      </th>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "right",
                        }}
                      >
                        Preço Unit.
                      </th>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "right",
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.products.map((product, index) => (
                      <tr key={product.id || index}>
                        <td
                          style={{ border: "1px solid #ddd", padding: "10px" }}
                        >
                          {product.product_name}
                        </td>
                        <td
                          style={{ border: "1px solid #ddd", padding: "10px" }}
                        >
                          {product.model || "-"}
                        </td>
                        <td
                          style={{ border: "1px solid #ddd", padding: "10px" }}
                        >
                          {product.color || "-"}
                        </td>
                        <td
                          style={{ border: "1px solid #ddd", padding: "10px" }}
                        >
                          {product.size || "-"}
                        </td>
                        <td
                          style={{ border: "1px solid #ddd", padding: "10px" }}
                        >
                          {product.fabric || "-"}
                        </td>
                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                            textAlign: "center",
                          }}
                        >
                          {product.quantity}
                        </td>
                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                            textAlign: "right",
                          }}
                        >
                          R$ {product.unit_price.toFixed(2)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                            textAlign: "right",
                          }}
                        >
                          R$ {product.total_price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr
                      style={{
                        fontWeight: "bold",
                        backgroundColor: "#f3f4f6",
                      }}
                    >
                      <td
                        colSpan={5}
                        style={{ border: "1px solid #ddd", padding: "10px" }}
                      >
                        TOTAL GERAL
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "center",
                        }}
                      >
                        {selectedOrder.products.reduce(
                          (sum, p) => sum + p.quantity,
                          0
                        )}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "right",
                        }}
                      >
                        R$ {selectedOrder.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tabela interativa */}
              <div className="w-full overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            selectedProducts.size ===
                              selectedOrder.products.length &&
                            selectedOrder.products.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                          title="Selecionar tudo"
                        />
                      </TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Tecido</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Preço Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.products.map((product, index) => (
                      <TableRow
                        key={product.id || index}
                        className={cn(
                          selectedProducts.has(String(index)) &&
                            "bg-biobox-green/5"
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(String(index))}
                            onCheckedChange={(checked) =>
                              toggleProductSelection(String(index), checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.product_name}
                        </TableCell>
                        <TableCell>{product.model || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{
                                backgroundColor:
                                  getColorHex(product.color) || "#e5e7eb",
                              }}
                              title={product.color}
                            />
                            <span>{product.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.size || "-"}</TableCell>
                        <TableCell>{product.fabric || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {product.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {product.unit_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-biobox-green">
                          R$ {product.total_price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totalizadores */}
              <div className="mt-6 flex justify-end">
                <div className="w-full md:w-1/3 space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>
                      R${" "}
                      {selectedOrder.products
                        .reduce((sum, p) => sum + p.total_price, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  {selectedOrder.discount_amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="text-red-500">
                        -R$ {selectedOrder.discount_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-biobox-green">
                      R$ {selectedOrder.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão para enviar itens selecionados para produção */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null);
                    setSelectedProducts(new Set());
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleStartProduction}
                  className="bg-biobox-green hover:bg-biobox-green-dark"
                >
                  Enviar{" "}
                  {selectedProducts.size > 0
                    ? `${selectedProducts.size} Item(ns)`
                    : "Todos os Itens"}{" "}
                  para Produção
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Especificações dos Produtos */}
      {selectedOrder.products?.some((p) => p.specifications) && (
        <Card>
          <CardHeader>
            <CardTitle>Especificações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedOrder.products
                .filter(
                  (p) => p.specifications && Object.keys(p.specifications).length > 0
                )
                .map((product, index) => (
                  <div
                    key={product.id || index}
                    className="border-b pb-4 last:border-b-0"
                  >
                    <h4 className="font-bold mb-3">
                      {product.product_name} - {product.color} {product.size}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(product.specifications || {}).map(
                        ([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-muted-foreground mb-1 font-medium">
                              {key}
                            </p>
                            <p className="text-sm font-medium">
                              {typeof value === "string"
                                ? value
                                : JSON.stringify(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Função auxiliar para obter cor hexadecimal de nomes de cores
function getColorHex(colorName: string): string | null {
  const colorMap: Record<string, string> = {
    branco: "#ffffff",
    "branco gelo": "#f5f5f5",
    preto: "#000000",
    cinza: "#808080",
    "cinza escuro": "#555555",
    "cinza claro": "#cccccc",
    marrom: "#8b4513",
    "marrom escuro": "#654321",
    azul: "#0000ff",
    "azul marinho": "#000080",
    "azul claro": "#87ceeb",
    vermelho: "#ff0000",
    verde: "#008000",
    "verde escuro": "#006400",
    amarelo: "#ffff00",
    laranja: "#ff8c00",
    rosa: "#ffc0cb",
    roxo: "#800080",
    bege: "#f5f5dc",
    creme: "#fffdd0",
  };

  const normalized = colorName?.toLowerCase().trim() || "";
  return colorMap[normalized] || null;
}
