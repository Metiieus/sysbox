import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  Play,
  Pause,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { productionStages } from "@/types/production";

interface ProductionStage {
  stage: string;
  status: "pending" | "in_progress" | "completed";
  started_at?: string;
  completed_at?: string;
  assigned_operator?: string;
  notes?: string;
}

interface ProductionStagesTrackerProps {
  orderId: string;
  orderNumber: string;
  stages: ProductionStage[];
  onUpdateStage: (stageId: string, updates: Partial<ProductionStage>) => Promise<void>;
  operators?: { id: string; name: string }[];
}

export default function ProductionStagesTracker({
  orderId,
  orderNumber,
  stages = [],
  onUpdateStage,
  operators = [],
}: ProductionStagesTrackerProps) {
  const [selectedStage, setSelectedStage] = useState<ProductionStage | null>(null);
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [stageNotes, setStageNotes] = useState("");

  // Garantir que todas as etapas existam
  const allStages = productionStages.map((stage) => {
    const existingStage = stages.find((s) => s.stage === stage.id);
    return (
      existingStage || {
        stage: stage.id,
        status: "pending" as const,
      }
    );
  });

  const completedStages = allStages.filter((s) => s.status === "completed").length;
  const progress = Math.round((completedStages / productionStages.length) * 100);

  const getStageIcon = (status: ProductionStage["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageColor = (status: ProductionStage["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const handleStartStage = async (stage: ProductionStage) => {
    setSelectedStage(stage);
    setStageNotes(stage.notes || "");
    setShowStageDialog(true);
  };

  const handleUpdateStage = async (newStatus: ProductionStage["status"]) => {
    if (!selectedStage) return;

    const updates: Partial<ProductionStage> = {
      status: newStatus,
      notes: stageNotes,
    };

    if (newStatus === "in_progress" && !selectedStage.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (newStatus === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    await onUpdateStage(selectedStage.stage, updates);
    setShowStageDialog(false);
    setSelectedStage(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Etapas de Produção</CardTitle>
            <Badge variant="outline" className="text-sm">
              {completedStages}/{productionStages.length} concluídas
            </Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allStages.map((stage, index) => {
              const stageInfo = productionStages.find((s) => s.id === stage.stage);
              if (!stageInfo) return null;

              return (
                <div
                  key={stage.stage}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStageIcon(stage.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {index + 1}. {stageInfo.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getStageColor(stage.status))}
                        >
                          {stage.status === "completed"
                            ? "Concluído"
                            : stage.status === "in_progress"
                              ? "Em Andamento"
                              : "Pendente"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stageInfo.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {stage.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartStage(stage)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    {stage.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStartStage(stage)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Concluir
                      </Button>
                    )}
                    {stage.status === "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartStage(stage)}
                      >
                        Ver Detalhes
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para gerenciar etapa */}
      <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStage &&
                productionStages.find((s) => s.id === selectedStage.stage)?.name}
            </DialogTitle>
            <DialogDescription>
              Pedido: {orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Observações</Label>
              <Textarea
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder="Adicione observações sobre esta etapa..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              {selectedStage?.status === "pending" && (
                <Button onClick={() => handleUpdateStage("in_progress")}>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Etapa
                </Button>
              )}
              {selectedStage?.status === "in_progress" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStage("pending")}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                  <Button
                    onClick={() => handleUpdateStage("completed")}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Concluir Etapa
                  </Button>
                </>
              )}
              {selectedStage?.status === "completed" && (
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStage("in_progress")}
                >
                  Reabrir Etapa
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

