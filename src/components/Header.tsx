import React from 'react';
import { Building2, Settings, Upload, FileText, X, Package } from 'lucide-react';
import { Client } from '../types';

interface HeaderProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSwitch: (client: Client) => void;
  onUpload: () => void;
  onSettings: () => void;
  csvFileName: string;
  csvItemCount: number;
  onClearCsv: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const Header: React.FC<HeaderProps> = ({
  clients,
  selectedClient,
  onClientSwitch,
  onUpload,
  onSettings,
  csvFileName,
  csvItemCount,
  onClearCsv,
  fileInputRef,
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Vinoshipper Multi-Client Manager</h1>
            <p className="text-purple-100 text-sm">
              Managing {clients.length} wine producer account(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onUpload}
            disabled={!selectedClient}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            Upload CSV
          </button>
          <button
            onClick={onSettings}
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
            onClick={() => onClientSwitch(client)}
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

      {/* CSV File Display */}
      {csvFileName && selectedClient && (
        <div className="mt-3 flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
          <FileText className="w-4 h-4" />
          <span className="text-sm flex-1">
            {csvFileName} ({selectedClient.name})
          </span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            {csvItemCount} items
          </span>
          <button onClick={onClearCsv} className="hover:bg-white/20 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
      />
    </div>
  );
};
