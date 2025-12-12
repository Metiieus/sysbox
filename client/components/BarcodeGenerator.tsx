import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Barcode, 
  Download, 
  Printer, 
  Copy,
  RefreshCw,
  Package,
  Calendar,
  User
} from "lucide-react";

interface BarcodeItem {
  id: string;
  code: string;
  type: 'product' | 'order' | 'material';
  name: string;
  description?: string;
  generated: boolean;
}

interface BarcodeGeneratorProps {
  items?: BarcodeItem[];
  onGenerate?: (items: BarcodeItem[]) => void;
}

export default function BarcodeGenerator({ items = [], onGenerate }: BarcodeGeneratorProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [barcodeType, setBarcodeType] = useState<'EAN13' | 'CODE128' | 'QR'>('CODE128');
  const [includeText, setIncludeText] = useState(true);
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [generatedCodes, setGeneratedCodes] = useState<Record<string, string>>({});

  // Mock items if none provided
  const mockItems: BarcodeItem[] = items.length > 0 ? items : [
    {
      id: '1',
      code: '7891234567890',
      type: 'product',
      name: 'Cama Luxo Premium - Queen',
      description: 'Modelo Standard, Branco, Courino',
      generated: false
    },
    {
      id: '2',
      code: 'ORD-2024-001',
      type: 'order',
      name: 'Pedido #ORD-2024-001',
      description: 'João Silva - 1x Cama Queen Luxo',
      generated: false
    },
    {
      id: '3',
      code: 'MAT-MDF-001',
      type: 'material',
      name: 'MDF 18mm',
      description: 'Madeireira São João - Lote 2024-12',
      generated: false
    },
    {
      id: '4',
      code: '7891234567891',
      type: 'product',
      name: 'Cama Standard - Casal',
      description: 'Modelo Basic, Marrom, Tecido',
      generated: false
    },
    {
      id: '5',
      code: 'ORD-2024-002',
      type: 'order',
      name: 'Pedido #ORD-2024-002',
      description: 'Móveis Premium Ltda - 3x Cama King',
      generated: false
    }
  ];

  const generateBarcode = (code: string, type: string) => {
    // Simulate barcode generation
    return `||||| || ||| | || ||||| | ||| || |||||`;
  };

  const generateQRCode = (code: string) => {
    // Simulate QR code generation with ASCII
    return [
      "█▀▀▀▀▀█ ▀▀█▀▀ █▀▀▀▀▀█",
      "█ ███ █ █▀▀█▀ █ ███ █",
      "█ ▀▀▀ █ ██ ██ █ ▀▀▀ █",
      "▀▀▀▀▀▀▀ ▀ ▀ ▀ ▀▀▀▀▀▀▀",
      "▀██▀▀▀▀██▀█▀▀█▀▀██▀▀▀",
      "██▀▀██▀█▀▀▀██▀▀▀█▀▀██",
      "▀▀▀▀▀▀▀ ▀ ██▀█▀▀▀█▀▀█",
      "█▀▀▀▀▀█ ██▀█▀█▀██▀▀██",
      "█ ███ █ █▀▀▀▀▀▀▀▀▀▀▀█",
      "█ ▀▀▀ █ ██▀▀██▀▀██▀██",
      "▀▀▀▀▀▀▀ ▀▀▀▀▀▀▀▀▀▀▀▀▀"
    ].join('\n');
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(mockItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleGenerate = () => {
    const newGeneratedCodes: Record<string, string> = {};
    selectedItems.forEach(itemId => {
      const item = mockItems.find(i => i.id === itemId);
      if (item) {
        if (barcodeType === 'QR') {
          newGeneratedCodes[itemId] = generateQRCode(item.code);
        } else {
          newGeneratedCodes[itemId] = generateBarcode(item.code, barcodeType);
        }
      }
    });
    setGeneratedCodes(newGeneratedCodes);
    
    if (onGenerate) {
      const updatedItems = mockItems.map(item => ({
        ...item,
        generated: selectedItems.includes(item.id)
      }));
      onGenerate(updatedItems);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const getTypeIcon = (type: BarcodeItem['type']) => {
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'order':
        return <Calendar className="h-4 w-4" />;
      case 'material':
        return <QrCode className="h-4 w-4" />;
      default:
        return <Barcode className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: BarcodeItem['type']) => {
    switch (type) {
      case 'product':
        return 'Produto';
      case 'order':
        return 'Pedido';
      case 'material':
        return 'Material';
      default:
        return 'Item';
    }
  };

  const getTypeColor = (type: BarcodeItem['type']) => {
    switch (type) {
      case 'product':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'order':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'material':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Configurações de Geração</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="barcode-type">Tipo de Código</Label>
              <Select value={barcodeType} onValueChange={(value: any) => setBarcodeType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CODE128">CODE 128</SelectItem>
                  <SelectItem value="EAN13">EAN-13</SelectItem>
                  <SelectItem value="QR">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="label-size">Tamanho da Etiqueta</Label>
              <Select value={labelSize} onValueChange={(value: any) => setLabelSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequena (30x20mm)</SelectItem>
                  <SelectItem value="medium">Média (50x30mm)</SelectItem>
                  <SelectItem value="large">Grande (70x40mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox 
                id="include-text" 
                checked={includeText}
                onCheckedChange={setIncludeText}
              />
              <Label htmlFor="include-text" className="text-sm">
                Incluir texto legível
              </Label>
            </div>
            <div className="pt-6">
              <Button 
                onClick={handleGenerate}
                disabled={selectedItems.length === 0}
                className="w-full bg-biobox-green hover:bg-biobox-green-dark"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar Códigos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Selection */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Barcode className="h-5 w-5" />
              <span>Selecionar Itens</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={selectedItems.length === mockItems.length}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">Selecionar todos</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockItems.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/5 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                  />
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item.type)}
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getTypeColor(item.type)}>
                    {getTypeLabel(item.type)}
                  </Badge>
                  <div className="text-xs text-muted-foreground font-mono">
                    {item.code}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Codes */}
      {Object.keys(generatedCodes).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>Códigos Gerados</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(generatedCodes).map(([itemId, code]) => {
                const item = mockItems.find(i => i.id === itemId);
                if (!item) return null;

                return (
                  <Card key={itemId} className="bg-muted/5 border-dashed">
                    <CardContent className="p-4 text-center">
                      <div className="mb-3">
                        <Badge variant="outline" className={getTypeColor(item.type)}>
                          {getTypeLabel(item.type)}
                        </Badge>
                      </div>
                      
                      <div className="bg-white p-4 rounded border mb-3">
                        {barcodeType === 'QR' ? (
                          <pre className="text-xs font-mono leading-none">
                            {code}
                          </pre>
                        ) : (
                          <div className="space-y-2">
                            <div className="font-mono text-xs tracking-widest">
                              {code}
                            </div>
                            {includeText && (
                              <div className="text-xs font-mono">
                                {item.code}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.code}</div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => handleCopyCode(item.code)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
