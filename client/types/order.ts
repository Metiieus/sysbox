export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerTradeName?: string;
  paymentCondition?: string;
  representative?: string;
  sellerId: string;
  sellerName: string;
  products: OrderProduct[];
  status:
    | "pending"
    | "confirmed"
    | "in_production"
    | "quality_check"
    | "ready"
    | "delivered"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  totalAmount: number;
  scheduledDate: Date;
  deliveryDate?: Date;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  productionProgress: number;
  assignedOperator?: string;
  isFragmented?: boolean;
  fragments?: OrderFragment[];
  totalQuantity?: number;
  productFragmentedBalance?: Record<string, number>; // productId -> remaining quantity
}

export interface OrderFragment {
  id: string;
  orderId: string;
  productId: string;
  productName?: string;
  size?: string;
  color?: string;
  fragmentNumber: number;
  quantity: number;
  scheduledDate: Date;
  status: "pending" | "in_production" | "completed";
  progress: number;
  value: number;
  assignedOperator?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface OrderProduct {
  id: string;
  productId: string;
  productName: string;
  model: string;
  size: string;
  color: string;
  fabric: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  category: "bed" | "mattress" | "accessory";
  models: ProductModel[];
  basePrice: number;
  description: string;
  specifications: Record<string, string[]>;
}

export interface ProductModel {
  id: string;
  name: string;
  sizes: string[];
  colors: string[];
  fabrics: string[];
  priceModifier: number;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Cama Luxo",
    category: "bed",
    basePrice: 2500.0,
    description: "Cama de alta qualidade com acabamento premium",
    models: [
      {
        id: "1-1",
        name: "Luxo Standard",
        sizes: ["Solteiro", "Casal", "Queen", "King"],
        colors: ["Branco", "Marrom", "Preto", "Cinza"],
        fabrics: ["Courino", "Tecido", "Veludo"],
        priceModifier: 1.0,
      },
      {
        id: "1-2",
        name: "Luxo Premium",
        sizes: ["Casal", "Queen", "King"],
        colors: ["Branco", "Marrom", "Preto", "Cinza", "Azul Marinho"],
        fabrics: ["Courino Premium", "Tecido Premium", "Veludo Premium"],
        priceModifier: 1.5,
      },
    ],
    specifications: {
      Estrutura: ["Madeira MDF", "Madeira Maciça"],
      Cabeceira: ["Estofada", "Lisa", "Capitonê"],
      Gavetas: ["Sem gavetas", "2 gavetas", "4 gavetas"],
      Base: ["Simples", "Box", "Com Baú"],
    },
  },
  {
    id: "2",
    name: "Cama Standard",
    category: "bed",
    basePrice: 1800.0,
    description: "Cama com excelente custo-benefício",
    models: [
      {
        id: "2-1",
        name: "Standard Classic",
        sizes: ["Solteiro", "Casal", "Queen"],
        colors: ["Branco", "Marrom", "Preto"],
        fabrics: ["Courino", "Tecido"],
        priceModifier: 1.0,
      },
    ],
    specifications: {
      Estrutura: ["Madeira MDF"],
      Cabeceira: ["Estofada", "Lisa"],
      Gavetas: ["Sem gavetas", "2 gavetas"],
      Base: ["Simples", "Box"],
    },
  },
  {
    id: "3",
    name: "Cama Premium",
    category: "bed",
    basePrice: 3500.0,
    description: "Linha premium com design exclusivo",
    models: [
      {
        id: "3-1",
        name: "Premium Deluxe",
        sizes: ["Queen", "King", "Super King"],
        colors: [
          "Branco",
          "Marrom",
          "Preto",
          "Cinza",
          "Azul Marinho",
          "Verde Escuro",
        ],
        fabrics: [
          "Courino Premium",
          "Tecido Premium",
          "Veludo Premium",
          "Couro",
        ],
        priceModifier: 1.0,
      },
    ],
    specifications: {
      Estrutura: ["Madeira Maciça"],
      Cabeceira: ["Capitonê", "Design Exclusivo"],
      Gavetas: ["2 gavetas", "4 gavetas", "6 gavetas"],
      Base: ["Box Premium", "Com Baú Premium"],
    },
  },
];

export const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    customerId: "1",
    customerName: "João Silva",
    sellerId: "2",
    sellerName: "Carlos Vendedor",
    status: "in_production",
    priority: "medium",
    totalAmount: 4200.0,
    scheduledDate: new Date("2024-12-20"),
    deliveryDate: new Date("2024-12-25"),
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2024-12-15"),
    productionProgress: 65,
    assignedOperator: "Carlos M.",
    products: [
      {
        id: "1-1",
        productId: "1",
        productName: "Cama Luxo",
        model: "Luxo Premium",
        size: "Queen",
        color: "Marrom",
        fabric: "Veludo Premium",
        quantity: 1,
        unitPrice: 3750.0,
        totalPrice: 3750.0,
        specifications: {
          Estrutura: "Madeira Maciça",
          Cabeceira: "Capitonê",
          Gavetas: "2 gavetas",
          Base: "Box",
        },
      },
    ],
    notes: "Cliente solicitou entrega no período da manhã",
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    customerId: "2",
    customerName: "Móveis Premium Ltda",
    sellerId: "3",
    sellerName: "Ana Vendedora",
    status: "confirmed",
    priority: "high",
    totalAmount: 12600.0,
    scheduledDate: new Date("2024-12-18"),
    deliveryDate: new Date("2024-12-30"),
    createdAt: new Date("2024-12-12"),
    updatedAt: new Date("2024-12-12"),
    productionProgress: 0,
    products: [
      {
        id: "2-1",
        productId: "1",
        productName: "Cama Luxo",
        model: "Luxo Standard",
        size: "King",
        color: "Branco",
        fabric: "Courino",
        quantity: 3,
        unitPrice: 2800.0,
        totalPrice: 8400.0,
      },
      {
        id: "2-2",
        productId: "2",
        productName: "Cama Standard",
        model: "Standard Classic",
        size: "Queen",
        color: "Marrom",
        fabric: "Tecido",
        quantity: 2,
        unitPrice: 2100.0,
        totalPrice: 4200.0,
      },
    ],
    notes: "Pedido para revenda - prioridade alta",
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    customerId: "3",
    customerName: "Maria Santos",
    sellerId: "2",
    sellerName: "Carlos Vendedor",
    status: "ready",
    priority: "low",
    totalAmount: 2100.0,
    scheduledDate: new Date("2024-12-15"),
    deliveryDate: new Date("2024-12-22"),
    completedDate: new Date("2024-12-20"),
    createdAt: new Date("2024-12-08"),
    updatedAt: new Date("2024-12-20"),
    productionProgress: 100,
    assignedOperator: "Ana L.",
    products: [
      {
        id: "3-1",
        productId: "2",
        productName: "Cama Standard",
        model: "Standard Classic",
        size: "Casal",
        color: "Cinza",
        fabric: "Tecido",
        quantity: 1,
        unitPrice: 2100.0,
        totalPrice: 2100.0,
        specifications: {
          Estrutura: "Madeira MDF",
          Cabeceira: "Estofada",
          Gavetas: "Sem gavetas",
          Base: "Simples",
        },
      },
    ],
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    customerId: "5",
    customerName: "Casa & Decoração S.A.",
    sellerId: "3",
    sellerName: "Ana Vendedora",
    status: "pending",
    priority: "urgent",
    totalAmount: 21000.0,
    scheduledDate: new Date("2024-12-22"),
    deliveryDate: new Date("2025-01-05"),
    createdAt: new Date("2024-12-14"),
    updatedAt: new Date("2024-12-14"),
    productionProgress: 0,
    products: [
      {
        id: "4-1",
        productId: "3",
        productName: "Cama Premium",
        model: "Premium Deluxe",
        size: "King",
        color: "Azul Marinho",
        fabric: "Couro",
        quantity: 6,
        unitPrice: 3500.0,
        totalPrice: 21000.0,
        specifications: {
          Estrutura: "Madeira Maciça",
          Cabeceira: "Design Exclusivo",
          Gavetas: "4 gavetas",
          Base: "Com Baú Premium",
        },
      },
    ],
    notes: "Pedido especial para showroom - acabamento impecável necessário",
  },
];

export const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_production: "Em Produção",
  quality_check: "Controle de Qualidade",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export const statusColors = {
  pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_production: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  quality_check: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  ready: "bg-biobox-green/10 text-biobox-green border-biobox-green/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};
