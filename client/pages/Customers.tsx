import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CustomerForm from "@/components/CustomerForm";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  Users,
  Plus,
  Search,
  Edit,
  Eye,
  Filter,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  Trash2,
} from "lucide-react";
import { Customer } from "@/types/customer";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/hooks/useFirebase";
import { useAuth } from "@/hooks/useAuth";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | undefined
  >();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "individual" | "business"
  >("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const {
    getCustomers,
    createCustomer: createCustomerFn,
    updateCustomer: updateCustomerFn,
    deleteCustomer: deleteCustomerFn,
  } = useFirebase();

  const { user, checkPermission } = useAuth();
  const isAdmin = user?.role === "admin";
  const { toast } = useToast();

  // Carregar clientes diretamente do Firestore quando disponível (fallback para hook)
  const loadCustomers = async () => {
    try {
      setLoading(true);
      console.log("🔄 Carregando clientes...");

      let raw: any[] = [];
      if (isFirebaseConfigured && db) {
        const snap = await getDocs(collection(db, "customers"));
        raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      } else {
        raw = await getCustomers();
      }

      if (!raw || raw.length === 0) {
        setCustomers([]);
        return;
      }

      // Mapear dados para o formato esperado pela UI com segurança
      const mappedCustomersRaw: Customer[] = raw.map(
        (customer: any, idx: number) => ({
          id: String(customer.id || `customer-${Date.now()}-${idx}`),
          name: customer.name || "-",
          email: customer.email || "",
          phone: customer.phone || "",
          cpf: (customer.cpf as string) || "",
          cnpj: (customer.cnpj as string) || "",
          tradeName: customer.tradeName || customer.trade_name || "",
          paymentCondition:
            customer.paymentCondition || customer.payment_condition || "",
          representative: customer.representative || "",
          type:
            customer.type === "company" || customer.type === "business"
              ? "business"
              : customer.type === "individual"
                ? "individual"
                : "individual",
          address: {
            street:
              (customer.address &&
                (customer.address.street || customer.address.street_address)) ||
              "",
            number:
              (customer.address &&
                (customer.address.number || customer.address.street_number)) ||
              "",
            complement: (customer.address && customer.address.complement) || "",
            neighborhood:
              (customer.address && customer.address.neighborhood) || "",
            city:
              customer.city ||
              (customer.address && customer.address.city) ||
              "",
            state:
              customer.state ||
              (customer.address && customer.address.state) ||
              "",
            zipCode:
              customer.zip_code ||
              customer.zipCode ||
              (customer.address && customer.address.zipCode) ||
              "",
          },
          status: customer.status === "inactive" ? "inactive" : "active",
          totalOrders:
            (customer.total_orders as number) ||
            (customer.totalOrders as number) ||
            0,
          totalSpent:
            (customer.total_spent as number) ||
            (customer.totalSpent as number) ||
            0,
          createdAt: customer.created_at
            ? new Date(customer.created_at)
            : customer.createdAt
              ? new Date(customer.createdAt)
              : new Date(),
          updatedAt: customer.updated_at
            ? new Date(customer.updated_at)
            : customer.updatedAt
              ? new Date(customer.updatedAt)
              : new Date(),
        }),
      );

      const unique = Array.from(
        new Map(mappedCustomersRaw.map((c) => [c.id, c])).values(),
      );

      setCustomers(unique);
    } catch (error) {
      console.error("❌ Erro inesperado ao carregar clientes:", error);
      try {
        const fallback = JSON.parse(
          localStorage.getItem("biobox_customers") || "[]",
        );
        setCustomers(Array.isArray(fallback) ? fallback : []);
      } catch {
        setCustomers([]);
      }
      toast({
        title: "Erro ao carregar clientes",
        description: (error as Error).message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    const matchesType = filterType === "all" || customer.type === filterType;
    return matchesSearch && matchesType;
  });

  const pageCount = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  useEffect(() => {
    const nextMax = Math.max(
      1,
      Math.ceil(filteredCustomers.length / PAGE_SIZE),
    );
    setCurrentPage((prev) => (prev > nextMax ? nextMax : prev));
  }, [filteredCustomers.length]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  const hasCustomers = filteredCustomers.length > 0;
  const rangeStart = hasCustomers ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = hasCustomers
    ? Math.min(
        filteredCustomers.length,
        Math.max(rangeStart, rangeStart + paginatedCustomers.length - 1),
      )
    : 0;

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      setSaving(true);
      console.log("💾 Salvando cliente:", customerData);

      if (selectedCustomer) {
        // Editar cliente existente usando função do hook
        try {
          const updated = await updateCustomerFn(selectedCustomer.id, {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            cpf: customerData.cpf,
            cnpj: customerData.cnpj,
            tradeName: customerData.tradeName,
            paymentCondition: customerData.paymentCondition,
            representative: customerData.representative,
            type: customerData.type,
            address: customerData.address,
            status: customerData.status,
          });

          if (!updated) {
            console.warn(
              "❗ Atualização no backend falhou, aplicando fallback local",
            );
            setCustomers((prev) =>
              prev.map((customer) =>
                customer.id === selectedCustomer.id
                  ? { ...customer, ...customerData, updatedAt: new Date() }
                  : customer,
              ),
            );
          } else {
            console.log("✅ Cliente atualizado com sucesso");
            await loadCustomers(); // Recarregar dados
          }
        } catch (err) {
          console.error("❌ Erro ao atualizar cliente:", err);
          setCustomers((prev) =>
            prev.map((customer) =>
              customer.id === selectedCustomer.id
                ? { ...customer, ...customerData, updatedAt: new Date() }
                : customer,
            ),
          );
        }
      } else {
        // Criar novo cliente usando função do hook
        try {
          const created = await createCustomerFn({
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            cpf: customerData.cpf,
            cnpj: customerData.cnpj,
            tradeName: customerData.tradeName,
            paymentCondition: customerData.paymentCondition,
            representative: customerData.representative,
            type: customerData.type,
            address: customerData.address,
            status: customerData.status || "active",
          });

          if (!created) {
            console.warn(
              "❗ Criação no backend falhou, aplicando fallback local",
            );
            const newCustomer: Customer = {
              ...customerData,
              id: Date.now().toString(),
              createdAt: new Date(),
              updatedAt: new Date(),
              totalOrders: 0,
              totalSpent: 0,
            } as Customer;
            setCustomers((prev) => [newCustomer, ...prev]);
          } else {
            console.log("✅ Cliente criado com sucesso");
            await loadCustomers(); // Recarregar dados
          }
        } catch (err) {
          console.error("❌ Erro ao criar cliente:", err);
          const newCustomer: Customer = {
            ...customerData,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            totalOrders: 0,
            totalSpent: 0,
          } as Customer;
          setCustomers((prev) => [newCustomer, ...prev]);
        }
      }

      setShowForm(false);
      setSelectedCustomer(undefined);
    } catch (error) {
      console.error("❌ Erro inesperado ao salvar cliente:", error);
      // Fallback para operação local
      if (selectedCustomer) {
        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === selectedCustomer.id
              ? { ...customer, ...customerData, updatedAt: new Date() }
              : customer,
          ),
        );
      } else {
        const newCustomer: Customer = {
          ...customerData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          totalOrders: 0,
          totalSpent: 0,
        } as Customer;
        setCustomers((prev) => [newCustomer, ...prev]);
      }
      setShowForm(false);
      setSelectedCustomer(undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este cliente? Esta aç��o não pode ser desfeita.",
      )
    ) {
      return;
    }

    try {
      if (!customerId) {
        toast({
          title: "ID inválido",
          description: "Cliente sem identificador válido.",
        });
        return;
      }
      const success = await deleteCustomerFn(customerId);

      if (!success) {
        toast({
          title: "Erro ao excluir cliente",
          description: "Não foi possível excluir o cliente",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cliente excluído",
        description: "Cliente removido com sucesso",
      });

      loadCustomers();
    } catch (error) {
      console.error("Erro inesperado ao excluir cliente:", error);
      toast({
        title: "Erro ao excluir cliente",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando clientes...</p>
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
              Gerenciamento de Clientes
            </h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie seus clientes com persistência no Firebase
            </p>
          </div>
          <Button
            className="bg-biobox-green hover:bg-biobox-green-dark"
            onClick={() => {
              setSelectedCustomer(undefined);
              setShowForm(true);
            }}
            disabled={saving}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Stats e Filtros ... (código existente) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-biobox-green" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Clientes
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {customers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pessoa Física
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {customers.filter((c) => c.type === "individual").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pessoa Jurídica
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {customers.filter((c) => c.type === "business").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ativos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {customers.filter((c) => c.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Lista de Clientes</span>
              </CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={filterType === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("all")}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={
                      filterType === "individual" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setFilterType("individual")}
                  >
                    <User className="h-4 w-4 mr-1" />
                    PF
                  </Button>
                  <Button
                    variant={filterType === "business" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("business")}
                  >
                    <Building className="h-4 w-4 mr-1" />
                    PJ
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Pedidos</TableHead>
                    {isAdmin && <TableHead>Total Gasto</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-biobox-green/10 text-biobox-green">
                              {customer.type === "individual" ? (
                                <User className="h-5 w-5" />
                              ) : (
                                <Building className="h-5 w-5" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {customer.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {customer.type === "individual"
                                ? customer.cpf
                                : customer.cnpj}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {customer.type === "individual" ? (
                            <User className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Building className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="text-sm">
                            {customer.type === "individual" ? "PF" : "PJ"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {customer.address.city}, {customer.address.state}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {customer.totalOrders}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant={
                            customer.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className={cn(
                            customer.status === "active"
                              ? "bg-biobox-green/10 text-biobox-green border-biobox-green/20"
                              : "",
                          )}
                        >
                          {customer.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCustomer(customer)}
                            title="Editar cliente"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            title="Excluir cliente"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {hasCustomers ? `${rangeStart}–${rangeEnd}` : "0"} de{" "}
                {filteredCustomers.length} clientes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  ««
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  «
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(pageCount, prev + 1))
                  }
                  disabled={currentPage === pageCount || !hasCustomers}
                >
                  »
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pageCount)}
                  disabled={currentPage === pageCount || !hasCustomers}
                >
                  »»
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <CustomerForm
            customer={selectedCustomer}
            onSave={handleSaveCustomer}
            onCancel={() => {
              setShowForm(false);
              setSelectedCustomer(undefined);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
