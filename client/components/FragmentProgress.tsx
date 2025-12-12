import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  Clock,
  Play,
  Pause,
  Square
} from "lucide-react";
import { OrderFragment } from "@/types/order";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FragmentProgressProps {
  fragments: OrderFragment[];
  onUpdateFragment?: (fragmentId: string, updates: Partial<OrderFragment>) => void;
}

export default function FragmentProgress({ fragments, onUpdateFragment }: FragmentProgressProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTotalProgress = () => {
    const totalValue = fragments.reduce((sum, f) => sum + f.value, 0);
    const completedValue = fragments
      .filter(f => f.status === 'completed')
      .reduce((sum, f) => sum + f.value, 0);
    return totalValue > 0 ? (completedValue / totalValue) * 100 : 0;
  };

  const getReleasedValue = () => {
    return fragments
      .filter(f => f.status === 'completed')
      .reduce((sum, f) => sum + f.value, 0);
  };

  const handleStartFragment = (fragmentId: string) => {
    onUpdateFragment?.(fragmentId, {
      status: 'in_production',
      startedAt: new Date()
    });
  };

  const handleCompleteFragment = (fragmentId: string) => {
    onUpdateFragment?.(fragmentId, {
      status: 'completed',
      progress: 100,
      completedAt: new Date()
    });
  };

  const statusColors = {
    pending: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    in_production: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-biobox-green/10 text-biobox-green border-biobox-green/20'
  };

  const statusLabels = {
    pending: 'Pendente',
    in_production: 'Em Produção',
    completed: 'Concluído'
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Resumo da Produção Fragmentada</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Fragmentos</p>
              <p className="text-2xl font-bold text-foreground">{fragments.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Progresso Geral</p>
              <p className="text-2xl font-bold text-foreground">{Math.round(getTotalProgress())}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor Liberado</p>
              <p className="text-2xl font-bold text-biobox-green">{formatCurrency(getReleasedValue())}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Concluídos</p>
              <p className="text-2xl font-bold text-foreground">
                {fragments.filter(f => f.status === 'completed').length}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso Total</span>
              <span>{Math.round(getTotalProgress())}%</span>
            </div>
            <Progress value={getTotalProgress()} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Fragments List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fragments.map((fragment) => (
          <Card key={fragment.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">Fragmento {fragment.fragmentNumber}</h4>
                  <p className="text-sm text-muted-foreground">
                    {fragment.quantity} unidades
                  </p>
                </div>
                <Badge 
                  variant="outline"
                  className={cn("text-xs", statusColors[fragment.status])}
                >
                  {statusLabels[fragment.status]}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(fragment.scheduledDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>

                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{formatCurrency(fragment.value)}</span>
                </div>

                {fragment.assignedOperator && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{fragment.assignedOperator}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progresso</span>
                    <span>{fragment.progress}%</span>
                  </div>
                  <Progress value={fragment.progress} className="h-2" />
                </div>

                {fragment.status === 'pending' && (
                  <Button
                    size="sm"
                    className="w-full bg-biobox-green hover:bg-biobox-green-dark"
                    onClick={() => handleStartFragment(fragment.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Produção
                  </Button>
                )}

                {fragment.status === 'in_production' && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleCompleteFragment(fragment.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Concluído
                  </Button>
                )}

                {fragment.status === 'completed' && fragment.completedAt && (
                  <div className="text-xs text-muted-foreground text-center">
                    Concluído em {format(fragment.completedAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}