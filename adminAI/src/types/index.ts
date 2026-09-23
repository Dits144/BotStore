export type ConversationMode = 'AUTO' | 'ASSIST' | 'MANUAL';
export type ConversationStatus = 'ACTIVE' | 'RESOLVED' | 'ARCHIVED';
export type MessageSender = 'CUSTOMER' | 'AI' | 'ADMIN';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface ProductItem {
  id: string;
  name: string;
  categoryId?: string | null;
  description: string;
  price: number;
  stock: number;
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';
  sku: string;
  productInstructions?: string | null;
  warrantyInfo?: string | null;
  notesForAi?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CustomerItem {
  id: string;
  whatsappNumber: string;
  name: string;
  firstContact: string | Date;
  lastContact: string | Date;
  totalConversations: number;
  totalOrders: number;
  totalSpending: number;
  tags: string[];
  notes?: string | null;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  status: 'ACTIVE' | 'DRAFT';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OrderItemType {
  id: string;
  customerId: string;
  customerName?: string;
  totalAmount: number;
  status: 'PENDING' | 'WAITING_PAYMENT' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  notes?: string | null;
  createdAt: string | Date;
  items?: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export interface MessageItem {
  id: string;
  conversationId: string;
  sender: MessageSender;
  whatsappMsgId?: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  status: MessageStatus;
  suggestedReply?: string | null;
  toolCalls?: any;
  intent?: string | null;
  sentiment?: string | null;
  confidence?: number | null;
  createdAt: string | Date;
}

export interface ConversationItem {
  id: string;
  customerId: string;
  customer: CustomerItem;
  mode: ConversationMode;
  status: ConversationStatus;
  requiresAttention: boolean;
  handoverReason?: string | null;
  handoverTimestamp?: string | Date | null;
  lastMessageAt: string | Date;
  messages?: MessageItem[];
}

export interface AiSettings {
  aiEnabled: boolean;
  aiModel: string;
  apiKey?: string;
  defaultMode: ConversationMode;
  temperature: number;
  maxTokens: number;
  responseDelay: number;
  businessName: string;
  assistantName: string;
  businessDescription: string;
  personality: string;
  greetingStyle: string;
  closingStyle: string;
  autoHandover: boolean;
  confidenceThreshold: number;
  systemInstructions: string;
}

export interface AiRoutingResult {
  intent: string;
  sentiment: string;
  confidence: number;
  requires_tool: boolean;
  recommended_action: 'AI_REPLY' | 'AI_ASSIST' | 'HANDOVER' | 'IGNORE';
  suggested_reply?: string;
  tool_calls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  handover_reason?: string;
}
