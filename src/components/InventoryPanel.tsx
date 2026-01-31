import React from 'react';
import { Package, RefreshCw, Building2, AlertCircle } from 'lucide-react';
import { InventoryItem, CSVItem, SyncLog, Client } from '../types';

interface InventoryPanelProps {
  selectedClient: Client | null;
  inventory: InventoryItem[];
  csvInventory: CSVItem[] | null;
  syncLogs: SyncLog[];
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  selectedClient,
  inventory,
  csvInventory,
  syncLogs,
}) => {
  return (
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
                    <span
                      className={`font-bold ${
                        item.quantity === 0
                          ? 'text-red-600'
                          : item.quantity < 10
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {item.quantity}
                    </span>
                    {csvInventory &&
                      csvInventory.find(
                        c => c.sku === item.sku && c.quantity !== item.quantity
                      ) && (
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
                  <span
                    className={`flex-1 ${
                      log.type === 'success'
                        ? 'text-green-700'
                        : log.type === 'error'
                        ? 'text-red-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
