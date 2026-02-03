import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConfiguration } from './useConfiguration';
import * as keyringService from '../services/keyringService';

vi.mock('../services/keyringService');

describe('useConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfiguration', () => {
    it('should load saved API key from keyring', async () => {
      vi.spyOn(keyringService, 'getCredential').mockResolvedValue('sk-ant-test-key');

      const { result } = renderHook(() => useConfiguration());

      let savedKey: string | null = null;
      await act(async () => {
        savedKey = await result.current.loadConfiguration();
      });

      expect(savedKey).toBe('sk-ant-test-key');
      expect(result.current.claudeApiKey).toBe('sk-ant-test-key');
    });

    it('should return null when no key is saved', async () => {
      vi.spyOn(keyringService, 'getCredential').mockResolvedValue(null);

      const { result } = renderHook(() => useConfiguration());

      let savedKey: string | null = null;
      await act(async () => {
        savedKey = await result.current.loadConfiguration();
      });

      expect(savedKey).toBeNull();
      expect(result.current.claudeApiKey).toBe('');
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(keyringService, 'getCredential').mockRejectedValue(
        new Error('Keyring error')
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useConfiguration());

      let savedKey: string | null = 'not-null';
      await act(async () => {
        savedKey = await result.current.loadConfiguration();
      });

      expect(savedKey).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load configuration:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveConfiguration', () => {
    it('should save API key to keyring', async () => {
      const saveCredentialSpy = vi
        .spyOn(keyringService, 'saveCredential')
        .mockResolvedValue();

      const { result } = renderHook(() => useConfiguration());

      await act(async () => {
        await result.current.saveConfiguration('sk-ant-new-key');
      });

      expect(saveCredentialSpy).toHaveBeenCalledWith(
        'claude_api_key',
        'sk-ant-new-key'
      );
      expect(result.current.claudeApiKey).toBe('sk-ant-new-key');
      expect(result.current.isConfigured).toBe(true);
    });

    it('should throw error if save fails', async () => {
      const error = new Error('Save failed');
      vi.spyOn(keyringService, 'saveCredential').mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useConfiguration());

      await expect(
        act(async () => {
          await result.current.saveConfiguration('sk-ant-key');
        })
      ).rejects.toThrow('Save failed');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save configuration:',
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe('state management', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useConfiguration());

      expect(result.current.claudeApiKey).toBe('');
      expect(result.current.isConfigured).toBe(false);
    });

    it('should allow manual state updates', () => {
      const { result } = renderHook(() => useConfiguration());

      act(() => {
        result.current.setClaudeApiKey('manual-key');
        result.current.setIsConfigured(true);
      });

      expect(result.current.claudeApiKey).toBe('manual-key');
      expect(result.current.isConfigured).toBe(true);
    });
  });
});
