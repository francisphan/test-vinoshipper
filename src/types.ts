export interface Client {
  id: string;
  name: string;
  apiKey: string;
  fulfillment: string;
}

export interface InventoryItem {
  sku: string;
  name: string;
  quantity: number;
  lastSync?: Date;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface SyncLog {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: Date;
}

export interface CSVItem {
  sku: string;
  name: string;
  quantity: number;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
}

export interface ProductCreateParams {
  sku: string;
  name: string;
  quantity: number;
}
