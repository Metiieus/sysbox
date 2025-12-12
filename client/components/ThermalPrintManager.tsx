import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Printer, 
  Settings, 
  Download, 
  Eye,
  RefreshCw,
  Package,
  Calendar,
  User,
  Wifi,
  Usb,
  Bluetooth
} from "lucide-react";

interface ThermalPrintSettings {
  printerType: 'thermal' | 'laser' | 'inkjet';
  paperWidth: '58mm' | '80mm' | '110mm';
  density: 'light' | 'medium' | 'dark';
  speed: 'slow' | 'medium' | 'fast';
  connection: 'usb' | 'bluetooth' | 'wifi' | 'ethernet';
  copies: number;
  cutAfterPrint: boolean;
  includeDate: boolean;
  includeCompanyLogo: boolean;
}

interface PrintItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'product' | 'order' | 'material';
  quantity: number;
}

export default function ThermalPrintManager() {
  const [settings, setSettings] = useState<ThermalPrintSettings>({
    printerType: 'thermal',
    paperWidth: '80mm',
    density: 'medium',
    speed: 'medium',
    connection: 'usb',
    copies: 1,
    cutAfterPrint: true,
    includeDate: true,
    includeCompanyLogo: true
  });

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const mockItems: PrintItem[] = [
    {
      id: '1',
      code: 'BED-LUX-001',
      name: 'Cama Luxo Premium Queen',
      description: 'Courino Branco, Cabeceira Estofada',
      type: 'product',
      quantity: 1
    },
    {
      id: '2',
      code: 'ORD-2024-001',
      name: 'Pedido João Silva',
      description: 'Entrega: 20/12/2024',
      type: 'order',
      quantity: 1
    },
    {
      id: '3',
      code: 'MAT-MDF-18',
      name: 'MDF 18mm Branco',
      description: 'Lote: 2024-12-001',
      type: 'material',
      quantity: 5
    }
  ];

  const handleSettingChange = (key: keyof ThermalPrintSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const generateThermalLabel = (item: PrintItem) => {
    const width = settings.paperWidth === '58mm' ? 32 : settings.paperWidth === '80mm' ? 48 : 64;
    
    let label = '';
    
    // Header with company info
    if (settings.includeCompanyLogo) {
      label += '='.repeat(width) + '\\n';
      label += ' '.repeat(Math.floor((width - 8) / 2)) + 'BIOBOX\\n';
      label += ' '.repeat(Math.floor((width - 16) / 2)) + 'Sistema de Produção\\n';
      label += '='.repeat(width) + '\\n\\n';
    }
    
    // Item info
    label += `CÓDIGO: ${item.code}\\n`;
    label += `ITEM: ${item.name}\\n`;
    if (item.description) {
      label += `DESC: ${item.description}\\n`;
    }
    label += `QTD: ${item.quantity}\\n`;
    
    // Barcode simulation
    label += '\\n';
    label += '||||| || ||| | || ||||| | ||| || |||||\\n';
    label += ' '.repeat(Math.floor((width - item.code.length) / 2)) + item.code + '\\n';
    
    // Date and custom text
    if (settings.includeDate) {
      const date = new Date().toLocaleDateString('pt-BR');
      label += `\\nDATA: ${date}\\n`;
    }
    
    if (customText.trim()) {
      label += `\\n${customText}\\n`;
    }
    
    label += '\\n' + '-'.repeat(width) + '\\n';
    
    return label;
  };

  const handlePrint = async () => {
    const selectedItemsData = mockItems.filter(item => selectedItems.includes(item.id));
    
    if (selectedItemsData.length === 0) {
      alert('Selecione pelo menos um item para imprimir');
      return;
    }

    // Simulate printing process
    console.log('Configurações de impressão:', settings);
    console.log('Itens selecionados:', selectedItemsData);
    
    for (let copy = 1; copy <= settings.copies; copy++) {
      for (const item of selectedItemsData) {
        const label = generateThermalLabel(item);
        console.log(`Imprimindo cópia ${copy} do item ${item.name}:`);
        console.log(label);
      }
    }
    
    alert(`Enviado para impressão: ${selectedItemsData.length} etiqueta(s) x ${settings.copies} cópia(s)`);
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  const getConnectionIcon = (connection: string) => {
    switch (connection) {
      case 'wifi':
        return <Wifi className="h-4 w-4" />;
      case 'bluetooth':
        return <Bluetooth className="h-4 w-4" />;
      case 'usb':
        return <Usb className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Printer Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Printer className="h-5 w-5" />
            <span>Configurações da Impressora Térmica</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label>Largura do Papel</Label>
              <Select 
                value={settings.paperWidth} 
                onValueChange={(value: any) => handleSettingChange('paperWidth', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (Bobina Pequena)</SelectItem>
                  <SelectItem value="80mm">80mm (Bobina Padrão)</SelectItem>
                  <SelectItem value="110mm">110mm (Bobina Grande)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Densidade</Label>
              <Select 
                value={settings.density} 
                onValueChange={(value: any) => handleSettingChange('density', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Leve</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="dark">Escura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Velocidade</Label>
              <Select 
                value={settings.speed} 
                onValueChange={(value: any) => handleSettingChange('speed', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Lenta (Melhor qualidade)</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="fast">Rápida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Conexão</Label>
              <Select 
                value={settings.connection} 
                onValueChange={(value: any) => handleSettingChange('connection', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usb">
                    <div className="flex items-center space-x-2">
                      <Usb className="h-4 w-4" />
                      <span>USB</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bluetooth">
                    <div className="flex items-center space-x-2">
                      <Bluetooth className="h-4 w-4" />
                      <span>Bluetooth</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="wifi">
                    <div className="flex items-center space-x-2">
                      <Wifi className="h-4 w-4" />
                      <span>Wi-Fi</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Cópias</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={settings.copies}
                onChange={(e) => handleSettingChange('copies', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={settings.cutAfterPrint}
                onCheckedChange={(checked) => handleSettingChange('cutAfterPrint', checked)}
              />
              <Label className="text-sm">Cortar após impressão</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={settings.includeDate}
                onCheckedChange={(checked) => handleSettingChange('includeDate', checked)}
              />
              <Label className="text-sm">Incluir data</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={settings.includeCompanyLogo}
                onCheckedChange={(checked) => handleSettingChange('includeCompanyLogo', checked)}
              />
              <Label className="text-sm">Incluir cabeçalho da empresa</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Text */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Texto Personalizado</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Digite um texto adicional para incluir nas etiquetas (opcional)"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Item Selection */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Selecionar Itens para Impressão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockItems.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                  />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                    <div className="text-xs text-muted-foreground font-mono">{item.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    {item.type === 'product' ? 'Produto' : 
                     item.type === 'order' ? 'Pedido' : 'Material'}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    Qtd: {item.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {previewMode && selectedItems.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Pré-visualização da Etiqueta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border-2 border-dashed border-gray-300 p-4 font-mono text-xs">
              {mockItems
                .filter(item => selectedItems.includes(item.id))
                .map(item => (
                  <pre key={item.id} className="whitespace-pre-wrap mb-4">
                    {generateThermalLabel(item)}
                  </pre>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        <Button 
          onClick={handlePreview}
          variant="outline"
          disabled={selectedItems.length === 0}
        >
          <Eye className="h-4 w-4 mr-2" />
          {previewMode ? 'Ocultar' : 'Visualizar'} Pré-visualização
        </Button>
        
        <Button 
          onClick={handlePrint}
          disabled={selectedItems.length === 0}
          className="bg-biobox-green hover:bg-biobox-green-dark"
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Etiquetas ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})
        </Button>
      </div>
    </div>
  );
}

