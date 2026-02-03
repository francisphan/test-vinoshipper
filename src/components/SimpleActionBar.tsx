import React from 'react';
import { Upload, RefreshCw, GitCompare, CheckCircle, AlertCircle } from 'lucide-react';
import { Client } from '../types';

interface SimpleActionBarProps {
  selectedClient: Client | null;
  csvFileName: string | null;
  hasCsvData: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSyncAll: () => void;
  onCompare: () => void;
  onCheckAllClients: () => void;
  isProcessing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const SimpleActionBar: React.FC<SimpleActionBarProps> = ({
  selectedClient,
  csvFileName,
  hasCsvData,
  onFileUpload,
  onSyncAll,
  onCompare,
  onCheckAllClients,
  isProcessing,
  fileInputRef,
}) => {
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
        {selectedClient && (
          <span className="text-sm text-gray-600">
            Active: <span className="font-medium text-purple-600">{selectedClient.name}</span>
          </span>
        )}
      </div>

      {!selectedClient && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            Please select a client to get started
          </p>
        </div>
      )}

      {/* CSV Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Upload CSV Inventory
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={onFileUpload}
          className="hidden"
          disabled={!selectedClient}
        />
        <button
          onClick={handleUploadClick}
          disabled={!selectedClient || isProcessing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          <Upload className="w-5 h-5" />
          {csvFileName ? `Change File (${csvFileName})` : 'Choose CSV File'}
        </button>
        {csvFileName && (
          <p className="text-xs text-gray-600 text-center">
            Loaded: {csvFileName}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onSyncAll}
          disabled={!selectedClient || !hasCsvData || isProcessing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? 'Syncing...' : 'Sync All to Vinoshipper'}
        </button>

        <button
          onClick={onCompare}
          disabled={!selectedClient || !hasCsvData || isProcessing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          <GitCompare className="w-5 h-5" />
          Compare Inventory
        </button>

        <button
          onClick={onCheckAllClients}
          disabled={!selectedClient || isProcessing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          <CheckCircle className="w-5 h-5" />
          Check All Clients
        </button>
      </div>

      {hasCsvData && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ CSV data loaded and ready to sync
          </p>
        </div>
      )}
    </div>
  );
};
