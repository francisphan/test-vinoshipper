import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Client } from '../types';
import { FULFILLMENT_OPTIONS } from '../constants';

interface ClientManagerProps {
  clients: Client[];
  onAddClient: (name: string, apiKey: string, fulfillment: string) => void;
  onRemoveClient: (clientId: string) => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  onAddClient,
  onRemoveClient,
}) => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientApiKey, setNewClientApiKey] = useState('');
  const [newClientFulfillment, setNewClientFulfillment] = useState(FULFILLMENT_OPTIONS[0]);

  const handleAddClient = () => {
    if (!newClientName.trim() || !newClientApiKey.trim()) {
      alert('Please enter client name and API key');
      return;
    }

    onAddClient(newClientName, newClientApiKey, newClientFulfillment);
    setNewClientName('');
    setNewClientApiKey('');
    setNewClientFulfillment(FULFILLMENT_OPTIONS[0]);
  };

  const handleRemoveClient = (clientId: string) => {
    if (!confirm('Remove this client? This cannot be undone.')) return;
    onRemoveClient(clientId);
  };

  return (
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
          {FULFILLMENT_OPTIONS.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button
          onClick={handleAddClient}
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
                onClick={() => handleRemoveClient(client.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
