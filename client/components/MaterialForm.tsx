import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Save, Calendar as CalendarIcon, Box } from "lucide-react";
import { RawMaterial, materialCategoryLabels, unitLabels } from "@/types/inventory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MaterialFormProps {
  material?: RawMaterial;
  onSave: (material: Partial<RawMaterial>) => void;
  onCancel: () => void;
}

export default function MaterialForm({ material, onSave, onCancel }: MaterialFormProps) {
  const [formData, setFormData] = useState({
    name: material?.name || '',
    category: material?.category || 'wood' as RawMaterial['category'],
    unit: material?.unit || 'pieces' as RawMaterial['unit'],
    quantity: material?.quantity || 0,
    minimumStock: material?.minimumStock || 10,
    unitCost: material?.unitCost || 0,
    supplier: material?.supplier || '',
    location: material?.location || '',
    expirationDate: material?.expirationDate || undefined
  });

  const [showCalendar, setShowCalendar] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const materialData: Partial<RawMaterial> = {
      ...formData,
      lastUpdated: new Date()
    };

    onSave(materialData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateTotalValue = () => {
    return formData.quantity * formData.unitCost;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Box className="h-5 w-5" />
              <span>{material ? 'Editar Material' : 'Nova Matéria Prima'}</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Material</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: MDF 18mm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wood">Madeira</SelectItem>
                    <SelectItem value="foam">Espuma</SelectItem>
                    <SelectItem value="fabric">Tecido</SelectItem>
                    <SelectItem value="hardware">Ferragens</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meters">Metros</SelectItem>
                    <SelectItem value="pieces">Peças</SelectItem>
                    <SelectItem value="liters">Litros</SelectItem>
                    <SelectItem value="kg">Quilos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minimumStock">Estoque Mínimo</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumStock: parseFloat(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitCost">Custo Unitário</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Nome do fornecedor"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Localização no Estoque</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Estoque A - Prateleira 1"
                required
              />
            </div>

            <div>
              <Label>Data de Validade (opcional)</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expirationDate 
                      ? format(formData.expirationDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar data (opcional)"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expirationDate}
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, expirationDate: date }));
                      setShowCalendar(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="p-4 bg-muted/5 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Material</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Valor Total em Estoque</p>
                  <p className="font-medium text-biobox-green">{formatCurrency(calculateTotalValue())}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Categoria</p>
                  <p className="font-medium">{materialCategoryLabels[formData.category]}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-biobox-green hover:bg-biobox-green-dark"
                disabled={!formData.name || !formData.supplier}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Material
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}