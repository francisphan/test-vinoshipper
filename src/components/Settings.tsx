import React, { useState } from 'react';
import { Settings as SettingsIcon, Users } from 'lucide-react';
import { Client } from '../types';
import { ClientManager } from './ClientManager';

interface SettingsProps {
  clients: Client[];
  onAddClient: (name: string, apiKey: string, fulfillment: string) => void;
  onRemoveClient: (clientId: string) => void;
  onSave: () => void;
  onCancel?: () => void;
  onDemoMode?: () => void;
  isConfigured: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  clients,
  onAddClient,
  onRemoveClient,
  onSave,
  onCancel,
  onDemoMode,
  isConfigured,
}) => {
  const [showClientManager, setShowClientManager] = useState(false);

  const handleSave = () => {
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

          {!isConfigured && onDemoMode && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={onDemoMode}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-semibold border border-gray-300"
              >
                Try Demo Mode (No API Keys Required)
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Demo mode uses mock data and simulated AI responses
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
