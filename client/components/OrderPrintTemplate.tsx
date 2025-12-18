// client/components/OrderPrintTemplate.tsx
import { Order } from "@/hooks/useFirebase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderPrintTemplateProps {
  order: Order;
}

export default function OrderPrintTemplate({ order }: OrderPrintTemplateProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: any) => {
    if (!date) return "____/____/____";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  // Calcular descontos (baseado na estrutura do formulário)
  const calcularDescontos = () => {
    const descontoFinanceiro = order.total_amount * 0.03;
    const descontoComercial = order.total_amount * 0.03;
    const descontoFrete = order.total_amount * 0.05;
    const acrescimo = order.total_amount * 0.06;

    return {
      financeiro: descontoFinanceiro,
      comercial: descontoComercial,
      frete: descontoFrete,
      acrescimo: acrescimo,
    };
  };

  const descontos = calcularDescontos();

  return (
    <div
      className="print-template"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "10mm",
        fontFamily: "Arial, sans-serif",
        fontSize: "10pt",
        backgroundColor: "white",
        color: "black",
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid black",
          paddingBottom: "10px",
          marginBottom: "10px",
        }}
      >
        <div>
          <img
            src="/biobox-logo.png"
            alt="BioBox"
            style={{ height: "40px" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div style={{ fontSize: "8pt", marginTop: "5px" }}>
            <strong>BioBox Sistemas de Produção</strong>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0, fontSize: "14pt" }}>PEDIDO DE VENDA</h2>
          <div style={{ marginTop: "5px" }}>
            <strong>Nº:</strong> {order.order_number}
          </div>
          <div>
            <strong>Data:</strong> {formatDate(order.created_at)}
          </div>
        </div>
      </div>

      {/* Informações do Cliente */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "15px",
          border: "1px solid black",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
                width: "60%",
              }}
            >
              <strong>CLIENTE:</strong> {order.customer_name}
              {order.customer_trade_name && (
                <span
                  style={{ marginLeft: "10px", fontSize: "8pt", color: "#666" }}
                >
                  ({order.customer_trade_name})
                </span>
              )}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
                width: "40%",
              }}
            >
              <strong>CNPJ:</strong> {order.customer_cpf || "_________________"}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>REPRESENTANTE:</strong>{" "}
              {order.representative || order.seller_name}
            </td>
          </tr>
          <tr>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>ENDEREÇO:</strong>{" "}
              {order.customer_address || "_________________________________"}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>BAIRRO:</strong>{" "}
              {order.customer_neighborhood || "______________"}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>MUNICÍPIO:</strong> {order.customer_city || "__________"}
            </td>
          </tr>
          <tr>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>UF:</strong> {order.customer_state || "__"}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>CEP:</strong> {order.customer_zipcode || "________-___"}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>CONTATO:</strong> {order.customer_phone}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>TELEFONE:</strong> {order.customer_phone}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>E-MAIL:</strong>{" "}
              {order.customer_email || "________________"}
            </td>
          </tr>
          <tr>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>LOCAL DE ENTREGA:</strong>{" "}
              {order.delivery_location || "_________________________________"}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>TIPO FRETE:</strong> {order.freight_type || "CIF/FOB"}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
              }}
            >
              <strong>COND.PAGTO:</strong>{" "}
              {order.payment_condition || "__________"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Tabela de Produtos */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "15px",
          border: "1px solid black",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "left",
              }}
            >
              CÓDIGO
            </th>
            <th
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "left",
              }}
            >
              DESCRIÇÃO
            </th>
            <th
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "center",
              }}
            >
              QUANT.
            </th>
            <th
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "center",
              }}
            >
              UN. TABELA
            </th>
            <th
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "center",
              }}
            >
              UN. LÍQUIDO
            </th>
            <th
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "right",
              }}
            >
              TOTAL TABELA
            </th>
            <th
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "right",
              }}
            >
              TOTAL LÍQUIDO
            </th>
            <th
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "left",
              }}
            >
              OBSERVAÇÕES
            </th>
          </tr>
        </thead>
        <tbody>
          {order.products && order.products.length > 0 ? (
            order.products.map((product, index) => (
              <tr key={index}>
                <td style={{ padding: "5px", border: "1px solid black" }}>
                  {product.product_id || `PROD-${index + 1}`}
                </td>
                <td style={{ padding: "5px", border: "1px solid black" }}>
                  {product.product_name}
                  {product.model && (
                    <div style={{ fontSize: "8pt" }}>
                      Modelo: {product.model}
                    </div>
                  )}
                  {(product.size || product.color || product.fabric) && (
                    <div style={{ fontSize: "8pt" }}>
                      {[product.size, product.color, product.fabric]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid black",
                    textAlign: "center",
                  }}
                >
                  {product.quantity}
                </td>
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid black",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(product.unit_price)}
                </td>
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid black",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(product.unit_price * 0.94)}
                </td>
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid black",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(product.total_price)}
                </td>
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid black",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(product.total_price * 0.94)}
                </td>
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid black",
                    fontSize: "8pt",
                  }}
                >
                  {product.notes || ""}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={8}
                style={{
                  padding: "20px",
                  textAlign: "center",
                  border: "1px solid black",
                }}
              >
                Nenhum produto cadastrado
              </td>
            </tr>
          )}

          {/* Linha de Total */}
          <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
            <td
              colSpan={2}
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "right",
              }}
            >
              TOTAL .....
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "center",
              }}
            >
              {order.total_quantity || 0}
            </td>
            <td colSpan={2}></td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "right",
              }}
            >
              {formatCurrency(order.total_amount)}
            </td>
            <td
              style={{
                padding: "5px",
                border: "1px solid black",
                textAlign: "right",
              }}
            >
              {formatCurrency(order.total_amount * 0.94)}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* Tabela de Descontos e Totais */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "15px",
          fontSize: "9pt",
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: "70%" }}></td>
            <td
              style={{
                padding: "3px 10px",
                border: "1px solid black",
                textAlign: "center",
                backgroundColor: "#f0f0f0",
              }}
            >
              <strong>Desc.Financeiro</strong>
            </td>
            <td
              style={{
                padding: "3px 10px",
                border: "1px solid black",
                textAlign: "center",
                backgroundColor: "#f0f0f0",
              }}
            >
              <strong>Desc.Comercial</strong>
            </td>
            <td
              style={{
                padding: "3px 10px",
                border: "1px solid black",
                textAlign: "center",
                backgroundColor: "#f0f0f0",
              }}
            >
              <strong>Desc.Frete</strong>
            </td>
            <td
              style={{
                padding: "3px 10px",
                border: "1px solid black",
                textAlign: "center",
                backgroundColor: "#f0f0f0",
              }}
            >
              <strong>Acréscimo</strong>
            </td>
          </tr>
          <tr>
            <td></td>
            <td
              style={{
                padding: "3px 10px",
                border: "1px solid black",
                textAlign: "center",
              }}
            >
              3%
            </td>
            <td
              style={{
                padding: "3px 10px",
                border: "1px solid black",
                textAlign: "center",
              }}
            >
              3%
            </td>
            <td
              style={{
                padding: "3px 10px",
                border: "1px solid black",
                textAlign: "center",
              }}
            >
              5%
            </td>
            <td
              style={{
                padding: "3px 10px",
                border: "1px solid black",
                textAlign: "center",
              }}
            >
              6%
            </td>
          </tr>
        </tbody>
      </table>

      {/* Observações */}
      {order.notes && (
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            border: "1px solid black",
            minHeight: "60px",
          }}
        >
          <strong>OBSERVAÇÕES:</strong>
          <div style={{ marginTop: "5px", whiteSpace: "pre-wrap" }}>
            {order.notes}
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div
        style={{
          marginTop: "20px",
          paddingTop: "10px",
          borderTop: "1px solid black",
          fontSize: "8pt",
          textAlign: "center",
        }}
      >
        <p>
          Data de Impressão:{" "}
          {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </p>
        <p style={{ marginTop: "5px" }}>
          <strong>Status:</strong> {order.status.toUpperCase()} |
          <strong> Prioridade:</strong> {order.priority.toUpperCase()} |
          <strong> Progresso:</strong> {order.production_progress}%
        </p>
      </div>
    </div>
  );
}
