import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants';

export const useConfiguration = () => {
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const loadConfiguration = useCallback(() => {
    const savedKey = localStorage.getItem(STORAGE_KEYS.claudeApiKey);
    if (savedKey) {
      setClaudeApiKey(savedKey);
      return savedKey;
    }
    return null;
  }, []);

  const saveConfiguration = useCallback((apiKey: string) => {
    localStorage.setItem(STORAGE_KEYS.claudeApiKey, apiKey);
    setClaudeApiKey(apiKey);
    setIsConfigured(true);
  }, []);

  return {
    claudeApiKey,
    setClaudeApiKey,
    isConfigured,
    setIsConfigured,
    loadConfiguration,
    saveConfiguration,
  };
};
