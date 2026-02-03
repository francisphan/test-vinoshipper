import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock Tauri API
Object.defineProperty(global.window, '__TAURI_INTERNALS__', {
  value: {},
  writable: true,
  configurable: true,
});

// Create a proper localStorage mock
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Create instance and attach to global
const localStorageMock = new LocalStorageMock();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});
