import { useState, useCallback } from 'react';
import { Client } from '../types';
import { STORAGE_KEYS, FULFILLMENT_OPTIONS } from '../constants';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const loadClients = useCallback(() => {
    const savedClients = localStorage.getItem(STORAGE_KEYS.clients);
    if (savedClients) {
      const parsedClients = JSON.parse(savedClients);
      setClients(parsedClients);
      if (parsedClients.length > 0) {
        setSelectedClient(parsedClients[0]);
      }
      return parsedClients;
    }
    return [];
  }, []);

  const saveClients = useCallback((clientsToSave: Client[]) => {
    localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clientsToSave));
    setClients(clientsToSave);
  }, []);

  const addClient = useCallback((name: string, apiKey: string, fulfillment: string = FULFILLMENT_OPTIONS[0]) => {
    const newClient: Client = {
      id: Date.now().toString(),
      name,
      apiKey,
      fulfillment,
    };

    const updatedClients = [...clients, newClient];
    saveClients(updatedClients);

    if (!selectedClient) {
      setSelectedClient(newClient);
    }

    return newClient;
  }, [clients, selectedClient, saveClients]);

  const removeClient = useCallback((clientId: string) => {
    const updatedClients = clients.filter(c => c.id !== clientId);
    saveClients(updatedClients);

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
