import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  X, 
  Clock, 
  Users, 
  Wrench,
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { ProductionLine, Operator, ProductionStage, productionStages } from "@/types/production";

interface ProductionSettingsProps {
  onClose: () => void;
  onSave?: (settings: any) => void;
}

export default function ProductionSettings({ onClose, onSave }: ProductionSettingsProps) {
  const [settings, setSettings] = useState({
    workingHours: {
      start: '08:00',
      end: '18:00',
      lunchBreak: 60,
      shortBreaks: 15
    },
    targets: {
      dailyProduction: 12,
      weeklyProduction: 60,
      monthlyProduction: 240,
      qualityThreshold: 95
    },
    alerts: {
      delayWarning: true,
      qualityIssues: true,
      equipmentMaintenance: true,
      lowEfficiency: true,
      thresholdEfficiency: 80
    },
    automation: {
      autoAssignTasks: true,
      prioritizeUrgent: true,
      balanceWorkload: true,
      notifyDelays: true
    }
  });

  const [lines, setLines] = useState<ProductionLine[]>([
    {
      id: '1',
      name: 'Linha A - Camas Premium',
      status: 'active',
      efficiency: 95,
      dailyTarget: 3,
      dailyProduced: 2,
      lastUpdate: new Date()
    },
    {
      id: '2',
      name: 'Linha B - Camas Standard',
      status: 'active',
      efficiency: 92,
      dailyTarget: 4,
      dailyProduced: 3,
      lastUpdate: new Date()
    }
  ]);

  const [operators, setOperators] = useState<Operator[]>([
    {
      id: '1',
      name: 'Carlos Mendes',
      skills: ['cutting', 'carpentry', 'assembly'],
      experience: 8,
      efficiency: 95,
      status: 'available',
      shift: 'morning'
    },
    {
      id: '2',
      name: 'Ana Lima',
      skills: ['upholstery', 'sewing', 'finishing'],
      experience: 6,
      efficiency: 92,
      status: 'busy',
      shift: 'morning'
    }
  ]);

  const [stages, setStages] = useState<ProductionStage[]>(productionStages);

  const handleSaveSettings = () => {
    onSave?.({ settings, lines, operators, stages });
    onClose();
  };

  const addLine = () => {
    const newLine: ProductionLine = {
      id: Date.now().toString(),
      name: `Linha ${String.fromCharCode(65 + lines.length)}`,
      status: 'inactive',
      efficiency: 0,
      dailyTarget: 3,
      dailyProduced: 0,
      lastUpdate: new Date()
    };
    setLines(prev => [...prev, newLine]);
  };

  const updateLine = (id: string, updates: Partial<ProductionLine>) => {
    setLines(prev => prev.map(line => 
      line.id === id ? { ...line, ...updates, lastUpdate: new Date() } : line
    ));
  };

  const deleteLine = (id: string) => {
    setLines(prev => prev.filter(line => line.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configurações de Produção</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="lines">Linhas</TabsTrigger>
              <TabsTrigger value="operators">Operadores</TabsTrigger>
              <TabsTrigger value="stages">Etapas</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="bg-muted/5">
                <CardHeader>
                  <CardTitle className="text-base">Horário de Funcionamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Início do Expediente</Label>
                      <Input
                        type="time"
                        value={settings.workingHours.start}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, start: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Fim do Expediente</Label>
                      <Input
                        type="time"
                        value={settings.workingHours.end}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, end: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Pausa para Almoço (min)</Label>
                      <Input
                        type="number"
                        value={settings.workingHours.lunchBreak}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, lunchBreak: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Pausas Curtas (min)</Label>
                      <Input
                        type="number"
                        value={settings.workingHours.shortBreaks}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, shortBreaks: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/5">
                <CardHeader>
                  <CardTitle className="text-base">Metas de Produção</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Meta Diária (unidades)</Label>
                      <Input
                        type="number"
                        value={settings.targets.dailyProduction}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          targets: { ...prev.targets, dailyProduction: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Meta Semanal (unidades)</Label>
                      <Input
                        type="number"
                        value={settings.targets.weeklyProduction}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          targets: { ...prev.targets, weeklyProduction: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Meta Mensal (unidades)</Label>
                      <Input
                        type="number"
                        value={settings.targets.monthlyProduction}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          targets: { ...prev.targets, monthlyProduction: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Limite de Qualidade (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.targets.qualityThreshold}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          targets: { ...prev.targets, qualityThreshold: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lines" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Linhas de Produção</h3>
                <Button onClick={addLine} className="bg-biobox-green hover:bg-biobox-green-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Linha
                </Button>
              </div>
              
              <div className="space-y-4">
                {lines.map(line => (
                  <Card key={line.id} className="bg-muted/5">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Nome da Linha</Label>
                          <Input
                            value={line.name}
                            onChange={(e) => updateLine(line.id, { name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select 
                            value={line.status} 
                            onValueChange={(value: any) => updateLine(line.id, { status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativa</SelectItem>
                              <SelectItem value="inactive">Inativa</SelectItem>
                              <SelectItem value="maintenance">Manutenção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Meta Diária</Label>
                          <Input
                            type="number"
                            value={line.dailyTarget}
                            onChange={(e) => updateLine(line.id, { dailyTarget: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteLine(line.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="operators" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Operadores</h3>
                <Button className="bg-biobox-green hover:bg-biobox-green-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Operador
                </Button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {operators.map(operator => (
                  <Card key={operator.id} className="bg-muted/5">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <Label>Nome</Label>
                          <Input value={operator.name} readOnly />
                        </div>
                        <div>
                          <Label>Turno</Label>
                          <Select value={operator.shift}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Manhã</SelectItem>
                              <SelectItem value="afternoon">Tarde</SelectItem>
                              <SelectItem value="night">Noite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Habilidades</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {operator.skills.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stages" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Etapas de Produção</h3>
                <Button className="bg-biobox-green hover:bg-biobox-green-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Etapa
                </Button>
              </div>
              
              <div className="space-y-4">
                {stages.map(stage => (
                  <Card key={stage.id} className="bg-muted/5">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Nome da Etapa</Label>
                          <Input value={stage.name} readOnly />
                        </div>
                        <div>
                          <Label>Ordem</Label>
                          <Input type="number" value={stage.order} readOnly />
                        </div>
                        <div>
                          <Label>Tempo Estimado (min)</Label>
                          <Input type="number" value={stage.estimatedTime} readOnly />
                        </div>
                        <div>
                          <Label>Habilidades Necessárias</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {stage.requiredSkills.map(skill => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label>Descrição</Label>
                        <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings} className="bg-biobox-green hover:bg-biobox-green-dark">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}