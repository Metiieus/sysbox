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
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product } from "@/types/inventory";
import { Plus, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Função para aceitar apenas números
const parseNumericInput = (input: string): number => {
  const cleaned = input.replace(/\D/g, "");
  return cleaned ? parseInt(cleaned) : 0;
};

export interface ProductFormValues {
  name: string;
  sku: string;
  category: "bed" | "pillow" | "protector" | "accessory";
  description: string;
  basePrice: number;
  costPrice: number;
  margin: number;
  status: "active" | "inactive" | "discontinued";
  modelName?: string;
  stockQuantity: number;
  minimumStock: number;
  barcode?: string;
  sizes: Array<{ id: string; name: string }>;
  colors: Array<{ id: string; name: string; hex?: string }>;
  fabrics: Array<{ id: string; name: string }>;
}

interface ProductFormProps {
  product?: Product | null;
  onSave: (data: ProductFormValues) => void | Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export default function ProductForm({
  product,
  onSave,
  onCancel,
  saving,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormValues>({
    name: product?.name || "",
    sku: product?.sku || "",
    category: product?.category || "bed",
    description: product?.description || "",
    basePrice: product?.basePrice || 0,
    costPrice: product?.costPrice || 0,
    margin: product?.margin || 0,
    status: product?.status || "active",
    modelName: product?.models?.[0]?.name || "Standard",
    stockQuantity: product?.models?.[0]?.stockQuantity || 0,
    minimumStock: product?.models?.[0]?.minimumStock || 0,
    barcode: product?.barcode || "",
    sizes: product?.models?.[0]?.sizes || [],
    colors: product?.models?.[0]?.colors || [],
    fabrics: product?.models?.[0]?.fabrics || [],
  });

  // Estados para adicionar tamanhos, cores e tecidos
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newFabric, setNewFabric] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const addSize = () => {
    if (newSize.trim()) {
      setFormData((prev) => ({
        ...prev,
        sizes: [
          ...prev.sizes,
          { id: `size-${Date.now()}`, name: newSize.trim() },
        ],
      }));
      setNewSize("");
    }
  };

  const removeSize = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((s) => s.id !== id),
    }));
  };

  const addColor = () => {
    if (newColor.trim()) {
      setFormData((prev) => ({
        ...prev,
        colors: [
          ...prev.colors,
          {
            id: `color-${Date.now()}`,
            name: newColor.trim(),
            hex: newColorHex,
          },
        ],
      }));
      setNewColor("");
      setNewColorHex("#000000");
    }
  };

  const removeColor = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c.id !== id),
    }));
  };

  const addFabric = () => {
    if (newFabric.trim()) {
      setFormData((prev) => ({
        ...prev,
        fabrics: [
          ...prev.fabrics,
          { id: `fabric-${Date.now()}`, name: newFabric.trim() },
        ],
      }));
      setNewFabric("");
    }
  };

  const removeFabric = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      fabrics: prev.fabrics.filter((f) => f.id !== id),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        {/* Nome */}
        <div className="col-span-2">
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ex: Cama Box Casal"
            required
          />
        </div>

        {/* SKU */}
        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, sku: e.target.value }))
            }
            placeholder="Ex: CB-001"
            required
          />
        </div>

        {/* Código de Barras */}
        <div>
          <Label htmlFor="barcode">Código de Barras</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, barcode: e.target.value }))
            }
            placeholder="Ex: 7891234567890"
          />
        </div>

        {/* Categoria */}
        <div>
          <Label htmlFor="category">Categoria *</Label>
          <Select
            value={formData.category}
            onValueChange={(value: any) =>
              setFormData((prev) => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bed">Cama</SelectItem>
              <SelectItem value="pillow">Travesseiro</SelectItem>
              <SelectItem value="protector">Protetor</SelectItem>
              <SelectItem value="accessory">Acessório</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) =>
              setFormData((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="discontinued">Descontinuado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Descrição */}
        <div className="col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Descreva o produto..."
            rows={3}
          />
        </div>

        {/* Preço Base */}
        <div>
          <Label htmlFor="basePrice">Preço Base (R$) *</Label>
          <Input
            id="basePrice"
            type="text"
            inputMode="numeric"
            value={formData.basePrice}
            onChange={(e) => {
              const numericValue = parseNumericInput(e.target.value);
              setFormData((prev) => ({ ...prev, basePrice: numericValue }));
            }}
            placeholder="0"
            required
          />
        </div>

        {/* Custo */}
        <div>
          <Label htmlFor="costPrice">Custo (R$) *</Label>
          <Input
            id="costPrice"
            type="text"
            inputMode="numeric"
            value={formData.costPrice}
            onChange={(e) => {
              const numericValue = parseNumericInput(e.target.value);
              setFormData((prev) => ({ ...prev, costPrice: numericValue }));
            }}
            placeholder="0"
            required
          />
        </div>

        {/* Margem */}
        <div>
          <Label htmlFor="margin">Margem (%)</Label>
          <Input
            id="margin"
            type="text"
            inputMode="numeric"
            value={formData.margin}
            onChange={(e) => {
              const numericValue = parseNumericInput(e.target.value);
              setFormData((prev) => ({ ...prev, margin: numericValue }));
            }}
            placeholder="0"
          />
        </div>

        {/* Nome do Modelo */}
        <div>
          <Label htmlFor="modelName">Nome do Modelo</Label>
          <Input
            id="modelName"
            value={formData.modelName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, modelName: e.target.value }))
            }
            placeholder="Ex: Standard"
          />
        </div>

        {/* Estoque Inicial */}
        <div>
          <Label htmlFor="stockQuantity">Estoque Inicial</Label>
          <Input
            id="stockQuantity"
            type="number"
            min="0"
            value={formData.stockQuantity}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                stockQuantity: parseInt(e.target.value) || 0,
              }))
            }
          />
        </div>

        {/* Estoque Mínimo */}
        <div>
          <Label htmlFor="minimumStock">Estoque Mínimo</Label>
          <Input
            id="minimumStock"
            type="number"
            min="0"
            value={formData.minimumStock}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                minimumStock: parseInt(e.target.value) || 0,
              }))
            }
          />
        </div>
      </div>

      {/* TAMANHOS */}
      <div className="space-y-2">
        <Label>Tamanhos Disponíveis</Label>
        <div className="flex gap-2">
          <Input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            placeholder="Ex: Solteiro, Casal, Queen, King"
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addSize())
            }
          />
          <Button type="button" onClick={addSize} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.sizes.map((size) => (
            <Badge key={size.id} variant="secondary" className="pl-3 pr-1">
              {size.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => removeSize(size.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>

      {/* CORES */}
      <div className="space-y-2">
        <Label>Cores Disponíveis</Label>
        <div className="flex gap-2">
          <Input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="Ex: Branco, Azul, Verde"
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addColor())
            }
            className="flex-1"
          />
          <Input
            type="color"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="w-20"
          />
          <Button type="button" onClick={addColor} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.colors.map((color) => (
            <Badge key={color.id} variant="secondary" className="pl-3 pr-1">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: color.hex || "#000" }}
              />
              {color.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => removeColor(color.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>

      {/* TECIDOS */}
      <div className="space-y-2">
        <Label>Tecidos Disponíveis</Label>
        <div className="flex gap-2">
          <Input
            value={newFabric}
            onChange={(e) => setNewFabric(e.target.value)}
            placeholder="Ex: Algodão, Linho, Poliéster"
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addFabric())
            }
          />
          <Button type="button" onClick={addFabric} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.fabrics.map((fabric) => (
            <Badge key={fabric.id} variant="secondary" className="pl-3 pr-1">
              {fabric.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => removeFabric(fabric.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-biobox-green hover:bg-biobox-green-dark"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Produto"
          )}
        </Button>
      </div>
    </form>
  );
}

export type { ProductFormValues };
