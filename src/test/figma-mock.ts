/**
 * Figma API Mock for Testing
 * 
 * This mock simulates the Figma Plugin API environment for unit tests.
 * It includes clientStorage, UI messaging, and node selection capabilities.
 */

import { vi, type Mock } from 'vitest';

export interface FigmaMock {
  clientStorage: {
    getAsync: Mock<(key: string) => Promise<unknown>>;
    setAsync: Mock<(key: string, value: unknown) => Promise<void>>;
  };
  ui: {
    postMessage: Mock<(pluginMessage: unknown) => void>;
  };
  currentPage: {
    selection: SceneNode[];
  };
  currentUser: {
    name: string;
    id: string;
  } | null;
  command: string;
  notify: Mock<(message: string, options?: unknown) => unknown>;
  showUI: Mock<(html: string, options?: unknown) => void>;
  on: Mock<(type: string, callback: () => void) => void>;
  closePlugin: Mock<(message?: string) => void>;
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
    command: 'openPlugin',
    notify: vi.fn(),
    showUI: vi.fn(),
    on: vi.fn(),
    closePlugin: vi.fn(),
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
