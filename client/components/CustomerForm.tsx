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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, User, Building } from "lucide-react";
import { Customer } from "@/types/customer";

interface CustomerFormProps {
  customer?: Customer;
  onSave: (customer: Partial<Customer>) => void;
  onCancel: () => void;
}

export default function CustomerForm({
  customer,
  onSave,
  onCancel,
}: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    tradeName: customer?.tradeName || "",
    paymentCondition: customer?.paymentCondition || "",
    representative: customer?.representative || "",
    cpf: customer?.cpf || "",
    cnpj: customer?.cnpj || "",
    type: customer?.type || ("individual" as "individual" | "business"),
    default_discount: customer?.default_discount || 0,
    address: {
      street: customer?.address?.street || "",
      number: customer?.address?.number || "",
      complement: customer?.address?.complement || "",
      neighborhood: customer?.address?.neighborhood || "",
      city: customer?.address?.city || "",
      state: customer?.address?.state || "",
      zipCode: customer?.address?.zipCode || "",
    },
    status: customer?.status || ("active" as "active" | "inactive"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              {formData.type === "individual" ? (
                <User className="h-5 w-5" />
              ) : (
                <Building className="h-5 w-5" />
              )}
              <span>{customer ? "Editar Cliente" : "Novo Cliente"}</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="individual"
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Pessoa Física</span>
                </TabsTrigger>
                <TabsTrigger
                  value="business"
                  className="flex items-center space-x-2"
                >
                  <Building className="h-4 w-4" />
                  <span>Pessoa Jurídica</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="João Silva"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange("cpf", e.target.value)}
                      placeholder="123.456.789-00"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="business" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Razão Social</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Empresa Ltda"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tradeName">Nome Fantasia</Label>
                    <Input
                      id="tradeName"
                      value={formData.tradeName}
                      onChange={(e) =>
                        handleInputChange("tradeName", e.target.value)
                      }
                      placeholder="Nome da Loja"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) =>
                        handleInputChange("cnpj", e.target.value)
                      }
                      placeholder="12.345.678/0001-90"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="cliente@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentCondition">Condição de Pagamento</Label>
                <Input
                  id="paymentCondition"
                  value={formData.paymentCondition}
                  onChange={(e) =>
                    handleInputChange("paymentCondition", e.target.value)
                  }
                  placeholder="Ex: 30/60/90 dias"
                />
              </div>
              <div>
                <Label htmlFor="representative">Representante</Label>
                <Input
                  id="representative"
                  value={formData.representative}
                  onChange={(e) =>
                    handleInputChange("representative", e.target.value)
                  }
                  placeholder="Nome do Representante"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Endereço</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) =>
                      handleAddressChange("street", e.target.value)
                    }
                    placeholder="Rua das Flores"
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.address.number}
                    onChange={(e) =>
                      handleAddressChange("number", e.target.value)
                    }
                    placeholder="123"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.address.complement}
                    onChange={(e) =>
                      handleAddressChange("complement", e.target.value)
                    }
                    placeholder="Apto 45"
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.address.neighborhood}
                    onChange={(e) =>
                      handleAddressChange("neighborhood", e.target.value)
                    }
                    placeholder="Centro"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) =>
                      handleAddressChange("city", e.target.value)
                    }
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Select
                    value={formData.address.state}
                    onValueChange={(value) =>
                      handleAddressChange("state", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">SP</SelectItem>
                      <SelectItem value="RJ">RJ</SelectItem>
                      <SelectItem value="MG">MG</SelectItem>
                      <SelectItem value="RS">RS</SelectItem>
                      <SelectItem value="PR">PR</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.address.zipCode}
                    onChange={(e) =>
                      handleAddressChange("zipCode", e.target.value)
                    }
                    placeholder="01234-567"
                  />
                </div>
              </div>
            </div>

            {/* Desconto Padrão */}
            <div>
              <Label htmlFor="default_discount">
                Desconto Padrão (%)
                <span className="text-xs text-muted-foreground ml-2">
                  (Aplicado automaticamente em novos pedidos)
                </span>
              </Label>
              <Input
                id="default_discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.default_discount}
                onChange={(e) =>
                  handleInputChange("default_discount", e.target.value)
                }
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Exemplo: 10 = 10% de desconto
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-biobox-green hover:bg-biobox-green-dark"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
