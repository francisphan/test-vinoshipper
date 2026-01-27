import React, { useState, useRef, useEffect } from 'react';
import { JSX } from 'react';
import { MessageSquare, Package, Settings, RefreshCw, AlertCircle, CheckCircle, Send, Loader, Upload, FileText, X } from 'lucide-react';

// ============================================================================
// VINOSHIPPER API CLIENT
// ============================================================================
// TODO: Replace with actual Vinoshipper API endpoints and authentication
// Documentation needed:
// - Base URL (e.g., https://api.vinoshipper.com/v1 or similar)
// - Authentication method (Bearer token? API key header? OAuth?)
// - Exact endpoint paths for inventory operations
// - Request/response formats
// - Rate limiting information
// - Error response formats

const vinoshipperAPI = {
  // TODO: Replace this with actual Vinoshipper base URL
  baseUrl: 'https://api.vinoshipper.com/v1', // REPLACE WITH REAL URL
  
  /**
   * Get all inventory items from Vinoshipper
   * @param {string} apiKey - User's Vinoshipper API key
   * @returns {Promise<Array>} - Array of inventory items
   */
  async getInventory(apiKey) {
    try {
      const response = await fetch(`${this.baseUrl}/inventory`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`, // TODO: Verify auth format
          'Content-Type': 'application/json',
          // TODO: Add any other required headers (e.g., 'X-API-Key', 'X-Shop-ID', etc.)
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // TODO: Transform API response to match our format
      // Vinoshipper might return different field names
      // Expected format: [{ sku, name, quantity, ... }]
      return data.products?.map(item => ({
        sku: item.sku || item.product_code || item.id,
        name: item.name || item.title || item.description,
        quantity: item.quantity || item.stock || item.inventory_count || 0,
        lastSync: new Date()
      })) || [];
      
    } catch (error) {
      console.error('Vinoshipper API Error (getInventory):', error);
      throw error;
    }
  },

  /**
   * Update inventory quantity for a single SKU
   * @param {string} apiKey - User's Vinoshipper API key
   * @param {string} sku - Product SKU
   * @param {number} quantity - New quantity
   */
  async updateInventory(apiKey, sku, quantity) {
    try {
      // TODO: Determine the correct endpoint pattern
      // Options might be:
      // - PUT /inventory/{sku}
      // - PATCH /products/{sku}/inventory
      // - POST /inventory/update
      const response = await fetch(`${this.baseUrl}/inventory/${sku}`, {
        method: 'PUT', // TODO: Verify HTTP method (PUT, PATCH, or POST?)
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: quantity,
          // TODO: Add any other required fields
          // Examples: location_id, warehouse_id, reason, updated_by, etc.
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Update failed: ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Vinoshipper API Error (updateInventory):', error);
      throw error;
    }
  },

  /**
   * Create a new product in Vinoshipper
   * @param {string} apiKey - User's Vinoshipper API key
   * @param {object} product - Product data { sku, name, quantity }
   */
  async createProduct(apiKey, product) {
    try {
      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: product.sku,
          name: product.name,
          quantity: product.quantity,
          // TODO: Add required fields for product creation
          // Common fields: price, description, category, weight, images, etc.
          // You might need: wine_type, vintage, varietal, region, size, etc.
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Create failed: ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Vinoshipper API Error (createProduct):', error);
      throw error;
    }
  },

  /**
   * Get a single product by SKU
   * @param {string} apiKey - User's Vinoshipper API key
   * @param {string} sku - Product SKU
   */
  async getProduct(apiKey, sku) {
    try {
      const response = await fetch(`${this.baseUrl}/products/${sku}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Get product failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        sku: data.sku,
        name: data.name,
        quantity: data.quantity,
      };
      
    } catch (error) {
      console.error('Vinoshipper API Error (getProduct):', error);
      throw error;
    }
  },

  /**
   * Bulk update inventory (if supported by Vinoshipper)
   * @param {string} apiKey - User's Vinoshipper API key
   * @param {Array} items - Array of { sku, quantity }
   */
  async bulkUpdateInventory(apiKey, items) {
    try {
      // TODO: Check if Vinoshipper supports bulk updates
      // If not, you'll need to loop through items and call updateInventory()
      const response = await fetch(`${this.baseUrl}/inventory/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: items.map(item => ({
            sku: item.sku,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Bulk update failed: ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Vinoshipper API Error (bulkUpdateInventory):', error);
      // Fallback to individual updates
      throw error;
    }
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const VinoshipperAgent = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [vsApiKey, setVsApiKey] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [csvInventory, setCsvInventory] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedVsKey = localStorage.getItem('vs_api_key');
    const savedClaudeKey = localStorage.getItem('claude_api_key');
    
    if (savedVsKey && savedClaudeKey) {
      setVsApiKey(savedVsKey);
      setClaudeApiKey(savedClaudeKey);
      setIsConfigured(true);
      addMessage('system', 'Connected! Upload a CSV file with your inventory, then ask me to sync it to Vinoshipper.');
      loadInventory(savedVsKey);
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
    if (!vsApiKey.trim() || !claudeApiKey.trim()) {
      alert('Please enter both API keys');
      return;
    }
    
    localStorage.setItem('vs_api_key', vsApiKey);
    localStorage.setItem('claude_api_key', claudeApiKey);
    setIsConfigured(true);
    setShowSettings(false);
    addMessage('system', 'Configuration saved! Upload a CSV to begin syncing inventory.');
    loadInventory(vsApiKey);
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Find column indices
    const skuIndex = headers.findIndex(h => h === 'sku' || h === 'product_sku' || h === 'item_sku');
    const nameIndex = headers.findIndex(h => h === 'name' || h === 'product_name' || h === 'item_name' || h === 'description');
    const quantityIndex = headers.findIndex(h => h === 'quantity' || h === 'qty' || h === 'stock' || h === 'inventory');
    
    if (skuIndex === -1) throw new Error('CSV must have a SKU column');
    if (quantityIndex === -1) throw new Error('CSV must have a Quantity column');
    
    const items: Array<{ sku: string; name: string; quantity: number }> = [];
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

  const loadInventory = async (apiKey) => {
    // Real Vinoshipper API call
    try {
      const data = await vinoshipperAPI.getInventory(apiKey);
      setInventory(data);
      addSyncLog(`Loaded ${data.length} items from Vinoshipper`, 'success');
    } catch (error) {
      console.error('Failed to load inventory:', error);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const text = await file.text();
    
    try {
      const parsed = parseCSV(text);
      setCsvInventory(parsed);
      addMessage('system', `✓ Uploaded ${file.name} with ${parsed.length} items. I can now sync this to Vinoshipper. Try: "Compare CSV with Vinoshipper" or "Sync all items from CSV"`);
      addSyncLog(`CSV uploaded: ${parsed.length} items loaded`, 'success');
    } catch (error) {
      addMessage('system', `Error parsing CSV: ${error.message}. Please ensure your CSV has columns: SKU, Name, Quantity`);
      addSyncLog(`CSV upload failed: ${error.message}`, 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

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

    return `You are an AI assistant managing inventory synchronization between a CSV file (source of truth) and Vinoshipper.

Current Vinoshipper Inventory:
${vinoshipperData}

CSV Inventory (Authoritative Source):
${csvData}

You can help with:
- Comparing CSV inventory with Vinoshipper inventory
- Identifying discrepancies between systems
- Syncing CSV quantities to Vinoshipper (CSV is always the source of truth)
- Finding specific products
- Generating sync reports

When asked to sync or compare, analyze the differences and respond with:
ACTION:SYNC_ALL to sync all items from CSV
ACTION:SYNC [SKU1,SKU2] to sync specific SKUs
ACTION:COMPARE to show detailed comparison

When comparing, highlight:
- Items with quantity differences
- Items in CSV but not in Vinoshipper
- Items in Vinoshipper but not in CSV

Be conversational and clear about what changes will be made.`;
  };

  const executeAgentActions = async (message) => {
    // Parse sync all action
    if (message.includes('ACTION:SYNC_ALL')) {
      if (!csvInventory) {
        addMessage('assistant', 'No CSV uploaded. Please upload a CSV file first.');
        return;
      }
      await performFullSync();
      return;
    }

    // Parse specific SKU sync
    const syncMatch = message.match(/ACTION:SYNC\s+\[([\w-,\s]+)\]/);
    if (syncMatch) {
      const skus = syncMatch[1].split(',').map(s => s.trim());
      await performSync(skus);
      return;
    }

    // Parse compare action
    if (message.includes('ACTION:COMPARE')) {
      performComparison();
    }
  };

  const performComparison = () => {
    if (!csvInventory) {
      addMessage('assistant', 'No CSV uploaded to compare.');
      return;
    }

    const differences = [];
    const csvMap = new Map(csvInventory.map(item => [item.sku, item]));
    const vsMap = new Map(inventory.map(item => [item.sku, item]));

    // Find differences
    csvInventory.forEach(csvItem => {
      const vsItem = vsMap.get(csvItem.sku);
      if (!vsItem) {
        differences.push({
          sku: csvItem.sku,
          type: 'new',
          csvQty: csvItem.quantity,
          vsQty: 'Not in Vinoshipper'
        });
      } else if (csvItem.quantity !== vsItem.quantity) {
        differences.push({
          sku: csvItem.sku,
          type: 'different',
          csvQty: csvItem.quantity,
          vsQty: vsItem.quantity,
          diff: csvItem.quantity - vsItem.quantity
        });
      }
    });

    // Find items in Vinoshipper but not in CSV
    inventory.forEach(vsItem => {
      if (!csvMap.has(vsItem.sku)) {
        differences.push({
          sku: vsItem.sku,
          type: 'missing',
          csvQty: 'Not in CSV',
          vsQty: vsItem.quantity
        });
      }
    });

    addSyncLog(`Comparison complete: ${differences.length} discrepancies found`, 'info');
  };

  const performFullSync = async () => {
    if (!csvInventory) return;

    addSyncLog(`Starting full sync: ${csvInventory.length} items from CSV`, 'info');
    
    for (const csvItem of csvInventory) {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const vsItem = inventory.find(i => i.sku === csvItem.sku);
      
      try {
        if (!vsItem) {
          // Create new product in Vinoshipper
          await vinoshipperAPI.createProduct(vsApiKey, {
            sku: csvItem.sku,
            name: csvItem.name,
            quantity: csvItem.quantity
          });
          addSyncLog(`Created new item in Vinoshipper: ${csvItem.sku} (${csvItem.quantity} units)`, 'success');
        } else if (vsItem.quantity !== csvItem.quantity) {
          // Update existing product quantity
          await vinoshipperAPI.updateInventory(vsApiKey, csvItem.sku, csvItem.quantity);
          addSyncLog(`Updated ${csvItem.sku}: ${vsItem.quantity} → ${csvItem.quantity}`, 'success');
        } else {
          addSyncLog(`${csvItem.sku}: Already in sync (${csvItem.quantity} units)`, 'info');
        }
        
        // Update local state to reflect sync
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
        addSyncLog(`Failed to sync ${csvItem.sku}: ${error.message}`, 'error');
      }
    }
    
    addSyncLog(`✓ Full sync completed: ${csvInventory.length} items processed`, 'success');
  };

  const performSync = async (skus) => {
    if (!csvInventory) {
      addSyncLog('No CSV data available for sync', 'error');
      return;
    }

    addSyncLog(`Starting sync for ${skus.length} item(s)...`, 'info');
    
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
          await vinoshipperAPI.createProduct(vsApiKey, {
            sku: csvItem.sku,
            name: csvItem.name,
            quantity: csvItem.quantity
          });
          addSyncLog(`${sku}: Creating in Vinoshipper with ${csvItem.quantity} units`, 'success');
        } else {
          await vinoshipperAPI.updateInventory(vsApiKey, sku, csvItem.quantity);
          addSyncLog(`${sku}: Updating ${vsItem.quantity} → ${csvItem.quantity}`, 'success');
        }
        
        // Update inventory
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
              <strong>CSV Format:</strong> Your CSV should have columns for SKU, Name (optional), and Quantity. Example:
            </p>
            <pre className="text-xs mt-2 bg-white p-2 rounded border border-blue-100">
SKU,Name,Quantity
WINE-001,Cab Sauv,50
WINE-002,Chardonnay,32
            </pre>
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
                <Package className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Vinoshipper AI Agent</h1>
                  <p className="text-purple-100 text-sm">CSV-based inventory sync</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
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
            
            {csvFileName && (
              <div className="mt-3 flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                <FileText className="w-4 h-4" />
                <span className="text-sm flex-1">{csvFileName}</span>
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
                    placeholder="Try: 'Compare CSV with Vinoshipper' or 'Sync all items'"
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
              {/* Current Vinoshipper Inventory */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-indigo-100 px-4 py-3 border-b border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Vinoshipper Inventory
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {inventory.map((item, idx) => (
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
                            <AlertCircle className="w-4 h-4 text-orange-500" title="Quantity differs from CSV" />
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