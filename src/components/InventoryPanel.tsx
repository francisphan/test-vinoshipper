import React from 'react';
import { Package, RefreshCw, Building2, AlertCircle, Clock } from 'lucide-react';
import { InventoryItem, CSVItem, SyncLog, Client } from '../types';

interface InventoryPanelProps {
  selectedClient: Client | null;
  inventory: InventoryItem[];
  csvInventory: CSVItem[] | null;
  syncLogs: SyncLog[];
  lastFetched: Date | null;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function formatPrice(price?: number): string {
  if (price == null) return '--';
  return `$${price.toFixed(2)}`;
}

const statusBadge = (status?: string) => {
  switch (status) {
    case 'active':
      return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">Active</span>;
    case 'inactive':
      return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-500">Inactive</span>;
    case 'sold_out':
      return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-600">Sold Out</span>;
    default:
      return <span className="text-gray-300 text-xs">--</span>;
  }
};

const categoryBadge = (category?: string) => {
  if (!category) return <span className="text-gray-300 text-xs">--</span>;
  const colors: Record<string, string> = {
    red: 'bg-red-50 text-red-700',
    white: 'bg-yellow-50 text-yellow-700',
    rosé: 'bg-pink-50 text-pink-700',
    rose: 'bg-pink-50 text-pink-700',
    sparkling: 'bg-blue-50 text-blue-700',
  };
  const colorClass = colors[category.toLowerCase()] || 'bg-gray-50 text-gray-600';
  return <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${colorClass}`}>{category}</span>;
};

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  selectedClient,
  inventory,
  csvInventory,
  syncLogs,
  lastFetched,
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
        <div className="bg-indigo-100 px-4 py-3 border-b border-indigo-200 flex items-center justify-between">
          <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Vinoshipper Inventory
          </h3>
          {lastFetched && (
            <span className="text-xs text-indigo-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {formatRelativeTime(lastFetched)}
            </span>
          )}
        </div>
        <div className="max-h-80 overflow-auto">
          {inventory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No inventory loaded</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Vintage</th>
                  <th className="px-3 py-2 font-medium">Size</th>
                  <th className="px-3 py-2 font-medium text-right">Price</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((item, idx) => {
                  const csvMismatch = csvInventory?.find(
                    c => c.sku === item.sku && c.quantity !== item.quantity
                  );
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">{item.sku}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate">{item.name}</td>
                      <td className="px-3 py-2">{categoryBadge(item.category)}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.vintage || '--'}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{item.bottleSize || '--'}</td>
                      <td className="px-3 py-2 text-right text-xs text-gray-700">{formatPrice(item.price)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className={`font-bold text-xs ${
                              item.quantity === 0
                                ? 'text-red-600'
                                : item.quantity < 10
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}
                          >
                            {item.quantity}
                          </span>
                          {csvMismatch && (
                            <div title={`CSV: ${csvMismatch.quantity}`}>
                              <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">{statusBadge(item.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
