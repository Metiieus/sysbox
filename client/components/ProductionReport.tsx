import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  Download, 
  Calendar as CalendarIcon, 
  BarChart3,
  TrendingUp,
  Clock,
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  FileText
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { mockOrders } from "@/types/order";

interface ProductionReportProps {
  onClose: () => void;
}

export default function ProductionReport({ onClose }: ProductionReportProps) {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    switch (reportType) {
      case 'daily': return today;
      case 'weekly': return startOfWeek(today);
      case 'monthly': return startOfMonth(today);
      default: return startOfWeek(today);
    }
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    switch (reportType) {
      case 'daily': return today;
      case 'weekly': return endOfWeek(today);
      case 'monthly': return endOfMonth(today);
      default: return endOfWeek(today);
    }
  });
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // Calculate report data
  const getReportData = () => {
    const ordersInPeriod = mockOrders.filter(order => {
      const orderDate = order.scheduledDate;
      return orderDate >= startDate && orderDate <= endDate;
    });

    const totalOrders = ordersInPeriod.length;
    const completedOrders = ordersInPeriod.filter(o => o.status === 'delivered').length;
    const inProductionOrders = ordersInPeriod.filter(o => o.status === 'in_production').length;
    const delayedOrders = ordersInPeriod.filter(o => 
      o.deliveryDate && new Date() > o.deliveryDate && o.status !== 'delivered'
    ).length;

    const totalRevenue = ordersInPeriod
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const totalProduction = ordersInPeriod.reduce((sum, order) => 
      sum + order.products.reduce((pSum, product) => pSum + product.quantity, 0), 0
    );

    const averageProductionTime = ordersInPeriod
      .filter(o => o.completedDate && o.createdAt)
      .reduce((sum, order, _, arr) => {
        const days = Math.ceil((order.completedDate!.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days / arr.length;
      }, 0);

    const operatorEfficiency = 92;

    return {
      totalOrders,
      completedOrders,
      inProductionOrders,
      delayedOrders,
      totalRevenue,
      totalProduction,
      averageProductionTime: Math.round(averageProductionTime) || 5,
      operatorEfficiency: Math.round(operatorEfficiency),
      completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
    };
  };

  const reportData = getReportData();

  const handleDownloadReport = () => {
    const reportContent = `
RELATÓRIO DE PRODUÇÃO - ${format(startDate, "dd/MM/yyyy")} a ${format(endDate, "dd/MM/yyyy")}

RESUMO EXECUTIVO:
- Total de Pedidos: ${reportData.totalOrders}
- Pedidos Concluídos: ${reportData.completedOrders}
- Em Produção: ${reportData.inProductionOrders}
- Atrasados: ${reportData.delayedOrders}
- Taxa de Conclusão: ${reportData.completionRate}%

PRODUÇÃO:
- Total Produzido: ${reportData.totalProduction} unidades
- Tempo Médio: ${reportData.averageProductionTime} dias
- Eficiência Operadores: ${reportData.operatorEfficiency}%

FINANCEIRO:
- Receita do Período: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reportData.totalRevenue)}

OPERADORES:
- Dados de operadores disponíveis no sistema

Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-producao-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Relatório de Produção</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Configuration */}
          <Card className="bg-muted/5">
            <CardHeader>
              <CardTitle className="text-base">Configurações do Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Tipo de Relatório</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
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
                <div>
                  <Label>Data Inicial</Label>
                  <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) {
                            setStartDate(date);
                            setShowStartCalendar(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Data Final</Label>
                  <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          if (date) {
                            setEndDate(date);
                            setShowEndCalendar(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Data */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-biobox-green" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-foreground">{reportData.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                    <p className="text-2xl font-bold text-foreground">{reportData.completedOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Em Produção</p>
                    <p className="text-2xl font-bold text-foreground">{reportData.inProductionOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Atrasados</p>
                    <p className="text-2xl font-bold text-foreground">{reportData.delayedOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Métricas de Produção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
                    <span className="font-medium">{reportData.completionRate}%</span>
                  </div>
                  <Progress value={reportData.completionRate} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eficiência dos Operadores</span>
                    <span className="font-medium">{reportData.operatorEfficiency}%</span>
                  </div>
                  <Progress value={reportData.operatorEfficiency} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Unidades Produzidas</p>
                    <p className="text-lg font-bold text-foreground">{reportData.totalProduction}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-lg font-bold text-foreground">{reportData.averageProductionTime} dias</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Métricas Financeiras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Receita do Período</p>
                  <p className="text-2xl font-bold text-biobox-green">{formatCurrency(reportData.totalRevenue)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-lg font-bold text-foreground">
                      {reportData.totalOrders > 0 
                        ? formatCurrency(reportData.totalRevenue / reportData.totalOrders)
                        : formatCurrency(0)
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receita/Unidade</p>
                    <p className="text-lg font-bold text-foreground">
                      {reportData.totalProduction > 0 
                        ? formatCurrency(reportData.totalRevenue / reportData.totalProduction)
                        : formatCurrency(0)
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operator Performance */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Performance dos Operadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Dados de operadores serão exibidos aqui
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={handleDownloadReport} className="bg-biobox-green hover:bg-biobox-green-dark">
              <Download className="h-4 w-4 mr-2" />
              Baixar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}