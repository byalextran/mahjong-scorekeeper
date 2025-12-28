import { beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});
