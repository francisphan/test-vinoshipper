import React, { useState, ChangeEvent, KeyboardEvent } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Package, Database, MessageSquare } from 'lucide-react';

interface ConversationMessage {
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
  vinoshipper: number;
  local: number;
  status: string;
}

const VinoshipperInventoryAgent = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string>('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncLog[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([
    { sku: 'WINE-001', name: 'Cabernet Sauvignon 2021', vinoshipper: 45, local: 45, status: 'synced' },
    { sku: 'WINE-002', name: 'Chardonnay 2022', vinoshipper: 32, local: 28, status: 'out-of-sync' },
    { sku: 'WINE-003', name: 'Pinot Noir 2021', vinoshipper: 18, local: 18, status: 'synced' },
    { sku: 'WINE-004', name: 'Rosé 2023', vinoshipper: 0, local: 5, status: 'out-of-sync' }
  ]);

  const handleConnect = () => {
    if (apiKey.trim()) {
      setIsConnected(true);
      addMessage('system', 'Connected to Vinoshipper API. I can help you sync inventory, check stock levels, and manage updates.');
    }
  };

  const addMessage = (role: string, content: string) => {
    setConversation((prev: ConversationMessage[]) => [...prev, { role, content, timestamp: new Date() }]);
  };

  const addSyncLog = (message: string, type: string = 'info') => {
    setSyncStatus((prev: SyncLog[]) => [...prev, { message, type, timestamp: new Date() }]);
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || !isConnected) return;

    const message = userMessage;
    setUserMessage('');
    addMessage('user', message);
    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(async () => {
      const response = await processAgentRequest(message);
      addMessage('assistant', response);
      setIsProcessing(false);
    }, 1000);
  };

  const processAgentRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();

    // Check inventory status
    if (lowerMessage.includes('status') || lowerMessage.includes('check')) {
      const outOfSync = inventoryData.filter((item: InventoryItem) => item.status === 'out-of-sync');
      if (outOfSync.length === 0) {
        return 'All inventory is in sync! ✓ All SKUs match between Vinoshipper and your local system.';
      }
      return `Found ${outOfSync.length} item(s) out of sync:\n\n${outOfSync.map((item: InventoryItem) => 
        `• ${item.name} (${item.sku}): Vinoshipper=${item.vinoshipper}, Local=${item.local}`
      ).join('\n')}\n\nWould you like me to sync these items?`;
    }

    // Sync inventory
    if (lowerMessage.includes('sync') || lowerMessage.includes('update')) {
      return await performSync();
    }

    // Check specific SKU
    const skuMatch = message.match(/WINE-\d+/i);
    if (skuMatch) {
      const sku = skuMatch[0].toUpperCase();
      const item = inventoryData.find((i: InventoryItem) => i.sku === sku);
      if (item) {
        return `${item.name} (${item.sku}):\n• Vinoshipper: ${item.vinoshipper} units\n• Local System: ${item.local} units\n• Status: ${item.status === 'synced' ? '✓ Synced' : '⚠ Out of sync'}`;
      }
      return `SKU ${sku} not found in inventory.`;
    }

    // Default helpful response
    return `I can help you with:\n• "Check status" - View sync status of all items\n• "Sync inventory" - Sync out-of-sync items\n• "WINE-XXX" - Check specific SKU details\n• "Show low stock" - View items with low inventory\n\nWhat would you like to do?`;
  };

  const performSync = async (): Promise<string> => {
    const outOfSync = inventoryData.filter((item: InventoryItem) => item.status === 'out-of-sync');
    
    if (outOfSync.length === 0) {
      return 'All inventory is already in sync!';
    }

    addSyncLog('Starting inventory sync...', 'info');
    
    // Simulate sync process
    for (const item of outOfSync) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newQuantity = item.local; // Sync from local to Vinoshipper
      addSyncLog(`Syncing ${item.sku}: ${item.vinoshipper} → ${newQuantity}`, 'success');
      
      // Update inventory data
      setInventoryData((prev: InventoryItem[]) => prev.map((i: InventoryItem) => 
        i.sku === item.sku 
          ? { ...i, vinoshipper: newQuantity, status: 'synced' }
          : i
      ));
    }

    addSyncLog(`Sync completed. ${outOfSync.length} item(s) updated.`, 'success');
    return `✓ Successfully synced ${outOfSync.length} item(s) to Vinoshipper. All inventory is now up to date!`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Package className="w-8 h-8" />
                  Vinoshipper Inventory Agent
                </h1>
                <p className="text-purple-100 mt-1">AI-powered inventory synchronization</p>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <span className="flex items-center gap-1 bg-green-500 px-3 py-1 rounded-full text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-red-500 px-3 py-1 rounded-full text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Not Connected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Panel - Connection & Chat */}
            <div className="space-y-4">
              {!isConnected ? (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Connect to Vinoshipper
                  </h2>
                  <input
                    type="password"
                    placeholder="Enter your Vinoshipper API Key"
                    value={apiKey}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                    className="w-full px-4 py-2 border border-purple-300 rounded-lg mb-4 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={handleConnect}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
                  >
                    Connect
                  </button>
                  <p className="text-sm text-gray-600 mt-3">
                    Demo mode: Enter any text to connect
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-[500px] bg-gray-50 rounded-lg border border-gray-200">
                  <div className="bg-purple-100 px-4 py-3 border-b border-purple-200 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-700" />
                    <h3 className="font-semibold text-purple-900">AI Agent Chat</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {conversation.map((msg: ConversationMessage, idx: number) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : msg.role === 'system'
                              ? 'bg-blue-100 text-blue-900 text-sm'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                          <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask about inventory status, sync items, etc..."
                        value={userMessage}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUserMessage(e.target.value)}
                        onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!userMessage.trim() || isProcessing}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-300"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Inventory & Sync Status */}
            <div className="space-y-4">
              {/* Inventory Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-indigo-100 px-4 py-3 border-b border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Current Inventory
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">SKU</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Product</th>
                        <th className="px-4 py-2 text-center font-semibold text-gray-700">VS</th>
                        <th className="px-4 py-2 text-center font-semibold text-gray-700">Local</th>
                        <th className="px-4 py-2 text-center font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.map((item: InventoryItem, idx: number) => (
                        <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                          <td className="px-4 py-2">{item.name}</td>
                          <td className="px-4 py-2 text-center">{item.vinoshipper}</td>
                          <td className="px-4 py-2 text-center">{item.local}</td>
                          <td className="px-4 py-2 text-center">
                            {item.status === 'synced' ? (
                              <span className="text-green-600 flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="text-orange-600 flex items-center justify-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sync Log */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Sync Activity Log
                  </h3>
                </div>
                <div className="h-48 overflow-y-auto p-4 space-y-2 bg-gray-50">
                  {syncStatus.length === 0 ? (
                    <p className="text-gray-500 text-sm">No sync activity yet</p>
                  ) : (
                    syncStatus.map((log: SyncLog, idx: number) => (
                      <div key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-gray-400 text-xs">
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
                    ))
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

export default VinoshipperInventoryAgent;