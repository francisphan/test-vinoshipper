import React, { useState } from 'react';
import { Settings as SettingsIcon, Users } from 'lucide-react';
import { Client } from '../types';
import { ClientManager } from './ClientManager';

interface SettingsProps {
  claudeApiKey: string;
  onClaudeApiKeyChange: (key: string) => void;
  clients: Client[];
  onAddClient: (name: string, apiKey: string, fulfillment: string) => void;
  onRemoveClient: (clientId: string) => void;
  onSave: () => void;
  onCancel?: () => void;
  isConfigured: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  claudeApiKey,
  onClaudeApiKeyChange,
  clients,
  onAddClient,
  onRemoveClient,
  onSave,
  onCancel,
  isConfigured,
}) => {
  const [showClientManager, setShowClientManager] = useState(false);

  const handleSave = () => {
    if (!claudeApiKey.trim()) {
      alert('Please enter your Claude API key');
      return;
    }

    if (clients.length === 0) {
      alert('Please add at least one client account');
      return;
    }

    onSave();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-purple-600" />
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
              onChange={(e) => onClaudeApiKeyChange(e.target.value)}
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
              <ClientManager
                clients={clients}
                onAddClient={onAddClient}
                onRemoveClient={onRemoveClient}
              />
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Save & Connect
          </button>

          {isConfigured && onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
