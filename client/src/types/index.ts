export enum RequestStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  UNRESOLVED = 'UNRESOLVED'
}

export interface HelpRequest {
  _id: string;
  customerPhone: string;
  customerName?: string;
  question: string;
  context?: string;
  status: RequestStatus;
  supervisorResponse?: string;
  supervisorName?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  roomName?: string;
}

export interface KnowledgeBase {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  keywords: string[];
  sourceRequestId?: string;
  learnedFrom: 'SUPERVISOR' | 'MANUAL' | 'INITIAL';
  usageCount: number;
  lastUsed?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Statistics {
  pending: number;
  resolved: number;
  unresolved: number;
  total: number;
  resolutionRate: string;
}
