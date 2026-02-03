import { useState, useCallback } from 'react';
import { Client } from '../types';
import { KEYRING_KEYS, FULFILLMENT_OPTIONS } from '../constants';
import { getCredential, saveCredential } from '../services/keyringService';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const loadClients = useCallback(async () => {
    try {
      const savedClients = await getCredential(KEYRING_KEYS.clients);
      if (savedClients) {
        const parsedClients = JSON.parse(savedClients);
        setClients(parsedClients);
        if (parsedClients.length > 0) {
          setSelectedClient(parsedClients[0]);
        }
        return parsedClients;
      }
      return [];
    } catch (error) {
      console.error('Failed to load clients:', error);
      return [];
    }
  }, []);

  const saveClients = useCallback(async (clientsToSave: Client[]) => {
    try {
      await saveCredential(KEYRING_KEYS.clients, JSON.stringify(clientsToSave));
      setClients(clientsToSave);
    } catch (error) {
      console.error('Failed to save clients:', error);
      throw error;
    }
  }, []);

  const addClient = useCallback(async (name: string, apiKey: string, fulfillment: string = FULFILLMENT_OPTIONS[0]) => {
    const newClient: Client = {
      id: Date.now().toString(),
      name,
      apiKey,
      fulfillment,
    };

    const updatedClients = [...clients, newClient];
    await saveClients(updatedClients);

    if (!selectedClient) {
      setSelectedClient(newClient);
    }

    return newClient;
  }, [clients, selectedClient, saveClients]);

  const removeClient = useCallback(async (clientId: string) => {
    const updatedClients = clients.filter(c => c.id !== clientId);
    await saveClients(updatedClients);

    if (selectedClient?.id === clientId) {
      setSelectedClient(updatedClients[0] || null);
    }

    return updatedClients;
  }, [clients, selectedClient, saveClients]);

  const switchClient = useCallback((client: Client) => {
    setSelectedClient(client);
    return client;
  }, []);

  return {
    clients,
    selectedClient,
    setSelectedClient,
    loadClients,
    saveClients,
    addClient,
    removeClient,
    switchClient,
  };
};
