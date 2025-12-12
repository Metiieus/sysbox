export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  cnpj?: string;
  type: 'individual' | 'business';
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
}

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-1234',
    cpf: '123.456.789-00',
    type: 'individual',
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-10'),
    totalOrders: 3,
    totalSpent: 12500.00,
    lastOrderDate: new Date('2024-11-15')
  },
  {
    id: '2',
    name: 'Móveis Premium Ltda',
    email: 'contato@moveispremium.com.br',
    phone: '(11) 3456-7890',
    cnpj: '12.345.678/0001-90',
    type: 'business',
    address: {
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    },
    status: 'active',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-12-08'),
    totalOrders: 8,
    totalSpent: 45200.00,
    lastOrderDate: new Date('2024-12-01')
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria.santos@gmail.com',
    phone: '(11) 98765-4321',
    cpf: '987.654.321-00',
    type: 'individual',
    address: {
      street: 'Rua dos Jardins',
      number: '456',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05435-020'
    },
    status: 'active',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-11-30'),
    totalOrders: 1,
    totalSpent: 3800.00,
    lastOrderDate: new Date('2024-10-22')
  },
  {
    id: '4',
    name: 'Pedro Costa',
    email: 'pedro.costa@outlook.com',
    phone: '(11) 97777-8888',
    cpf: '456.789.123-00',
    type: 'individual',
    address: {
      street: 'Rua Augusta',
      number: '789',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-000'
    },
    status: 'inactive',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-06-15'),
    totalOrders: 2,
    totalSpent: 7600.00,
    lastOrderDate: new Date('2024-05-10')
  },
  {
    id: '5',
    name: 'Casa & Decoração S.A.',
    email: 'vendas@casadecoração.com.br',
    phone: '(11) 2222-3333',
    cnpj: '98.765.432/0001-10',
    type: 'business',
    address: {
      street: 'Rua Oscar Freire',
      number: '321',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01426-001'
    },
    status: 'active',
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-12-12'),
    totalOrders: 12,
    totalSpent: 78900.00,
    lastOrderDate: new Date('2024-12-10')
  }
];
