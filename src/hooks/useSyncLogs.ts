import { useState, useCallback } from 'react';
import { SyncLog } from '../types';

export const useSyncLogs = () => {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  const addSyncLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const newLog: SyncLog = {
      message,
      type,
      timestamp: new Date(),
    };
    setSyncLogs(prev => [...prev, newLog]);
  }, []);

  const clearSyncLogs = useCallback(() => {
    setSyncLogs([]);
  }, []);

  return {
    syncLogs,
    addSyncLog,
    clearSyncLogs,
  };
};
