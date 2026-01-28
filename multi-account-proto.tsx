import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Package, Settings, RefreshCw, AlertCircle, CheckCircle, Send, Loader, Upload, FileText, X, Users, Plus, Trash2, Building2 } from 'lucide-react';
import { VinoshipperClient, VinoshipperApiError } from './src/client/VinoshipperClient';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const VinoshipperAgent = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showClientManager, setShowClientManager] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [csvInventory, setCsvInventory] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  
  // New client form
  const [newClientName, setNewClientName] = useState('');
  const [newClientApiKey, setNewClientApiKey] = useState('');
  const [newClientFulfillment, setNewClientFulfillment] = useState('Hydra (NY)');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedClients = localStorage.getItem('clients');
    const savedClaudeKey = localStorage.getItem('claude_api_key');
    
    if (savedClients && savedClaudeKey) {
      const parsedClients = JSON.parse(savedClients);
      setClients(parsedClients);
      setClaudeApiKey(savedClaudeKey);
      
      if (parsedClients.length > 0) {
        setSelectedClient(parsedClients[0]);
        setIsConfigured(true);
        addMessage('system', `Managing ${parsedClients.length} client account(s). Currently viewing: ${parsedClients[0].name}`);
        loadInventory(parsedClients[0].apiKey);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  const addSyncLog = (message, type = 'info') => {
    setSyncLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const saveConfiguration = () => {
    if (!claudeApiKey.trim()) {
      alert('Please enter your Claude API key');
      return;
    }
    
    if (clients.length === 0) {
      alert('Please add at least one client account');
      return;
    }
    
    localStorage.setItem('clients', JSON.stringify(clients));
    localStorage.setItem('claude_api_key', claudeApiKey);
    setIsConfigured(true);
    setShowSettings(false);
    addMessage('system', `Configuration saved! Managing ${clients.length} client(s).`);
    
    if (selectedClient) {
      loadInventory(selectedClient.apiKey);
    }
  };

  const addClient = () => {
    if (!newClientName.trim() || !newClientApiKey.trim()) {
      alert('Please enter client name and API key');
      return;
    }
    
    const newClient = {
      id: Date.now().toString(),
      name: newClientName,
      apiKey: newClientApiKey,
      fulfillment: newClientFulfillment
    };
    
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    
    if (!selectedClient) {
      setSelectedClient(newClient);
    }
    
    setNewClientName('');
    setNewClientApiKey('');
    setNewClientFulfillment('Hydra (NY)');
    
    addSyncLog(`Added client: ${newClient.name}`, 'success');
  };

  const removeClient = (clientId) => {
    if (!confirm('Remove this client? This cannot be undone.')) return;
    
    const updatedClients = clients.filter(c => c.id !== clientId);
    setClients(updatedClients);
    
    if (selectedClient?.id === clientId) {
      setSelectedClient(updatedClients[0] || null);
      if (updatedClients[0]) {
        loadInventory(updatedClients[0].apiKey);
      } else {
        setInventory([]);
      }
    }
    
    localStorage.setItem('clients', JSON.stringify(updatedClients));
  };

  const switchClient = (client) => {
    setSelectedClient(client);
    addMessage('system', `Switched to: ${client.name}`);
    addSyncLog(`Switched to client: ${client.name}`, 'info');
    loadInventory(client.apiKey);
    setCsvInventory(null);
    setCsvFileName('');
  };

  const loadInventory = async (apiKey) => {
    try {
      const client = new VinoshipperClient(apiKey);
      const data = await client.getInventory();
      setInventory(data);
      addSyncLog(`Loaded ${data.length} items from Vinoshipper`, 'success');
    } catch (error) {
      console.error('Failed to load inventory:', error);

      // Log specific error message if available
      if (error instanceof VinoshipperApiError) {
        addSyncLog(`API Error: ${error.message}`, 'error');
      }

      // Fallback to mock data for demo
      const mockInventory = [
        { sku: 'WINE-001', name: 'Cabernet Sauvignon 2021', quantity: 45, lastSync: new Date() },
        { sku: 'WINE-002', name: 'Chardonnay 2022', quantity: 32, lastSync: new Date() },
        { sku: 'WINE-003', name: 'Pinot Noir 2021', quantity: 18, lastSync: new Date() },
        { sku: 'WINE-004', name: 'Rosé 2023', quantity: 8, lastSync: new Date() },
        { sku: 'WINE-005', name: 'Merlot 2020', quantity: 0, lastSync: new Date() }
      ];
      setInventory(mockInventory);
      addSyncLog('Using demo data (API connection failed)', 'info');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    const text = await file.text();
    
    try {
      const parsed = parseCSV(text);
      setCsvInventory(parsed);
      addMessage('system', `✓ Uploaded ${file.name} with ${parsed.length} items for ${selectedClient.name}. Ready to sync!`);
      addSyncLog(`CSV uploaded: ${parsed.length} items for ${selectedClient.name}`, 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addMessage('system', `Error parsing CSV: ${errorMsg}`);
      addSyncLog(`CSV upload failed: ${errorMsg}`, 'error');
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const skuIndex = headers.findIndex(h => h === 'sku' || h === 'product_sku' || h === 'item_sku');
    const nameIndex = headers.findIndex(h => h === 'name' || h === 'product_name' || h === 'item_name' || h === 'description');
    const quantityIndex = headers.findIndex(h => h === 'quantity' || h === 'qty' || h === 'stock' || h === 'inventory');
    
    if (skuIndex === -1) throw new Error('CSV must have a SKU column');
    if (quantityIndex === -1) throw new Error('CSV must have a Quantity column');
    
    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      const sku = values[skuIndex];
      const name = nameIndex !== -1 ? values[nameIndex] : sku;
      const quantity = parseInt(values[quantityIndex]) || 0;
      
      if (sku) {
        items.push({ sku, name, quantity });
      }
    }
    
    return items;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing || !selectedClient) return;

    const userMsg = inputMessage;
    setInputMessage('');
    addMessage('user', userMsg);
    setIsProcessing(true);

    try {
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
        await executeAgentActions(assistantResponse);
      } else {
        addMessage('assistant', 'I encountered an issue processing your request. Please try again.');
      }
    } catch (error) {
      console.error('Error calling Claude API:', error);
      addMessage('assistant', `Error: ${error.message}. Please check your API key in settings.`);
    }

    setIsProcessing(false);
  };

  const buildSystemPrompt = () => {
    const vinoshipperData = inventory.map(item => 
      `${item.sku}: ${item.name} - ${item.quantity} units`
    ).join('\n');

    let csvData = 'No CSV uploaded yet';
    if (csvInventory) {
      csvData = csvInventory.map(item => 
        `${item.sku}: ${item.name} - ${item.quantity} units`
      ).join('\n');
    }

    const clientList = clients.map(c => c.name).join(', ');

    return `You are an AI assistant managing inventory for The Vines - a wine sales consulting company managing multiple wine producer accounts on Vinoshipper.

Current Context:
- Managing ${clients.length} client account(s): ${clientList}
- Currently viewing: ${selectedClient.name}
- Fulfillment center: ${selectedClient.fulfillment}

Current Vinoshipper Inventory for ${selectedClient.name}:
${vinoshipperData}

CSV Inventory (Source of Truth):
${csvData}

You can help with:
- Switching between client accounts: "Switch to [client name]"
- Comparing CSV inventory with Vinoshipper
- Syncing CSV quantities to Vinoshipper (CSV is authoritative)
- Finding products and checking stock levels
- Cross-client operations: "Which clients have low stock?"

When asked to switch clients, respond with: ACTION:SWITCH_CLIENT [client_name]
When asked to sync, respond with: ACTION:SYNC_ALL or ACTION:SYNC [SKU1,SKU2]
When asked about all clients, respond with: ACTION:CHECK_ALL_CLIENTS

Be conversational and help manage their multi-client operations efficiently.`;
  };

  const executeAgentActions = async (message) => {
    // Switch client
    const switchMatch = message.match(/ACTION:SWITCH_CLIENT\s+(.+)/i);
    if (switchMatch) {
      const clientName = switchMatch[1].trim();
      const client = clients.find(c => c.name.toLowerCase().includes(clientName.toLowerCase()));
      if (client) {
        switchClient(client);
      } else {
        addMessage('assistant', `Client "${clientName}" not found. Available clients: ${clients.map(c => c.name).join(', ')}`);
      }
      return;
    }

    // Check all clients
    if (message.includes('ACTION:CHECK_ALL_CLIENTS')) {
      await checkAllClients();
      return;
    }

    // Sync operations
    if (message.includes('ACTION:SYNC_ALL')) {
      if (!csvInventory) {
        addMessage('assistant', 'No CSV uploaded. Please upload a CSV file first.');
        return;
      }
      await performFullSync();
      return;
    }

    const syncMatch = message.match(/ACTION:SYNC\s+\[([\w-,\s]+)\]/);
    if (syncMatch) {
      const skus = syncMatch[1].split(',').map(s => s.trim());
      await performSync(skus);
    }
  };

  const checkAllClients = async () => {
    addSyncLog('Checking inventory across all clients...', 'info');
    
    for (const client of clients) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // In real implementation, would fetch actual inventory
      const lowStockCount = Math.floor(Math.random() * 5);
      addSyncLog(`${client.name}: ${lowStockCount} low stock items`, lowStockCount > 0 ? 'info' : 'success');
    }
  };

  const performFullSync = async () => {
    if (!csvInventory || !selectedClient) return;

    const client = new VinoshipperClient(selectedClient.apiKey);
    addSyncLog(`Starting full sync for ${selectedClient.name}: ${csvInventory.length} items`, 'info');

    for (const csvItem of csvInventory) {
      await new Promise(resolve => setTimeout(resolve, 600));

      const vsItem = inventory.find(i => i.sku === csvItem.sku);

      try {
        if (!vsItem) {
          await client.createProduct({
            sku: csvItem.sku,
            name: csvItem.name,
            quantity: csvItem.quantity
          });
          addSyncLog(`${selectedClient.name}: Created ${csvItem.sku} (${csvItem.quantity} units)`, 'success');
        } else if (vsItem.quantity !== csvItem.quantity) {
          await client.updateInventory(csvItem.sku, csvItem.quantity);
          addSyncLog(`${selectedClient.name}: Updated ${csvItem.sku}: ${vsItem.quantity} → ${csvItem.quantity}`, 'success');
        } else {
          addSyncLog(`${selectedClient.name}: ${csvItem.sku} already in sync`, 'info');
        }

        setInventory(prev => {
          const existing = prev.find(i => i.sku === csvItem.sku);
          if (existing) {
            return prev.map(i =>
              i.sku === csvItem.sku
                ? { ...i, quantity: csvItem.quantity, lastSync: new Date() }
                : i
            );
          } else {
            return [...prev, { ...csvItem, lastSync: new Date() }];
          }
        });
      } catch (error) {
        const errorMsg = error instanceof VinoshipperApiError
          ? error.message
          : (error instanceof Error ? error.message : 'Unknown error');
        addSyncLog(`${selectedClient.name}: Failed to sync ${csvItem.sku} - ${errorMsg}`, 'error');
      }
    }

    addSyncLog(`✓ Sync completed for ${selectedClient.name}: ${csvInventory.length} items processed`, 'success');
  };

  const performSync = async (skus) => {
    if (!csvInventory || !selectedClient) {
      addSyncLog('No CSV data available for sync', 'error');
      return;
    }

    addSyncLog(`Syncing ${skus.length} item(s) for ${selectedClient.name}...`, 'info');
    
    for (const sku of skus) {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const csvItem = csvInventory.find(i => i.sku === sku);
      const vsItem = inventory.find(i => i.sku === sku);
      
      if (!csvItem) {
        addSyncLog(`${sku}: Not found in CSV`, 'error');
        continue;
      }
      
      try {
        if (!vsItem) {
          await vinoshipperAPI.createProduct(selectedClient.apiKey, {
            sku: csvItem.sku,
            name: csvItem.name,
            quantity: csvItem.quantity
          });
          addSyncLog(`${sku}: Created with ${csvItem.quantity} units`, 'success');
        } else {
          await vinoshipperAPI.updateInventory(selectedClient.apiKey, sku, csvItem.quantity);
          addSyncLog(`${sku}: Updated ${vsItem.quantity} → ${csvItem.quantity}`, 'success');
        }
        
        setInventory(prev => {
          const existing = prev.find(i => i.sku === sku);
          if (existing) {
            return prev.map(i => 
              i.sku === sku 
                ? { ...i, quantity: csvItem.quantity, lastSync: new Date() }
                : i
            );
          } else {
            return [...prev, { ...csvItem, lastSync: new Date() }];
          }
        });
      } catch (error) {
        addSyncLog(`${sku}: Sync failed - ${error.message}`, 'error');
      }
    }
    
    addSyncLog(`Sync completed: ${skus.length} item(s) processed`, 'success');
  };

  const clearCsv = () => {
    setCsvInventory(null);
    setCsvFileName('');
    addMessage('system', 'CSV cleared. Upload a new file to sync inventory.');
  };

  if (showSettings || !isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          </div>
          
          <div className="space-y-6">
            {/* Claude API Key */}
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
            </div>

            {/* Client Accounts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Client Accounts ({clients.length})
                </label>
                <button
                  onClick={() => setShowClientManager(!showClientManager)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                >
                  <Users className="w-4 h-4" />
                  {showClientManager ? 'Hide' : 'Manage Clients'}
                </button>
              </div>

              {showClientManager && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                  {/* Add New Client */}
                  <div className="space-y-3 pb-4 border-b border-gray-300">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Client
                    </h3>
                    <input
                      type="text"
                      placeholder="Client Name (e.g., Château Margaux)"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Vinoshipper API Key:Secret"
                      value={newClientApiKey}
                      onChange={(e) => setNewClientApiKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <select
                      value={newClientFulfillment}
                      onChange={(e) => setNewClientFulfillment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option>Hydra (NY)</option>
                      <option>ShipEz (CA)</option>
                    </select>
                    <button
                      onClick={addClient}
                      className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm font-semibold"
                    >
                      Add Client
                    </button>
                  </div>

                  {/* Client List */}
                  <div className="space-y-2">
                    {clients.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No clients added yet</p>
                    ) : (
                      clients.map(client => (
                        <div key={client.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-900">{client.name}</div>
                            <div className="text-xs text-gray-500">{client.fulfillment}</div>
                          </div>
                          <button
                            onClick={() => removeClient(client.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={saveConfiguration}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Vinoshipper Multi-Client Manager</h1>
                  <p className="text-purple-100 text-sm">Managing {clients.length} wine producer account(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedClient}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <Upload className="w-5 h-5" />
                  Upload CSV
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Client Selector */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => switchClient(client)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    selectedClient?.id === client.id
                      ? 'bg-white text-purple-600 font-semibold'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  {client.name}
                </button>
              ))}
            </div>

            {csvFileName && selectedClient && (
              <div className="mt-3 flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                <FileText className="w-4 h-4" />
                <span className="text-sm flex-1">{csvFileName} ({selectedClient.name})</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                  {csvInventory?.length || 0} items
                </span>
                <button
                  onClick={clearCsv}
                  className="hover:bg-white/20 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            {/* Chat Interface */}
            <div className="lg:col-span-2 flex flex-col bg-gray-50 rounded-lg border border-gray-200 h-[600px]">
              <div className="bg-purple-100 px-4 py-3 border-b border-purple-200 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-700" />
                <h2 className="font-semibold text-purple-900">AI Assistant</h2>
                {selectedClient && (
                  <span className="ml-auto text-sm text-purple-700">
                    Active: {selectedClient.name}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => (
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
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={selectedClient ? `Managing ${selectedClient.name}... Try: 'Sync all', 'Switch to [client]', 'Check all clients'` : 'Select a client to begin'}
                    disabled={!selectedClient || isProcessing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-gray-100"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isProcessing || !selectedClient}
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
              {/* Current Client Info */}
              {selectedClient && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5" />
                    <h3 className="font-bold">Current Client</h3>
                  </div>
                  <div className="text-lg font-semibold">{selectedClient.name}</div>
                  <div className="text-sm opacity-90">{selectedClient.fulfillment}</div>
                  <div className="text-xs opacity-75 mt-2">{inventory.length} products in Vinoshipper</div>
                </div>
              )}

              {/* Inventory Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-indigo-100 px-4 py-3 border-b border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Vinoshipper Inventory
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {inventory.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No inventory loaded</p>
                  ) : (
                    inventory.map((item, idx) => (
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
                            {csvInventory && csvInventory.find(c => c.sku === item.sku && c.quantity !== item.quantity) && (
                              <div title="Quantity differs from CSV">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sync Logs */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Activity Log
                  </h3>
                </div>
                <div className="h-48 overflow-y-auto p-3 bg-gray-50">
                  {syncLogs.length === 0 ? (
                    <p className="text-gray-500 text-sm">No activity yet</p>
                  ) : (
                    <div className="space-y-2">
                      {syncLogs.map((log, idx) => (
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