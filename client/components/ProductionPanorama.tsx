import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download } from "lucide-react";
import { format, parseISO, isSameDay as dateIsSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Order } from "@/hooks/useFirebase";
import { cn } from "@/lib/utils";

interface ProductionPanoramaProps {
  orders: Order[];
  startDate: Date;
  endDate: Date;
}

const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export default function ProductionPanorama({
  orders,
  startDate,
  endDate,
}: ProductionPanoramaProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Panorama de Produção - ${format(startDate, "dd/MM/yyyy")} a ${format(endDate, "dd/MM/yyyy")}</title>
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
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .date-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .date-header {
              background-color: #10B981;
              color: white;
              padding: 10px;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .priority-urgent { background-color: #fee; }
            .priority-high { background-color: #ffe; }
            .priority-medium { background-color: #eff; }
            .priority-low { background-color: #f9f9f9; }
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
    // Não chamar print() automaticamente
    // O usuário pode visualizar e imprimir quando quiser (Ctrl+P)
  };

  // Agrupar pedidos por data
  const ordersByDate = new Map<string, Order[]>();

  orders.forEach((order) => {
    if (!order.scheduled_date) return;

    try {
      const scheduledDate = parseISO(order.scheduled_date);
      const dateKey = format(scheduledDate, "yyyy-MM-dd");

      if (!ordersByDate.has(dateKey)) {
        ordersByDate.set(dateKey, []);
      }
      ordersByDate.get(dateKey)!.push(order);
    } catch (error) {
      console.error("Erro ao processar data:", error);
    }
  });

  // Ordenar datas
  const sortedDates = Array.from(ordersByDate.keys()).sort();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold">Panorama de Produção</h2>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Visualizar Impressão
        </Button>
      </div>

      <div ref={printRef}>
        <div className="header">
          <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>
            PANORAMA DE PRODUÇÃO
          </h1>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Período: {format(startDate, "dd/MM/yyyy", { locale: ptBR })} a{" "}
            {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
          </p>
          <p style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            Gerado em:{" "}
            {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>

        {sortedDates.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Nenhum pedido agendado para este período
          </p>
        ) : (
          sortedDates.map((dateKey) => {
            const dateOrders = ordersByDate.get(dateKey)!;
            const totalValue = dateOrders.reduce(
              (sum, o) => sum + o.total_amount,
              0,
            );
            const totalProducts = dateOrders.reduce(
              (sum, o) => sum + (o.products?.length || 0),
              0,
            );
            const totalFragments = dateOrders.reduce(
              (sum, o) => sum + (o.fragments?.length || 0),
              0,
            );
            const totalQuantity = dateOrders.reduce((sum, o) => {
              const products =
                o.products?.reduce((s, p) => s + (p.quantity || 0), 0) || 0;
              return sum + products;
            }, 0);

            return (
              <div key={dateKey} className="date-section">
                <div className="date-header">
                  {format(parseISO(dateKey), "EEEE, dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  }).toUpperCase()}
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "normal",
                      marginTop: "5px",
                    }}
                  >
                    Total: {dateOrders.length} pedido(s) | {totalQuantity}{" "}
                    unidade(s) | {totalFragments} fragmento(s)
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>OP/Frag</th>
                      <th>Produto</th>
                      <th style={{ width: "100px" }}>Tipo</th>
                      <th style={{ width: "100px" }}>Tecido</th>
                      <th style={{ width: "80px" }}>Cor</th>
                      <th style={{ width: "60px" }}>Largura</th>
                      <th style={{ width: "60px" }}>Comprim.</th>
                      <th style={{ width: "50px" }}>Qtde</th>
                      <th>Observações</th>
                      <th style={{ width: "100px" }}>Pedido</th>
                      <th style={{ width: "80px" }}>Prazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateOrders.map((order) => {
                      const products = order.products || [];
                      const fragments =
                        order.fragments?.filter(
                          (f) =>
                            f.scheduled_date &&
                            dateIsSameDay(
                              parseISO(f.scheduled_date),
                              parseISO(dateKey),
                            ),
                        ) || [];
                      const totalRows = Math.max(
                        products.length + fragments.length,
                        1,
                      );

                      return totalRows > 0 ? (
                        <>
                          {products.length > 0
                            ? products.map((product, idx) => (
                                <tr
                                  key={`${order.id}-prod-${idx}`}
                                  className={`priority-${order.priority}`}
                                >
                                  {idx === 0 && (
                                    <>
                                      <td rowSpan={totalRows}>
                                        {order.order_number}
                                      </td>
                                    </>
                                  )}
                                  <td>{product.product_name}</td>
                                  <td>{product.model || "-"}</td>
                                  <td>{product.fabric || "-"}</td>
                                  <td>{product.color || "-"}</td>
                                  <td style={{ textAlign: "center" }}>
                                    {(product as any).width || "-"}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    {(product as any).length || "-"}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    {product.quantity}
                                  </td>
                                  {idx === 0 && (
                                    <>
                                      <td rowSpan={totalRows}>
                                        {order.customer_name}
                                        {order.notes && (
                                          <>
                                            <br />
                                            <small>{order.notes}</small>
                                          </>
                                        )}
                                      </td>
                                      <td rowSpan={totalRows}>
                                        {order.seller_name || "-"}
                                      </td>
                                      <td rowSpan={totalRows}>
                                        {order.delivery_date
                                          ? format(
                                              parseISO(order.delivery_date),
                                              "dd/MM/yyyy",
                                            )
                                          : "A vista"}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))
                            : null}
                          {fragments.length > 0 &&
                            fragments.map((fragment, idx) => (
                              <tr
                                key={`${order.id}-frag-${idx}`}
                                style={{
                                  backgroundColor: "#fff8f0",
                                  fontStyle: "italic",
                                }}
                              >
                                {idx === 0 && products.length === 0 ? (
                                  <td>Frag. {fragment.fragment_number}</td>
                                ) : (
                                  <td style={{ textAlign: "center" }}>
                                    Frag. {fragment.fragment_number}
                                  </td>
                                )}
                                <td>{fragment.product_name || "-"}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>{fragment.color || "-"}</td>
                                <td style={{ textAlign: "center" }}>-</td>
                                <td style={{ textAlign: "center" }}>-</td>
                                <td style={{ textAlign: "center" }}>
                                  {fragment.quantity}
                                </td>
                                {idx === 0 && products.length === 0 && (
                                  <>
                                    <td>
                                      {order.customer_name}
                                      {order.notes && (
                                        <>
                                          <br />
                                          <small>{order.notes}</small>
                                        </>
                                      )}
                                    </td>
                                    <td>{order.seller_name || "-"}</td>
                                    <td>
                                      {order.delivery_date
                                        ? format(
                                            parseISO(order.delivery_date),
                                            "dd/MM/yyyy",
                                          )
                                        : "A vista"}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                        </>
                      ) : (
                        <tr
                          key={order.id}
                          className={`priority-${order.priority}`}
                        >
                          <td>{order.order_number}</td>
                          <td colSpan={7}>Sem produtos cadastrados</td>
                          <td>{order.customer_name}</td>
                          <td>{order.seller_name || "-"}</td>
                          <td>
                            {order.delivery_date
                              ? format(
                                  parseISO(order.delivery_date),
                                  "dd/MM/yyyy",
                                )
                              : "A vista"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="total-row">
                      <td colSpan={7}>TOTAL GERAL</td>
                      <td style={{ textAlign: "center" }}>{totalQuantity}</td>
                      <td colSpan={3}>{formatCurrency(totalValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        {/* Resumo Geral */}
        {sortedDates.length > 0 && (
          <div
            style={{
              marginTop: "30px",
              padding: "15px",
              border: "2px solid #10B981",
            }}
          >
            <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>
              RESUMO GERAL
            </h3>
            <table>
              <tbody>
                <tr>
                  <td style={{ fontWeight: "bold" }}>Total de Dias:</td>
                  <td>{sortedDates.length}</td>
                  <td style={{ fontWeight: "bold" }}>Total de Pedidos:</td>
                  <td>{orders.length}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold" }}>Total de Produtos:</td>
                  <td>
                    {orders.reduce((sum, o) => {
                      const products =
                        o.products?.reduce(
                          (s, p) => s + (p.quantity || 0),
                          0,
                        ) || 0;
                      const fragments =
                        o.fragments?.reduce(
                          (s, f) => s + (f.quantity || 0),
                          0,
                        ) || 0;
                      return sum + products + fragments;
                    }, 0)}{" "}
                    unidades
                  </td>
                  <td style={{ fontWeight: "bold" }}>Valor Total:</td>
                  <td>
                    {formatCurrency(
                      orders.reduce((sum, o) => sum + o.total_amount, 0),
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
