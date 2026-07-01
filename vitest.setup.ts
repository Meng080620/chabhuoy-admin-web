import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom in this setup doesn't expose Web Storage, but zustand's `persist`
// middleware (used by the auth store) writes to localStorage on every state
// change. Provide a minimal in-memory implementation so persisted stores work.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  const localStorageMock: Storage = {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, String(value))
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }
  globalThis.localStorage = localStorageMock
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
