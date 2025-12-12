export interface ProductionLine {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  currentOrder?: string;
  operatorId?: string;
  operatorName?: string;
  efficiency: number; // percentage
  dailyTarget: number;
  dailyProduced: number;
  lastUpdate: Date;
}

export interface ProductionStage {
  id: string;
  name: string;
  order: number;
  estimatedTime: number; // in minutes
  requiredSkills: string[];
  description: string;
}

export interface ProductionTask {
  id: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  customerId: string;
  customerName: string;
  stage: ProductionStage['id'];
  stageOrder: number;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedOperator?: string;
  startTime?: Date;
  estimatedCompletionTime?: Date;
  actualCompletionTime?: Date;
  progress: number; // percentage
  notes?: string;
  issues?: ProductionIssue[];
  qualityChecks?: QualityCheck[];
}

export interface ProductionIssue {
  id: string;
  taskId: string;
  type: 'quality' | 'material' | 'equipment' | 'operator' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  reportedBy: string;
  reportedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface QualityCheck {
  id: string;
  taskId: string;
  checkpointName: string;
  status: 'passed' | 'failed' | 'pending';
  inspector: string;
  checkedAt: Date;
  notes?: string;
  photos?: string[];
}

export interface Operator {
  id: string;
  name: string;
  skills: string[];
  experience: number; // years
  efficiency: number; // percentage
  currentTask?: string;
  status: 'available' | 'busy' | 'break' | 'absent';
  shift: 'morning' | 'afternoon' | 'night';
}

export const productionStages: ProductionStage[] = [
  {
    id: 'cutting_sewing',
    name: 'Corte e Costura',
    order: 1,
    estimatedTime: 120,
    requiredSkills: ['cutting', 'sewing'],
    description: 'Corte de materiais e costura inicial'
  },
  {
    id: 'carpentry',
    name: 'Marcenaria',
    order: 2,
    estimatedTime: 180,
    requiredSkills: ['carpentry', 'woodwork'],
    description: 'Trabalhos de marcenaria e estrutura'
  },
  {
    id: 'upholstery',
    name: 'Tapeçaria',
    order: 3,
    estimatedTime: 240,
    requiredSkills: ['upholstery', 'fabric_work'],
    description: 'Trabalhos de tapeçaria e estofamento'
  },
  {
    id: 'assembly',
    name: 'Montagem',
    order: 4,
    estimatedTime: 90,
    requiredSkills: ['assembly', 'finishing'],
    description: 'Montagem final do produto'
  },
  {
    id: 'packaging',
    name: 'Embalagem',
    order: 5,
    estimatedTime: 30,
    requiredSkills: ['packaging'],
    description: 'Embalagem para transporte'
  },
  {
    id: 'delivery',
    name: 'Entrega',
    order: 6,
    estimatedTime: 60,
    requiredSkills: ['logistics', 'delivery'],
    description: 'Entrega ao cliente'
  }
];


export const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  paused: 'Pausado',
  blocked: 'Bloqueado'
};

export const statusColors = {
  pending: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-biobox-green/10 text-biobox-green border-biobox-green/20',
  paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  blocked: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export const priorityColors = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500'
};

export const operatorStatusColors = {
  available: 'bg-biobox-green/10 text-biobox-green border-biobox-green/20',
  busy: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  break: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  absent: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export const operatorStatusLabels = {
  available: 'Disponível',
  busy: 'Ocupado',
  break: 'Pausa',
  absent: 'Ausente'
};
