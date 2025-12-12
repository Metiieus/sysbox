export interface Product {
  id: string;
  name: string;
  category: 'bed' | 'mattress' | 'accessory';
  sku: string;
  barcode?: string;
  description: string;
  basePrice: number;
  costPrice: number;
  margin: number;
  status: 'active' | 'inactive' | 'discontinued';
  models: ProductModel[];
  specifications: ProductSpecification[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductModel {
  id: string;
  name: string;
  sizes: ProductSize[];
  colors: ProductColor[];
  fabrics: ProductFabric[];
  priceModifier: number;
  stockQuantity: number;
  minimumStock: number;
  isActive: boolean;
}

export interface ProductSize {
  id: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  priceModifier: number;
}

export interface ProductColor {
  id: string;
  name: string;
  hexCode: string;
  priceModifier: number;
}

export interface ProductFabric {
  id: string;
  name: string;
  type: 'courino' | 'tecido' | 'veludo' | 'couro';
  priceModifier: number;
}

export interface ProductSpecification {
  id: string;
  name: string;
  options: string[];
  required: boolean;
  priceModifiers?: Record<string, number>;
}

export interface InventoryItem {
  id: string;
  productId: string;
  modelId: string;
  sizeId: string;
  colorId: string;
  fabricId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStock: number;
  location: string;
  lastUpdated: Date;
  movements: InventoryMovement[];
}

export interface InventoryMovement {
  id: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  reference?: string; // Order number, supplier, etc.
  operator: string;
  timestamp: Date;
  notes?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  category: 'wood' | 'foam' | 'fabric' | 'hardware' | 'other';
  unit: 'meters' | 'pieces' | 'liters' | 'kg';
  quantity: number;
  minimumStock: number;
  unitCost: number;
  supplier: string;
  location: string;
  expirationDate?: Date;
  lastUpdated: Date;
}

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Cama Luxo Premium',
    category: 'bed',
    sku: 'BED-LUX-001',
    barcode: '7891234567890',
    description: 'Cama de alta qualidade com acabamento premium e estrutura reforçada',
    basePrice: 2500.00,
    costPrice: 1200.00,
    margin: 52,
    status: 'active',
    images: ['/placeholder.svg'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-15'),
    models: [
      {
        id: 'model-1',
        name: 'Standard',
        priceModifier: 1.0,
        stockQuantity: 15,
        minimumStock: 5,
        isActive: true,
        sizes: [
          {
            id: 'size-1',
            name: 'Solteiro',
            dimensions: { width: 88, height: 188, depth: 30 },
            priceModifier: 0.8
          },
          {
            id: 'size-2',
            name: 'Casal',
            dimensions: { width: 138, height: 188, depth: 30 },
            priceModifier: 1.0
          },
          {
            id: 'size-3',
            name: 'Queen',
            dimensions: { width: 158, height: 198, depth: 30 },
            priceModifier: 1.2
          },
          {
            id: 'size-4',
            name: 'King',
            dimensions: { width: 193, height: 203, depth: 30 },
            priceModifier: 1.5
          }
        ],
        colors: [
          { id: 'color-1', name: 'Branco', hexCode: '#FFFFFF', priceModifier: 1.0 },
          { id: 'color-2', name: 'Marrom', hexCode: '#8B4513', priceModifier: 1.0 },
          { id: 'color-3', name: 'Preto', hexCode: '#000000', priceModifier: 1.05 },
          { id: 'color-4', name: 'Cinza', hexCode: '#808080', priceModifier: 1.0 }
        ],
        fabrics: [
          { id: 'fabric-1', name: 'Courino', type: 'courino', priceModifier: 1.0 },
          { id: 'fabric-2', name: 'Tecido Premium', type: 'tecido', priceModifier: 1.1 },
          { id: 'fabric-3', name: 'Veludo', type: 'veludo', priceModifier: 1.3 }
        ]
      }
    ],
    specifications: [
      {
        id: 'spec-1',
        name: 'Estrutura',
        options: ['MDF', 'Madeira Maciça'],
        required: true,
        priceModifiers: { 'Madeira Maciça': 1.2 }
      },
      {
        id: 'spec-2',
        name: 'Cabeceira',
        options: ['Lisa', 'Estofada', 'Capitonê'],
        required: true,
        priceModifiers: { 'Capitonê': 1.15 }
      }
    ]
  },
  {
    id: 'prod-2',
    name: 'Cama Standard',
    category: 'bed',
    sku: 'BED-STD-001',
    barcode: '7891234567891',
    description: 'Cama com excelente custo-benefício para o dia a dia',
    basePrice: 1800.00,
    costPrice: 900.00,
    margin: 50,
    status: 'active',
    images: ['/placeholder.svg'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-12-10'),
    models: [
      {
        id: 'model-2',
        name: 'Basic',
        priceModifier: 1.0,
        stockQuantity: 25,
        minimumStock: 8,
        isActive: true,
        sizes: [
          {
            id: 'size-1',
            name: 'Solteiro',
            dimensions: { width: 88, height: 188, depth: 25 },
            priceModifier: 0.8
          },
          {
            id: 'size-2',
            name: 'Casal',
            dimensions: { width: 138, height: 188, depth: 25 },
            priceModifier: 1.0
          },
          {
            id: 'size-3',
            name: 'Queen',
            dimensions: { width: 158, height: 198, depth: 25 },
            priceModifier: 1.2
          }
        ],
        colors: [
          { id: 'color-1', name: 'Branco', hexCode: '#FFFFFF', priceModifier: 1.0 },
          { id: 'color-2', name: 'Marrom', hexCode: '#8B4513', priceModifier: 1.0 }
        ],
        fabrics: [
          { id: 'fabric-1', name: 'Courino', type: 'courino', priceModifier: 1.0 },
          { id: 'fabric-2', name: 'Tecido', type: 'tecido', priceModifier: 1.05 }
        ]
      }
    ],
    specifications: [
      {
        id: 'spec-1',
        name: 'Estrutura',
        options: ['MDF'],
        required: true
      },
      {
        id: 'spec-2',
        name: 'Cabeceira',
        options: ['Lisa', 'Estofada'],
        required: true
      }
    ]
  }
];

export const mockRawMaterials: RawMaterial[] = [
  {
    id: 'mat-1',
    name: 'MDF 18mm',
    category: 'wood',
    unit: 'pieces',
    quantity: 50,
    minimumStock: 20,
    unitCost: 45.00,
    supplier: 'Madeireira São João',
    location: 'Estoque A - Prateleira 1',
    lastUpdated: new Date()
  },
  {
    id: 'mat-2',
    name: 'Espuma D33',
    category: 'foam',
    unit: 'pieces',
    quantity: 25,
    minimumStock: 15,
    unitCost: 35.00,
    supplier: 'Espumas Brasil',
    location: 'Estoque B - Área 2',
    lastUpdated: new Date()
  },
  {
    id: 'mat-3',
    name: 'Courino Branco',
    category: 'fabric',
    unit: 'meters',
    quantity: 120,
    minimumStock: 50,
    unitCost: 8.50,
    supplier: 'Tecidos Premium',
    location: 'Estoque C - Prateleira 3',
    lastUpdated: new Date()
  },
  {
    id: 'mat-4',
    name: 'Parafusos 6x40mm',
    category: 'hardware',
    unit: 'pieces',
    quantity: 500,
    minimumStock: 200,
    unitCost: 0.15,
    supplier: 'Ferragens Central',
    location: 'Estoque D - Gaveta 1',
    lastUpdated: new Date()
  }
];

export const categoryLabels = {
  bed: 'Camas',
  mattress: 'Colchões',
  accessory: 'Acessórios'
};

export const statusLabels = {
  active: 'Ativo',
  inactive: 'Inativo',
  discontinued: 'Descontinuado'
};

export const statusColors = {
  active: 'bg-biobox-green/10 text-biobox-green border-biobox-green/20',
  inactive: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  discontinued: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export const materialCategoryLabels = {
  wood: 'Madeira',
  foam: 'Espuma',
  fabric: 'Tecido',
  hardware: 'Ferragens',
  other: 'Outros'
};

export const unitLabels = {
  meters: 'Metros',
  pieces: 'Peças',
  liters: 'Litros',
  kg: 'Quilos'
};
