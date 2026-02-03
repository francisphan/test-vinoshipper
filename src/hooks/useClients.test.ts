import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClients } from './useClients';
import * as keyringService from '../services/keyringService';
import { Client } from '../types';

vi.mock('../services/keyringService');

describe('useClients', () => {
  const mockClients: Client[] = [
    {
      id: '1',
      name: 'Test Winery',
      apiKey: 'test-key-1',
      fulfillment: 'Hydra (NY)',
    },
    {
      id: '2',
      name: 'Demo Vineyard',
      apiKey: 'test-key-2',
      fulfillment: 'ShipEz (CA)',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadClients', () => {
    it('should load clients from keyring', async () => {
      vi.spyOn(keyringService, 'getCredential').mockResolvedValue(
        JSON.stringify(mockClients)
      );

      const { result } = renderHook(() => useClients());

      let clients: Client[] = [];
      await act(async () => {
        clients = await result.current.loadClients();
      });

      expect(clients).toEqual(mockClients);
      expect(result.current.clients).toEqual(mockClients);
      expect(result.current.selectedClient).toEqual(mockClients[0]);
    });

    it('should return empty array when no clients saved', async () => {
      vi.spyOn(keyringService, 'getCredential').mockResolvedValue(null);

      const { result } = renderHook(() => useClients());

      let clients: Client[] = [{ id: '1' } as Client];
      await act(async () => {
        clients = await result.current.loadClients();
      });

      expect(clients).toEqual([]);
      expect(result.current.clients).toEqual([]);
      expect(result.current.selectedClient).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(keyringService, 'getCredential').mockRejectedValue(
        new Error('Keyring error')
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useClients());

      let clients: Client[] | null = null;
      await act(async () => {
        clients = await result.current.loadClients();
      });

      expect(clients).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load clients:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveClients', () => {
    it('should save clients to keyring', async () => {
      const saveCredentialSpy = vi
        .spyOn(keyringService, 'saveCredential')
        .mockResolvedValue();

      const { result } = renderHook(() => useClients());

      await act(async () => {
        await result.current.saveClients(mockClients);
      });

      expect(saveCredentialSpy).toHaveBeenCalledWith(
        'clients',
        JSON.stringify(mockClients)
      );
      expect(result.current.clients).toEqual(mockClients);
    });

    it('should throw error if save fails', async () => {
      const error = new Error('Save failed');
      vi.spyOn(keyringService, 'saveCredential').mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useClients());

      await expect(
        act(async () => {
          await result.current.saveClients(mockClients);
        })
      ).rejects.toThrow('Save failed');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save clients:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('addClient', () => {
    it('should add a new client', async () => {
      vi.spyOn(keyringService, 'saveCredential').mockResolvedValue();

      const { result } = renderHook(() => useClients());

      let newClient: Client | null = null;
      await act(async () => {
        newClient = await result.current.addClient(
          'New Winery',
          'new-api-key',
          'Hydra (NY)'
        );
      });

      expect(newClient).toMatchObject({
        name: 'New Winery',
        apiKey: 'new-api-key',
        fulfillment: 'Hydra (NY)',
      });
      expect(newClient?.id).toBeDefined();
      expect(result.current.clients).toHaveLength(1);
      expect(result.current.selectedClient).toEqual(newClient);
    });

    it('should add client to existing list', async () => {
      vi.spyOn(keyringService, 'getCredential').mockResolvedValue(
        JSON.stringify([mockClients[0]])
      );
      vi.spyOn(keyringService, 'saveCredential').mockResolvedValue();

      const { result } = renderHook(() => useClients());

      await act(async () => {
        await result.current.loadClients();
      });

      await act(async () => {
        await result.current.addClient('Another Winery', 'another-key');
      });

      expect(result.current.clients).toHaveLength(2);
      expect(result.current.clients[1].name).toBe('Another Winery');
      // Should not change selected client when adding to existing list
      expect(result.current.selectedClient).toEqual(mockClients[0]);
    });

    it('should use default fulfillment when not provided', async () => {
      vi.spyOn(keyringService, 'saveCredential').mockResolvedValue();

      const { result } = renderHook(() => useClients());

      let newClient: Client | null = null;
      await act(async () => {
        newClient = await result.current.addClient('Test', 'key');
      });

      expect(newClient?.fulfillment).toBe('Hydra (NY)');
    });
  });

  describe('removeClient', () => {
    it('should remove a client', async () => {
      vi.spyOn(keyringService, 'getCredential').mockResolvedValue(
        JSON.stringify(mockClients)
      );
      vi.spyOn(keyringService, 'saveCredential').mockResolvedValue();

      const { result } = renderHook(() => useClients());

      await act(async () => {
        await result.current.loadClients();
      });

      let remaining: Client[] = [];
      await act(async () => {
        remaining = await result.current.removeClient('1');
      });

      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('2');
      expect(result.current.clients).toEqual([mockClients[1]]);
    });

    it('should update selected client when removing current selection', async () => {
      vi.spyOn(keyringService, 'getCredential').mockResolvedValue(
        JSON.stringify(mockClients)
      );
      vi.spyOn(keyringService, 'saveCredential').mockResolvedValue();

      const { result } = renderHook(() => useClients());

      await act(async () => {
        await result.current.loadClients();
      });

      // Remove the first client (which is selected by default)
      await act(async () => {
        await result.current.removeClient('1');
      });

      expect(result.current.selectedClient).toEqual(mockClients[1]);
    });

    it('should set selected client to null when removing last client', async () => {
      vi.spyOn(keyringService, 'getCredential').mockResolvedValue(
        JSON.stringify([mockClients[0]])
      );
      vi.spyOn(keyringService, 'saveCredential').mockResolvedValue();

      const { result } = renderHook(() => useClients());

      await act(async () => {
        await result.current.loadClients();
      });

      await act(async () => {
        await result.current.removeClient('1');
      });

      expect(result.current.selectedClient).toBeNull();
      expect(result.current.clients).toEqual([]);
    });
  });

  describe('switchClient', () => {
    it('should switch to a different client', async () => {
      vi.spyOn(keyringService, 'getCredential').mockResolvedValue(
        JSON.stringify(mockClients)
      );

      const { result } = renderHook(() => useClients());

      await act(async () => {
        await result.current.loadClients();
      });

      let switched: Client | null = null;
      act(() => {
        switched = result.current.switchClient(mockClients[1]);
      });

      expect(switched).toEqual(mockClients[1]);
      expect(result.current.selectedClient).toEqual(mockClients[1]);
    });
  });

  describe('state management', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useClients());

      expect(result.current.clients).toEqual([]);
      expect(result.current.selectedClient).toBeNull();
    });

    it('should allow manual state updates', () => {
      const { result } = renderHook(() => useClients());

      act(() => {
        result.current.setSelectedClient(mockClients[0]);
      });

      expect(result.current.selectedClient).toEqual(mockClients[0]);
    });
  });
});
