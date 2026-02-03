import React, { useState, useRef, useEffect } from 'react';
import { Client } from './types';
import { parseCSV, CSVParseError } from './utils/csvParser';
import {
  useClients,
  useInventory,
  useSyncLogs,
  useConfiguration,
} from './hooks';
import {
  performFullSync,
  performPartialSync,
  checkAllClients,
} from './services';
import { migrateFromLocalStorage } from './services/keyringService';
import {
  Header,
  Settings,
  SimpleActionBar,
  InventoryPanel,
} from './components';

const VinoshipperAgent: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isConfigured,
    setIsConfigured,
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

  const { syncLogs, addSyncLog } = useSyncLogs();

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      // Attempt to migrate from localStorage to keyring
      try {
        const migrated = await migrateFromLocalStorage();
        if (migrated) {
          console.log('Successfully migrated credentials to secure storage');
        }
      } catch (error) {
        console.error('Migration failed:', error);
      }

      // Load clients
      const savedClients = await loadClients();

      if (savedClients.length > 0) {
        setIsConfigured(true);
        addSyncLog(`Managing ${savedClients.length} client account(s). Active: ${savedClients[0].name}`, 'info');
        loadInventory(savedClients[0].apiKey);
      }
    };

    initialize();
  }, []);

  // Demo mode handler
  const handleEnterDemoMode = async () => {
    // Set up demo clients
    const demoClients: Client[] = [
      { id: 'demo-1', name: 'Demo Winery', apiKey: 'demo-key', fulfillment: 'Hydra (NY)' },
      { id: 'demo-2', name: 'Sample Vineyards', apiKey: 'demo-key-2', fulfillment: 'ShipEz (CA)' },
    ];

    await saveClients(demoClients);
    setSelectedClient(demoClients[0]);
    setIsDemoMode(true);
    setIsConfigured(true);

    addSyncLog('Demo mode activated with 2 sample accounts', 'success');
  };

  // Handlers
  const handleSaveConfiguration = async () => {
    if (clients.length === 0) {
      alert('Please add at least one client account');
      return;
    }

    try {
      await saveClients(clients);
      setShowSettings(false);
      addSyncLog(`Configuration saved! Managing ${clients.length} client(s)`, 'success');

      if (selectedClient) {
        loadInventory(selectedClient.apiKey);
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  const handleAddClient = async (name: string, apiKey: string, fulfillment: string) => {
    try {
      const newClient = await addClient(name, apiKey, fulfillment);
      addSyncLog(`Added client: ${newClient.name}`, 'success');
    } catch (error) {
      console.error('Failed to add client:', error);
      alert('Failed to add client. Please try again.');
    }
  };

  const handleRemoveClient = async (clientId: string) => {
    try {
      const updatedClients = await removeClient(clientId);

      if (selectedClient?.id === clientId && updatedClients.length > 0) {
        loadInventory(updatedClients[0].apiKey);
      }
    } catch (error) {
      console.error('Failed to remove client:', error);
      alert('Failed to remove client. Please try again.');
    }
  };

  const handleSwitchClient = (client: Client) => {
    switchClient(client);
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
      addSyncLog(`CSV uploaded: ${parsed.length} items for ${selectedClient.name}`, 'success');
    } catch (error) {
      const errorMsg = error instanceof CSVParseError ? error.message : String(error);
      addSyncLog(`CSV upload failed: ${errorMsg}`, 'error');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSyncAll = async () => {
    if (!csvInventory || !selectedClient || isProcessing) return;

    setIsProcessing(true);
    addSyncLog('Starting full sync...', 'info');

    try {
      await performFullSync(selectedClient, csvInventory, inventory, {
        onLog: addSyncLog,
        onInventoryUpdate: updateInventoryItem,
      });
      addSyncLog('Full sync completed successfully', 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addSyncLog(`Sync failed: ${errorMsg}`, 'error');
    }

    setIsProcessing(false);
  };

  const handleCompare = () => {
    if (!csvInventory || !selectedClient) return;

    addSyncLog('Comparing CSV with Vinoshipper inventory...', 'info');

    const differences = csvInventory.filter(csvItem => {
      const vItem = inventory.find(i => i.sku === csvItem.sku);
      return !vItem || vItem.quantity !== csvItem.quantity;
    });

    if (differences.length === 0) {
      addSyncLog('✓ Inventories match perfectly!', 'success');
    } else {
      addSyncLog(`Found ${differences.length} item(s) with different quantities`, 'info');
      differences.slice(0, 5).forEach(item => {
        const vItem = inventory.find(i => i.sku === item.sku);
        if (vItem) {
          addSyncLog(`  ${item.sku}: CSV=${item.quantity}, Vinoshipper=${vItem.quantity}`, 'info');
        } else {
          addSyncLog(`  ${item.sku}: Not in Vinoshipper`, 'info');
        }
      });
      if (differences.length > 5) {
        addSyncLog(`  ... and ${differences.length - 5} more`, 'info');
      }
    }
  };

  const handleCheckAllClients = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    addSyncLog('Checking inventory for all clients...', 'info');

    try {
      await checkAllClients(clients, addSyncLog);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addSyncLog(`Check failed: ${errorMsg}`, 'error');
    }

    setIsProcessing(false);
  };

  // Render settings screen
  if (showSettings || !isConfigured) {
    return (
      <Settings
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
              addSyncLog('CSV cleared', 'info');
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
            <SimpleActionBar
              selectedClient={selectedClient}
              csvFileName={csvFileName}
              hasCsvData={!!csvInventory && csvInventory.length > 0}
              onFileUpload={handleFileUpload}
              onSyncAll={handleSyncAll}
              onCompare={handleCompare}
              onCheckAllClients={handleCheckAllClients}
              isProcessing={isProcessing}
              fileInputRef={fileInputRef}
            />

            <div className="lg:col-span-2">
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
    </div>
  );
};

export default VinoshipperAgent;
