import { useState, useCallback } from 'react';
import { KEYRING_KEYS } from '../constants';
import { getCredential, saveCredential } from '../services/keyringService';

export const useConfiguration = () => {
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const loadConfiguration = useCallback(async () => {
    try {
      const savedKey = await getCredential(KEYRING_KEYS.claudeApiKey);
      if (savedKey) {
        setClaudeApiKey(savedKey);
        return savedKey;
      }
      return null;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  }, []);

  const saveConfiguration = useCallback(async (apiKey: string) => {
    try {
      await saveCredential(KEYRING_KEYS.claudeApiKey, apiKey);
      setClaudeApiKey(apiKey);
      setIsConfigured(true);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
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
