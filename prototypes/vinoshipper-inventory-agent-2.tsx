import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { MessageSquare, Package, Settings, RefreshCw, AlertCircle, CheckCircle, Send, Loader } from 'lucide-react';

interface Message {
  role: string;
  content: string;
  timestamp: Date;
}

interface SyncLog {
  message: string;
  type: string;
  timestamp: Date;
}

interface InventoryItem {
  sku: string;
  name: string;
  quantity: number;
  lastSync: Date;
}

const VinoshipperAgent = () => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [vsApiKey, setVsApiKey] = useState<string>('');
  const [claudeApiKey, setClaudeApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedVsKey = localStorage.getItem('vs_api_key');
    const savedClaudeKey = localStorage.getItem('claude_api_key');
    
    if (savedVsKey && savedClaudeKey) {
      setVsApiKey(savedVsKey);
      setClaudeApiKey(savedClaudeKey);
      setIsConfigured(true);
      addMessage('system', 'Connected! I can help you manage your Vinoshipper inventory. Try asking "check inventory status" or "sync all products".');
      loadInventory(savedVsKey);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: string, content: string): void => {
    setMessages((prev: Message[]) => [...prev, { role, content, timestamp: new Date() }]);
  };

  const addSyncLog = (message: string, type: string = 'info'): void => {
    setSyncLogs((prev: SyncLog[]) => [...prev, { message, type, timestamp: new Date() }]);
  };

  const saveConfiguration = (): void => {
    if (!vsApiKey.trim() || !claudeApiKey.trim()) {
      alert('Please enter both API keys');
      return;
    }
    
    localStorage.setItem('vs_api_key', vsApiKey);
    localStorage.setItem('claude_api_key', claudeApiKey);
    setIsConfigured(true);
    setShowSettings(false);
    addMessage('system', 'Configuration saved! Ready to assist with your Vinoshipper account.');
    loadInventory(vsApiKey);
  };

  const loadInventory = async (apiKey: string): Promise<void> => {
    // Simulated inventory load - replace with actual Vinoshipper API call
    const mockInventory: InventoryItem[] = [
      { sku: 'WINE-001', name: 'Cabernet Sauvignon 2021', quantity: 45, lastSync: new Date() },
      { sku: 'WINE-002', name: 'Chardonnay 2022', quantity: 32, lastSync: new Date() },
      { sku: 'WINE-003', name: 'Pinot Noir 2021', quantity: 18, lastSync: new Date() },
      { sku: 'WINE-004', name: 'Rosé 2023', quantity: 8, lastSync: new Date() },
      { sku: 'WINE-005', name: 'Merlot 2020', quantity: 0, lastSync: new Date() }
    ];
    setInventory(mockInventory);
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMsg = inputMessage;
    setInputMessage('');
    addMessage('user', userMsg);
    setIsProcessing(true);

    try {
      // Call Claude API to process the message
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: buildSystemPrompt(),
          messages: [
            { role: 'user', content: userMsg }
          ]
        })
      });

      const data = await response.json();
      
      if (data.content && data.content[0]) {
        const assistantResponse = data.content[0].text;
        addMessage('assistant', assistantResponse);
        
        // Check if Claude wants to perform actions
        await executeAgentActions(assistantResponse);
      } else {
        addMessage('assistant', 'I encountered an issue processing your request. Please try again.');
      }
    } catch (error) {
      console.error('Error calling Claude API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessage('assistant', `Error: ${errorMessage}. Please check your API key in settings.`);
    }

    setIsProcessing(false);
  };

  const buildSystemPrompt = (): string => {
    const inventoryData = inventory.map((item: InventoryItem) => 
      `${item.sku}: ${item.name} - ${item.quantity} units`
    ).join('\n');

    return `You are an AI assistant managing a Vinoshipper wine inventory system. 

Current Inventory:
${inventoryData}

You can help with:
- Checking inventory levels and stock status
- Identifying low stock items (under 10 units)
- Syncing inventory with external systems
- Searching for specific products by SKU or name
- Generating inventory reports

When asked to perform sync operations, respond with:
ACTION:SYNC followed by the SKUs to sync, like: ACTION:SYNC WINE-001,WINE-002

When asked about low stock, identify items under 10 units.
Be conversational and helpful. Provide specific details from the inventory data.`;
  };

  const executeAgentActions = async (message: string): Promise<void> => {
    // Parse sync actions
    const syncMatch = message.match(/ACTION:SYNC\s+([\w-,\s]+)/);
    if (syncMatch) {
      const skus = syncMatch[1].split(',').map((s: string) => s.trim());
      await performSync(skus);
    }
  };

  const performSync = async (skus: string[]): Promise<void> => {
    addSyncLog('Starting inventory sync...', 'info');
    
    for (const sku of skus) {
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      
      const item = inventory.find((i: InventoryItem) => i.sku === sku);
      if (item) {
        addSyncLog(`Syncing ${sku}: ${item.name} - ${item.quantity} units`, 'success');
        
        // Update last sync time
        setInventory((prev: InventoryItem[]) => prev.map((i: InventoryItem) => 
          i.sku === sku ? { ...i, lastSync: new Date() } : i
        ));
      } else {
        addSyncLog(`SKU ${sku} not found`, 'error');
      }
    }
    
    addSyncLog(`Sync completed: ${skus.length} item(s) processed`, 'success');
  };

  if (showSettings || !isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vinoshipper API Key
              </label>
              <input
                type="password"
                value={vsApiKey}
                onChange={(e) => setVsApiKey(e.target.value)}
                placeholder="Enter your Vinoshipper API key"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get this from your Vinoshipper account settings
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Claude API Key
              </label>
              <input
                type="password"
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
                placeholder="Enter your Anthropic API key"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get this from console.anthropic.com
              </p>
            </div>

            <button
              onClick={saveConfiguration}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold mt-6"
            >
              Save & Connect
            </button>

            {isConfigured && (
              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Privacy Note:</strong> Your API keys are stored locally in your browser and never sent to any third party except Vinoshipper and Anthropic.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Vinoshipper AI Agent</h1>
                <p className="text-purple-100 text-sm">Natural language inventory management</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            {/* Chat Interface */}
            <div className="lg:col-span-2 flex flex-col bg-gray-50 rounded-lg border border-gray-200 h-[600px]">
              <div className="bg-purple-100 px-4 py-3 border-b border-purple-200 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-700" />
                <h2 className="font-semibold text-purple-900">AI Assistant</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg: Message, idx: number) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : msg.role === 'system'
                          ? 'bg-blue-100 text-blue-900 text-sm border border-blue-200'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-gray-600">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about inventory, sync products, check stock..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isProcessing}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory & Logs Panel */}
            <div className="space-y-4">
              {/* Inventory */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-indigo-100 px-4 py-3 border-b border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Current Inventory
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {inventory.map((item: InventoryItem, idx: number) => (
                    <div
                      key={idx}
                      className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{item.sku}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`font-bold ${item.quantity === 0 ? 'text-red-600' : item.quantity < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                            {item.quantity}
                          </span>
                          {item.quantity < 10 && (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sync Logs */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Sync Activity
                  </h3>
                </div>
                <div className="h-48 overflow-y-auto p-3 bg-gray-50">
                  {syncLogs.length === 0 ? (
                    <p className="text-gray-500 text-sm">No sync activity yet</p>
                  ) : (
                    <div className="space-y-2">
                      {syncLogs.map((log: SyncLog, idx: number) => (
                        <div key={idx} className="text-xs flex items-start gap-2">
                          <span className="text-gray-400 whitespace-nowrap">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <span className={`flex-1 ${
                            log.type === 'success' ? 'text-green-700' :
                            log.type === 'error' ? 'text-red-700' :
                            'text-gray-700'
                          }`}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VinoshipperAgent;