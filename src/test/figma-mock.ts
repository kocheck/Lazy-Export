/**
 * Figma API Mock for Testing
 * 
 * This mock simulates the Figma Plugin API environment for unit tests.
 * It includes clientStorage, UI messaging, and node selection capabilities.
 */

import { vi } from 'vitest';

export interface FigmaMock {
  clientStorage: {
    getAsync: ReturnType<typeof vi.fn>;
    setAsync: ReturnType<typeof vi.fn>;
  };
  ui: {
    postMessage: ReturnType<typeof vi.fn>;
  };
  currentPage: {
    selection: SceneNode[];
  };
  currentUser: {
    name: string;
    id: string;
  } | null;
  notify: ReturnType<typeof vi.fn>;
  showUI: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
}

/**
 * Create a fresh Figma API mock
 * Call this in beforeEach() to reset state between tests
 */
export function createFigmaMock(): FigmaMock {
  const storage = new Map<string, unknown>();

  return {
    clientStorage: {
      getAsync: vi.fn(async (key: string) => storage.get(key)),
      setAsync: vi.fn(async (key: string, value: unknown) => {
        storage.set(key, value);
      }),
    },
    ui: {
      postMessage: vi.fn(),
    },
    currentPage: {
      selection: [],
    },
    currentUser: {
      name: 'Test User',
      id: 'test-user-id-12345',
    },
    notify: vi.fn(),
    showUI: vi.fn(),
    on: vi.fn(),
  };
}

/**
 * Install the Figma mock into the global scope
 * Use this in tests that import plugin code
 */
export function installFigmaMock(): FigmaMock {
  const mock = createFigmaMock();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).figma = mock;
  return mock;
}

/**
 * Create a mock SceneNode for testing
 */
export function createMockNode(overrides?: Partial<SceneNode>): SceneNode {
  return {
    id: 'test-node-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Node',
    exportSettings: [],
    type: 'FRAME',
    ...overrides,
  } as SceneNode;
}
