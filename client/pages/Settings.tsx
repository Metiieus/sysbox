import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import BarcodeGenerator from "@/components/BarcodeGenerator";
import UserManagement from "@/components/UserManagement";
import { useFirebase } from "@/hooks/useFirebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  QrCode,
  Printer,
  Mail,
  Phone,
  Save,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface UserSettings {
  name: string;
  email: string;
  phone: string;
  role: string;
  notifications: {
    email: boolean;
    push: boolean;
    lowStock: boolean;
    productionAlerts: boolean;
    orderUpdates: boolean;
  };
  preferences: {
    theme: "light" | "dark" | "system";
    language: "pt-BR" | "en-US";
    dateFormat: "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd";
    currency: "BRL" | "USD";
  };
}

interface SystemSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  address: string;
  taxId: string;
  lowStockThreshold: number;
  monthlyRevenueTarget: number;
  autoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  lastBackup?: Date;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: "Administrator",
    email: "admin@bioboxsys.com",
    phone: "(11) 99999-9999",
    role: "Gerente de Produção",
    notifications: {
      email: true,
      push: true,
      lowStock: true,
      productionAlerts: true,
      orderUpdates: false,
    },
    preferences: {
      theme: "dark",
      language: "pt-BR",
      dateFormat: "dd/MM/yyyy",
      currency: "BRL",
    },
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    companyName: "BioBox Indústria de Móveis",
    companyEmail: "contato@biobox.com.br",
    companyPhone: "(11) 4321-1234",
    address: "Rua Industrial, 123 - São Paulo, SP",
    taxId: "12.345.678/0001-90",
    lowStockThreshold: 5,
    monthlyRevenueTarget: 180000,
    autoBackup: true,
    backupFrequency: "daily",
    lastBackup: new Date(),
  });

  const [saved, setSaved] = useState(false);
  const { getUsers, getCustomers, getProducts, getOrders } = useFirebase();
  const { user } = useAuth();

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      const storedSettings = localStorage.getItem("biobox_settings_system");
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setSystemSettings((prev) => ({
          ...prev,
          ...settings,
          lastBackup: settings.lastBackup
            ? new Date(settings.lastBackup)
            : prev.lastBackup,
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar configurações do sistema:", error);
    }
  };

  const handleSaveUserSettings = async () => {
    try {
      const key = `user:${user?.id || "anonymous"}`;
      const payload = { ...userSettings };
      localStorage.setItem(`biobox_settings_${key}`, JSON.stringify(payload));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  };

  const handleSaveSystemSettings = async () => {
    try {
      const key = "system";
      const payload = { ...systemSettings };
      localStorage.setItem(`biobox_settings_${key}`, JSON.stringify(payload));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  };

  const handleBackup = async () => {
    const [users, customers, products, orders] = await Promise.all([
      getUsers(),
      getCustomers(),
      getProducts(),
      getOrders(),
    ]);

    const payload = {
      meta: {
        generatedAt: new Date().toISOString(),
        app: "BioBoxsys",
        version: 1,
      },
      users,
      customers,
      products,
      orders,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `bioboxsys-backup-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setSystemSettings((prev) => ({ ...prev, lastBackup: new Date() }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Configurações do Sistema
            </h1>
            <p className="text-muted-foreground">
              Gerencie as configurações do BioBoxsys
            </p>
          </div>
          {saved && (
            <Badge className="bg-biobox-green/10 text-biobox-green border-biobox-green/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Salvo com sucesso!
            </Badge>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="barcode">Códigos</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Informações Pessoais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-biobox-green/10 text-biobox-green text-lg font-medium">
                        AD
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Recomendado: 400x400px, máximo 2MB
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={userSettings.name}
                        onChange={(e) =>
                          setUserSettings((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userSettings.email}
                        onChange={(e) =>
                          setUserSettings((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={userSettings.phone}
                        onChange={(e) =>
                          setUserSettings((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Cargo</Label>
                      <Input
                        id="role"
                        value={userSettings.role}
                        onChange={(e) =>
                          setUserSettings((prev) => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveUserSettings}
                    className="w-full bg-biobox-green hover:bg-biobox-green-dark"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5" />
                    <span>Preferências</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={userSettings.preferences.theme}
                      onValueChange={(value: any) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          preferences: { ...prev.preferences, theme: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={userSettings.preferences.language}
                      onValueChange={(value: any) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          preferences: { ...prev.preferences, language: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">
                          Português (Brasil)
                        </SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateFormat">Formato de Data</Label>
                    <Select
                      value={userSettings.preferences.dateFormat}
                      onValueChange={(value: any) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            dateFormat: value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                        <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                        <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currency">Moeda</Label>
                    <Select
                      value={userSettings.preferences.currency}
                      onValueChange={(value: any) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          preferences: { ...prev.preferences, currency: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Configurações de Notificação</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações por E-mail</p>
                      <p className="text-sm text-muted-foreground">
                        Receber alertas por e-mail
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.email}
                      onCheckedChange={(checked) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            email: checked,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações Push</p>
                      <p className="text-sm text-muted-foreground">
                        Alertas no navegador
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.push}
                      onCheckedChange={(checked) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            push: checked,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertas de Estoque Baixo</p>
                      <p className="text-sm text-muted-foreground">
                        Quando produtos atingirem estoque mínimo
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.lowStock}
                      onCheckedChange={(checked) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            lowStock: checked,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertas de Produção</p>
                      <p className="text-sm text-muted-foreground">
                        Problemas e atrasos na produção
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.productionAlerts}
                      onCheckedChange={(checked) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            productionAlerts: checked,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Atualizações de Pedidos</p>
                      <p className="text-sm text-muted-foreground">
                        Mudanças de status dos pedidos
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications.orderUpdates}
                      onCheckedChange={(checked) =>
                        setUserSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            orderUpdates: checked,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveUserSettings}
                  className="bg-biobox-green hover:bg-biobox-green-dark"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Configurações da Empresa</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      value={systemSettings.companyName}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">CNPJ</Label>
                    <Input
                      id="taxId"
                      value={systemSettings.taxId}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          taxId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">E-mail Corporativo</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={systemSettings.companyEmail}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          companyEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyPhone">Telefone</Label>
                    <Input
                      id="companyPhone"
                      value={systemSettings.companyPhone}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          companyPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={systemSettings.address}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lowStockThreshold">
                      Limite Mínimo de Estoque
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={systemSettings.lowStockThreshold}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          lowStockThreshold: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyRevenueTarget">
                      Meta Mensal de Receita (R$)
                    </Label>
                    <Input
                      id="monthlyRevenueTarget"
                      type="number"
                      step="1000"
                      value={systemSettings.monthlyRevenueTarget}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          monthlyRevenueTarget: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="180000"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveSystemSettings}
                  className="bg-biobox-green hover:bg-biobox-green-dark"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="barcode">
            <BarcodeGenerator />
          </TabsContent>

          <TabsContent value="backup">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Backup Automático</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Backup Automático</p>
                      <p className="text-sm text-muted-foreground">
                        Fazer backup regularmente
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.autoBackup}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          autoBackup: checked,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="backupFrequency">Frequência</Label>
                    <Select
                      value={systemSettings.backupFrequency}
                      onValueChange={(value: any) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          backupFrequency: value,
                        }))
                      }
                      disabled={!systemSettings.autoBackup}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {systemSettings.lastBackup && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Último backup:{" "}
                        {systemSettings.lastBackup.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={handleSaveSystemSettings}
                    className="w-full bg-biobox-green hover:bg-biobox-green-dark"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5" />
                    <span>Backup Manual</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Faça backup manual dos dados quando necessário. O arquivo
                    será baixado automaticamente.
                  </p>

                  <div className="space-y-2">
                    <Button
                      onClick={handleBackup}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Fazer Backup Agora
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("restore-input")?.click()
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Restaurar Backup
                    </Button>
                    <input
                      id="restore-input"
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        try {
                          const data = JSON.parse(text);
                          if (data.users)
                            localStorage.setItem(
                              "biobox_users",
                              JSON.stringify(data.users),
                            );
                          if (data.customers)
                            localStorage.setItem(
                              "biobox_customers",
                              JSON.stringify(data.customers),
                            );
                          if (data.products)
                            localStorage.setItem(
                              "biobox_products",
                              JSON.stringify(data.products),
                            );
                          if (data.orders)
                            localStorage.setItem(
                              "biobox_orders",
                              JSON.stringify(data.orders),
                            );
                          setSaved(true);
                          setTimeout(() => setSaved(false), 3000);
                        } catch {}
                      }}
                    />
                  </div>

                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <p className="text-sm font-medium text-orange-500">
                        Importante
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Mantenha backups regulares em local seguro. Em caso de
                      perda de dados, o backup mais recente será usado para
                      restauração.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
