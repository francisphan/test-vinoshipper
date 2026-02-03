import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveCredential,
  getCredential,
  deleteCredential,
  migrateFromLocalStorage,
  clearAllCredentials,
  isTauriApp,
} from './keyringService';
import { KEYRING_KEYS, STORAGE_KEYS } from '../constants';

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

describe('keyringService', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    localStorage.clear();
  });

  describe('isTauriApp', () => {
    it('should return true when __TAURI_INTERNALS__ is defined', () => {
      expect(isTauriApp()).toBe(true);
    });

    it('should return false when __TAURI_INTERNALS__ is not defined', () => {
      const originalTauri = (window as any).__TAURI_INTERNALS__;
      delete (window as any).__TAURI_INTERNALS__;

      expect(isTauriApp()).toBe(false);

      (window as any).__TAURI_INTERNALS__ = originalTauri;
    });
  });

  describe('saveCredential', () => {
    it('should call Tauri invoke with correct parameters', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await saveCredential('test_key', 'test_value');

      expect(mockInvoke).toHaveBeenCalledWith('save_credential', {
        service: 'com.peyto.vinoshipper',
        key: 'test_key',
        value: 'test_value',
      });
    });

    it('should fallback to localStorage on error', async () => {
      mockInvoke.mockRejectedValue(new Error('Keyring not available'));

      await expect(
        saveCredential('test_key', 'test_value')
      ).rejects.toThrow('Failed to save credential');

      expect(localStorage.getItem('test_key')).toBe('test_value');
    });

    it('should use localStorage when not in Tauri app', async () => {
      const originalTauri = (window as any).__TAURI_INTERNALS__;
      delete (window as any).__TAURI_INTERNALS__;

      await saveCredential('test_key', 'test_value');

      expect(mockInvoke).not.toHaveBeenCalled();
      expect(localStorage.getItem('test_key')).toBe('test_value');

      (window as any).__TAURI_INTERNALS__ = originalTauri;
    });
  });

  describe('getCredential', () => {
    it('should call Tauri invoke and return value', async () => {
      mockInvoke.mockResolvedValue('stored_value');

      const result = await getCredential('test_key');

      expect(mockInvoke).toHaveBeenCalledWith('get_credential', {
        service: 'com.peyto.vinoshipper',
        key: 'test_key',
      });
      expect(result).toBe('stored_value');
    });

    it('should return null when credential not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await getCredential('nonexistent_key');

      expect(result).toBeNull();
    });

    it('should fallback to localStorage on error', async () => {
      mockInvoke.mockRejectedValue(new Error('Keyring error'));
      localStorage.setItem('test_key', 'fallback_value');

      const result = await getCredential('test_key');

      expect(result).toBe('fallback_value');
    });

    it('should use localStorage when not in Tauri app', async () => {
      const originalTauri = (window as any).__TAURI_INTERNALS__;
      delete (window as any).__TAURI_INTERNALS__;

      localStorage.setItem('test_key', 'browser_value');
      const result = await getCredential('test_key');

      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toBe('browser_value');

      (window as any).__TAURI_INTERNALS__ = originalTauri;
    });
  });

  describe('deleteCredential', () => {
    it('should call Tauri invoke to delete credential', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await deleteCredential('test_key');

      expect(mockInvoke).toHaveBeenCalledWith('delete_credential', {
        service: 'com.peyto.vinoshipper',
        key: 'test_key',
      });
    });

    it('should fallback to localStorage on error', async () => {
      mockInvoke.mockRejectedValue(new Error('Keyring error'));
      localStorage.setItem('test_key', 'value_to_delete');

      await deleteCredential('test_key');

      expect(localStorage.getItem('test_key')).toBeNull();
    });

    it('should use localStorage when not in Tauri app', async () => {
      const originalTauri = (window as any).__TAURI_INTERNALS__;
      delete (window as any).__TAURI_INTERNALS__;

      localStorage.setItem('test_key', 'value');
      await deleteCredential('test_key');

      expect(mockInvoke).not.toHaveBeenCalled();
      expect(localStorage.getItem('test_key')).toBeNull();

      (window as any).__TAURI_INTERNALS__ = originalTauri;
    });
  });

  describe('migrateFromLocalStorage', () => {
    it('should return false when not in Tauri app', async () => {
      const originalTauri = (window as any).__TAURI_INTERNALS__;
      delete (window as any).__TAURI_INTERNALS__;

      const result = await migrateFromLocalStorage();

      expect(result).toBe(false);
      expect(mockInvoke).not.toHaveBeenCalled();

      (window as any).__TAURI_INTERNALS__ = originalTauri;
    });

    it('should return false if migration already completed', async () => {
      mockInvoke.mockResolvedValue('true');

      const result = await migrateFromLocalStorage();

      expect(result).toBe(false);
      expect(mockInvoke).toHaveBeenCalledWith('get_credential', {
        service: 'com.peyto.vinoshipper',
        key: KEYRING_KEYS.migrated,
      });
    });

    it('should migrate Claude API key from localStorage', async () => {
      localStorage.setItem(STORAGE_KEYS.claudeApiKey, 'sk-ant-test-key');
      mockInvoke
        .mockResolvedValueOnce(null) // Migration flag check
        .mockResolvedValueOnce(undefined) // Save Claude key
        .mockResolvedValueOnce(undefined); // Save migration flag

      const result = await migrateFromLocalStorage();

      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('save_credential', {
        service: 'com.peyto.vinoshipper',
        key: KEYRING_KEYS.claudeApiKey,
        value: 'sk-ant-test-key',
      });
      expect(localStorage.getItem(STORAGE_KEYS.claudeApiKey)).toBeNull();
    });

    it('should migrate clients from localStorage', async () => {
      const clients = [
        { id: '1', name: 'Client 1', apiKey: 'key1', fulfillment: 'Hydra (NY)' },
      ];
      localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
      mockInvoke
        .mockResolvedValueOnce(null) // Migration flag check
        .mockResolvedValueOnce(undefined) // Save clients
        .mockResolvedValueOnce(undefined); // Save migration flag

      const result = await migrateFromLocalStorage();

      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('save_credential', {
        service: 'com.peyto.vinoshipper',
        key: KEYRING_KEYS.clients,
        value: JSON.stringify(clients),
      });
      expect(localStorage.getItem(STORAGE_KEYS.clients)).toBeNull();
    });

    it('should handle migration errors gracefully', async () => {
      localStorage.setItem(STORAGE_KEYS.claudeApiKey, 'test-key');
      mockInvoke
        .mockResolvedValueOnce(null) // Migration flag check
        .mockRejectedValueOnce(new Error('Save failed')); // Save fails

      const result = await migrateFromLocalStorage();

      expect(result).toBe(false);
      // localStorage should not be cleared if migration fails
      expect(localStorage.getItem(STORAGE_KEYS.claudeApiKey)).toBe('test-key');
    });

    it('should return false when no data to migrate', async () => {
      mockInvoke.mockResolvedValueOnce(null); // Migration flag check

      const result = await migrateFromLocalStorage();

      expect(result).toBe(false);
    });
  });

  describe('clearAllCredentials', () => {
    it('should delete all credentials from keyring', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await clearAllCredentials();

      expect(mockInvoke).toHaveBeenCalledTimes(3);
      expect(mockInvoke).toHaveBeenCalledWith('delete_credential', {
        service: 'com.peyto.vinoshipper',
        key: KEYRING_KEYS.claudeApiKey,
      });
      expect(mockInvoke).toHaveBeenCalledWith('delete_credential', {
        service: 'com.peyto.vinoshipper',
        key: KEYRING_KEYS.clients,
      });
      expect(mockInvoke).toHaveBeenCalledWith('delete_credential', {
        service: 'com.peyto.vinoshipper',
        key: KEYRING_KEYS.migrated,
      });
    });

    it('should handle errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Delete failed'));

      await expect(clearAllCredentials()).resolves.not.toThrow();
    });
  });
});
