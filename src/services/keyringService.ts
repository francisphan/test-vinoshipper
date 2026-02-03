/**
 * Keyring Service
 *
 * Provides secure credential storage using the OS-native keyring:
 * - Windows: Credential Manager
 * - macOS: Keychain
 * - Linux: Secret Service
 */

import { invoke } from '@tauri-apps/api/core';
import { KEYRING_SERVICE, KEYRING_KEYS, STORAGE_KEYS } from '../constants';

/**
 * Check if we're running in Tauri (desktop app) or browser
 */
export const isTauriApp = (): boolean => {
  return '__TAURI_INTERNALS__' in window;
};

/**
 * Save a credential to the OS keyring
 */
export const saveCredential = async (key: string, value: string): Promise<void> => {
  if (!isTauriApp()) {
    // Fallback to localStorage for browser/development
    localStorage.setItem(key, value);
    return;
  }

  try {
    await invoke('save_credential', {
      service: KEYRING_SERVICE,
      key,
      value,
    });
  } catch (error) {
    console.error('Failed to save credential to keyring:', error);
    // Fallback to localStorage if keyring fails
    localStorage.setItem(key, value);
    throw new Error(`Failed to save credential: ${error}`);
  }
};

/**
 * Get a credential from the OS keyring
 */
export const getCredential = async (key: string): Promise<string | null> => {
  if (!isTauriApp()) {
    // Fallback to localStorage for browser/development
    return localStorage.getItem(key);
  }

  try {
    const value = await invoke<string | null>('get_credential', {
      service: KEYRING_SERVICE,
      key,
    });
    return value;
  } catch (error) {
    console.error('Failed to get credential from keyring:', error);
    // Fallback to localStorage if keyring fails
    return localStorage.getItem(key);
  }
};

/**
 * Delete a credential from the OS keyring
 */
export const deleteCredential = async (key: string): Promise<void> => {
  if (!isTauriApp()) {
    // Fallback to localStorage for browser/development
    localStorage.removeItem(key);
    return;
  }

  try {
    await invoke('delete_credential', {
      service: KEYRING_SERVICE,
      key,
    });
  } catch (error) {
    console.error('Failed to delete credential from keyring:', error);
    // Fallback to localStorage if keyring fails
    localStorage.removeItem(key);
  }
};

/**
 * Migrate credentials from localStorage to keyring
 * This should be called once on app startup
 */
export const migrateFromLocalStorage = async (): Promise<boolean> => {
  if (!isTauriApp()) {
    console.log('Not running in Tauri, skipping migration');
    return false;
  }

  try {
    // Check if migration has already been done
    const migrated = await getCredential(KEYRING_KEYS.migrated);
    if (migrated === 'true') {
      console.log('Migration already completed');
      return false;
    }

    let migrationOccurred = false;

    // Migrate clients
    const clients = localStorage.getItem(STORAGE_KEYS.clients);
    if (clients) {
      console.log('Migrating clients to keyring...');
      await saveCredential(KEYRING_KEYS.clients, clients);
      migrationOccurred = true;
    }

    // Mark migration as complete
    await saveCredential(KEYRING_KEYS.migrated, 'true');

    // Clear localStorage only after successful migration
    if (migrationOccurred) {
      localStorage.removeItem(STORAGE_KEYS.clients);
      console.log('Migration completed successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to migrate credentials:', error);
    // Don't clear localStorage if migration failed
    return false;
  }
};

/**
 * Clear all credentials (for logout/reset)
 */
export const clearAllCredentials = async (): Promise<void> => {
  try {
    await deleteCredential(KEYRING_KEYS.clients);
    await deleteCredential(KEYRING_KEYS.migrated);
  } catch (error) {
    console.error('Failed to clear credentials:', error);
  }
};
