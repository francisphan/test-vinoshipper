import React, { useState, useRef, useEffect } from 'react';
import { Client } from './types';
import { parseCSV, CSVParseError } from './utils/csvParser';
import {
  useClients,
  useInventory,
  useMessages,
  useSyncLogs,
  useConfiguration,
} from './hooks';
import {
  sendMessage,
  sendDemoMessage,
  buildSystemPrompt,
  executeAgentActions,
  performFullSync,
  performPartialSync,
  checkAllClients,
} from './services';
import {
  Header,
  Settings,
  ChatInterface,
  InventoryPanel,
} from './components';

const VinoshipperAgent: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    claudeApiKey,
    setClaudeApiKey,
    isConfigured,
    setIsConfigured,
    loadConfiguration,
    saveConfiguration,
  } = useConfiguration();

  const {
    clients,
    selectedClient,
    setSelectedClient,
    loadClients,
    saveClients,
    addClient,
    removeClient,
    switchClient,
  } = useClients();

  const {
    inventory,
    csvInventory,
    setCsvInventory,
    csvFileName,
    setCsvFileName,
    loadInventory,
    updateInventoryItem,
    clearCsvInventory,
  } = useInventory();

  const { messages, addMessage } = useMessages();
  const { syncLogs, addSyncLog } = useSyncLogs();

  // Initialize on mount
  useEffect(() => {
    const savedKey = loadConfiguration();
    const savedClients = loadClients();

    if (savedClients.length > 0 && savedKey) {
      setIsConfigured(true);
      addMessage(
        'system',
        `Managing ${savedClients.length} client account(s). Currently viewing: ${savedClients[0].name}`
      );
      loadInventory(savedClients[0].apiKey);
    }
  }, []);

  // Demo mode handler
  const handleEnterDemoMode = () => {
    // Set up demo clients
    const demoClients: Client[] = [
      { id: 'demo-1', name: 'Demo Winery', apiKey: 'demo-key', fulfillment: 'Hydra (NY)' },
      { id: 'demo-2', name: 'Sample Vineyards', apiKey: 'demo-key-2', fulfillment: 'ShipEz (CA)' },
    ];

    saveClients(demoClients);
    setSelectedClient(demoClients[0]);
    setIsDemoMode(true);
    setIsConfigured(true);

    addMessage('system', `Welcome to Demo Mode! Managing 2 sample wine producer accounts.

You can try commands like:
• "Sync all items"
• "Switch to Sample Vineyards"
• "Check all clients"
• "Compare inventory"

Note: This is a demonstration with simulated data.`);

    addSyncLog('Demo mode activated', 'success');
  };

  // Handlers
  const handleSaveConfiguration = () => {
    if (!claudeApiKey.trim()) {
      alert('Please enter your Claude API key');
      return;
    }

    if (clients.length === 0) {
      alert('Please add at least one client account');
      return;
    }

    saveConfiguration(claudeApiKey);
    saveClients(clients);
    setShowSettings(false);
    addMessage('system', `Configuration saved! Managing ${clients.length} client(s).`);

    if (selectedClient) {
      loadInventory(selectedClient.apiKey);
    }
  };

  const handleAddClient = (name: string, apiKey: string, fulfillment: string) => {
    const newClient = addClient(name, apiKey, fulfillment);
    addSyncLog(`Added client: ${newClient.name}`, 'success');
  };

  const handleRemoveClient = (clientId: string) => {
    const updatedClients = removeClient(clientId);

    if (selectedClient?.id === clientId && updatedClients.length > 0) {
      loadInventory(updatedClients[0].apiKey);
    }
  };

  const handleSwitchClient = (client: Client) => {
    switchClient(client);
    addMessage('system', `Switched to: ${client.name}`);
    addSyncLog(`Switched to client: ${client.name}`, 'info');
    loadInventory(client.apiKey);
    clearCsvInventory();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClient) return;

    setCsvFileName(file.name);
    const text = await file.text();

    try {
      const parsed = parseCSV(text);
      setCsvInventory(parsed);
      addMessage(
        'system',
        `✓ Uploaded ${file.name} with ${parsed.length} items for ${selectedClient.name}. Ready to sync!`
      );
      addSyncLog(`CSV uploaded: ${parsed.length} items for ${selectedClient.name}`, 'success');
    } catch (error) {
      const errorMsg = error instanceof CSVParseError ? error.message : String(error);
      addMessage('system', `Error parsing CSV: ${errorMsg}`);
      addSyncLog(`CSV upload failed: ${errorMsg}`, 'error');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing || !selectedClient) return;

    const userMsg = inputMessage;
    setInputMessage('');
    addMessage('user', userMsg);
    setIsProcessing(true);

    try {
      let response: string;

      if (isDemoMode) {
        response = await sendDemoMessage(userMsg);
      } else {
        const systemPrompt = buildSystemPrompt(clients, selectedClient, inventory, csvInventory);
        response = await sendMessage(claudeApiKey, userMsg, systemPrompt);
      }

      addMessage('assistant', response);
      await executeAgentActions(response, {
        onSwitchClient: (clientName) => {
          const client = clients.find(c =>
            c.name.toLowerCase().includes(clientName.toLowerCase())
          );
          if (client) {
            handleSwitchClient(client);
          } else {
            addMessage(
              'assistant',
              `Client "${clientName}" not found. Available clients: ${clients.map(c => c.name).join(', ')}`
            );
          }
        },
        onCheckAllClients: async () => {
          await checkAllClients(clients, addSyncLog);
        },
        onSyncAll: async () => {
          if (!csvInventory) {
            addMessage('assistant', 'No CSV uploaded. Please upload a CSV file first.');
            return;
          }
          if (!selectedClient) return;

          await performFullSync(selectedClient, csvInventory, inventory, {
            onLog: addSyncLog,
            onInventoryUpdate: updateInventoryItem,
          });
        },
        onSyncPartial: async (skus) => {
          if (!csvInventory || !selectedClient) return;

          await performPartialSync(selectedClient, skus, csvInventory, inventory, {
            onLog: addSyncLog,
            onInventoryUpdate: updateInventoryItem,
          });
        },
        onError: (message) => {
          addMessage('assistant', message);
        },
      });
    } catch (error) {
      console.error('Error calling Claude API:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addMessage('assistant', `Error: ${errorMsg}. Please check your API key in settings.`);
    }

    setIsProcessing(false);
  };

  // Render settings screen
  if (showSettings || !isConfigured) {
    return (
      <Settings
        claudeApiKey={claudeApiKey}
        onClaudeApiKeyChange={setClaudeApiKey}
        clients={clients}
        onAddClient={handleAddClient}
        onRemoveClient={handleRemoveClient}
        onSave={handleSaveConfiguration}
        onCancel={isConfigured ? () => setShowSettings(false) : undefined}
        onDemoMode={handleEnterDemoMode}
        isConfigured={isConfigured}
      />
    );
  }

  // Render main interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <Header
            clients={clients}
            selectedClient={selectedClient}
            onClientSwitch={handleSwitchClient}
            onUpload={() => fileInputRef.current?.click()}
            onSettings={() => setShowSettings(true)}
            csvFileName={csvFileName}
            csvItemCount={csvInventory?.length || 0}
            onClearCsv={() => {
              clearCsvInventory();
              addMessage('system', 'CSV cleared. Upload a new file to sync inventory.');
            }}
            fileInputRef={fileInputRef}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            <ChatInterface
              messages={messages}
              inputMessage={inputMessage}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              selectedClient={selectedClient}
            />

            <InventoryPanel
              selectedClient={selectedClient}
              inventory={inventory}
              csvInventory={csvInventory}
              syncLogs={syncLogs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VinoshipperAgent;
