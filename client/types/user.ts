export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'seller' | 'operator';
  permissions: Permission[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  createdBy: string;
}

export interface Permission {
  id: string;
  name: string;
  module: 'dashboard' | 'orders' | 'customers' | 'production' | 'products' | 'settings';
  actions: ('view' | 'create' | 'edit' | 'delete')[];
}

export const defaultPermissions: Permission[] = [
  {
    id: 'dashboard-view',
    name: 'Visualizar Dashboard',
    module: 'dashboard',
    actions: ['view']
  },
  {
    id: 'orders-full',
    name: 'Gerenciar Pedidos',
    module: 'orders',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    id: 'customers-full',
    name: 'Gerenciar Clientes',
    module: 'customers',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    id: 'production-view',
    name: 'Visualizar Produção',
    module: 'production',
    actions: ['view']
  },
  {
    id: 'production-manage',
    name: 'Gerenciar Produção',
    module: 'production',
    actions: ['view', 'edit']
  },
  {
    id: 'products-view',
    name: 'Visualizar Produtos',
    module: 'products',
    actions: ['view']
  },
  {
    id: 'products-manage',
    name: 'Gerenciar Produtos',
    module: 'products',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    id: 'settings-view',
    name: 'Visualizar Configurações',
    module: 'settings',
    actions: ['view']
  },
  {
    id: 'settings-manage',
    name: 'Gerenciar Configurações',
    module: 'settings',
    actions: ['view', 'edit']
  }
];

export const rolePermissions = {
  admin: defaultPermissions,
  seller: [
    defaultPermissions.find(p => p.id === 'orders-full')!,
    defaultPermissions.find(p => p.id === 'customers-full')!
  ],
  operator: [
    defaultPermissions.find(p => p.id === 'production-view')!,
    defaultPermissions.find(p => p.id === 'production-manage')!
  ]
};

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Administrator',
    email: 'admin@bioboxsys.com',
    role: 'admin',
    permissions: rolePermissions.admin,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-15'),
    lastLogin: new Date(),
    createdBy: 'system'
  },
  {
    id: '2',
    name: 'Carlos Vendedor',
    email: 'carlos@bioboxsys.com',
    role: 'seller',
    permissions: rolePermissions.seller,
    status: 'active',
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-12-10'),
    lastLogin: new Date('2024-12-14'),
    createdBy: '1'
  },
  {
    id: '3',
    name: 'Ana Vendedora',
    email: 'ana@bioboxsys.com',
    role: 'seller',
    permissions: rolePermissions.seller,
    status: 'active',
    createdAt: new Date('2024-08-20'),
    updatedAt: new Date('2024-12-12'),
    lastLogin: new Date('2024-12-13'),
    createdBy: '1'
  }
];