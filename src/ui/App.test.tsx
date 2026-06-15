import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import App from './App.js';
import { CUSTOM_NAME_ERROR } from '../shared/customName.js';
import type { CustomPreset, PluginMessage, UIMessage } from '../shared/types.js';

function postFromPlugin(pluginMessage: unknown) {
  act(() => {
    if (window.onmessage) {
      window.onmessage(new MessageEvent('message', { data: { pluginMessage } }));
    }
  });
}

function postRaw(data: unknown) {
  act(() => {
    if (window.onmessage) {
      window.onmessage(new MessageEvent('message', { data }));
    }
  });
}

describe('App window message handling (F3)', () => {
  let postSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    postSpy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    postSpy.mockRestore();
    window.onmessage = null;
  });

  it('does not throw on a stray message with no pluginMessage', () => {
    render(<App />);
    expect(() => postRaw(undefined)).not.toThrow();
    expect(() => postRaw('a plain string from some extension')).not.toThrow();
    expect(() => postRaw({ somethingElse: true })).not.toThrow();
  });

  it('still handles a valid selection-changed message', () => {
    render(<App />);
    expect(screen.getByText('No selection')).toBeInTheDocument();

    postFromPlugin({ type: 'selection-changed', count: 2 });

    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });
});

describe('App customName contract (F10)', () => {
  let postSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    postSpy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    postSpy.mockRestore();
    window.onmessage = null;
  });

  function renderWithSelection() {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
  }

  it('rejects an invalid custom name with the inline message and posts no apply', () => {
    renderWithSelection();

    const input = screen.getByPlaceholderText('e.g., icon-home');
    fireEvent.change(input, { target: { value: 'icon/home' } });

    const iosCard = screen.getByText('iOS');
    fireEvent.click(iosCard);

    expect(screen.getByText(CUSTOM_NAME_ERROR)).toBeInTheDocument();

    const applyCalls = postSpy.mock.calls.filter(
      ([payload]: [unknown, ...unknown[]]) =>
        typeof payload === 'object' &&
        payload !== null &&
        (payload as { pluginMessage?: { type?: string } }).pluginMessage?.type === 'apply-preset'
    );
    expect(applyCalls).toHaveLength(0);
  });

  it('posts apply-preset with the trimmed name for a valid custom name', () => {
    renderWithSelection();

    const input = screen.getByPlaceholderText('e.g., icon-home');
    fireEvent.change(input, { target: { value: '  icon-home  ' } });

    const iosCard = screen.getByText('iOS');
    fireEvent.click(iosCard);

    expect(screen.queryByText(CUSTOM_NAME_ERROR)).not.toBeInTheDocument();

    const applyCall = postSpy.mock.calls.find(
      ([payload]: [unknown, ...unknown[]]) =>
        typeof payload === 'object' &&
        payload !== null &&
        (payload as { pluginMessage?: { type?: string } }).pluginMessage?.type === 'apply-preset'
    );
    expect(applyCall).toBeDefined();
    const sent = (applyCall![0] as { pluginMessage: { customName?: string } }).pluginMessage;
    expect(sent.customName).toBe('icon-home');
  });
});

/** Deliver a PluginMessage to App's window.onmessage handler. */
function deliverPref(message: PluginMessage): void {
  // jsdom: window.dispatchEvent does NOT trigger window.onmessage property.
  // Must invoke directly. Wrap in act() to flush React state updates.
  act(() => {
    if (typeof window.onmessage === 'function') {
      window.onmessage(new MessageEvent('message', { data: { pluginMessage: message } }));
    }
  });
}

describe('App preference wiring', () => {
  let postSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    postSpy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    postSpy.mockRestore();
    vi.restoreAllMocks();
    window.onmessage = null;
  });

  function sentMessages(): Array<{ type: string; [k: string]: unknown }> {
    return postSpy.mock.calls
      .map((call: [unknown, ...unknown[]]) => (call[0] as { pluginMessage?: { type: string } } | undefined)?.pluginMessage)
      .filter((m: { type: string } | undefined): m is { type: string; [k: string]: unknown } => Boolean(m));
  }

  it('posts save-preferences when Advanced Mode is toggled', () => {
    render(<App />);
    // selection-changed needed so the toggle renders
    deliverPref({ type: 'selection-changed', count: 1 });

    const toggle = screen.getByLabelText('Advanced Mode');
    fireEvent.click(toggle);

    const save = sentMessages().find((m) => m.type === 'save-preferences');
    expect(save).toBeDefined();
    expect(save?.advancedModeEnabled).toBe(true);
  });

  it('reflects advancedModeEnabled from preferences-loaded', () => {
    render(<App />);
    deliverPref({ type: 'selection-changed', count: 1 });
    deliverPref({
      type: 'preferences-loaded',
      preferences: { customPresets: [], advancedModeEnabled: true },
    });

    const toggle = screen.getByLabelText('Advanced Mode') as HTMLInputElement;
    expect(toggle.checked).toBe(true);
  });

  it('posts record-preset-usage when a preset is applied', () => {
    render(<App />);
    deliverPref({ type: 'selection-changed', count: 1 });

    // Find and click the iOS preset card
    const iosCard = screen.getByLabelText(/Apply iOS/i);
    fireEvent.click(iosCard);

    const usage = sentMessages().find((m) => m.type === 'record-preset-usage');
    expect(usage).toBeDefined();
    expect(usage?.presetId).toBe('ios');
  });

  it('renders the last-used badge on the matching preset card after preferences-loaded', () => {
    render(<App />);
    deliverPref({ type: 'selection-changed', count: 1 });
    deliverPref({
      type: 'preferences-loaded',
      preferences: { customPresets: [], advancedModeEnabled: false, lastUsedPreset: 'web' },
    });

    const webCard = screen.getByLabelText(/Apply Web/i);
    expect(within(webCard).getByText(/Last used/i)).toBeInTheDocument();

    const iosCard = screen.getByLabelText(/Apply iOS/i);
    expect(within(iosCard).queryByText(/Last used/i)).not.toBeInTheDocument();
  });
});

const examplePreset: CustomPreset = {
  id: 'custom-1',
  name: 'My Custom Preset',
  platform: 'iOS',
  icon: '⚙️',
  isCustom: true,
  createdAt: 1,
  settings: [{ format: 'PNG', suffix: '@2x', constraint: { type: 'SCALE', value: 2 } }],
};

describe('App message routing', () => {
  beforeEach(() => {
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.onmessage = null;
  });

  it('updates the selection count on selection-changed', () => {
    render(<App />);
    expect(screen.getByText(/No selection/i)).toBeInTheDocument();

    postFromPlugin({ type: 'selection-changed', count: 3 });
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });

  it('renders custom presets after preferences-loaded (with a selection)', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
    postFromPlugin({
      type: 'preferences-loaded',
      preferences: { customPresets: [examplePreset], advancedModeEnabled: false },
    });

    expect(screen.getByText('My Custom Preset')).toBeInTheDocument();
  });

  it('shows an error toast on error messages', () => {
    render(<App />);
    postFromPlugin({ type: 'error', message: 'Something failed' });
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('export-success with iosContentsJson metadata surfaces the Copy Contents.json button', () => {
    render(<App />);
    postFromPlugin({
      type: 'export-success',
      message: '✅ Applied! Copy Contents.json required for Xcode.',
      metadata: { iosContentsJson: '{"images":[],"info":{"author":"Lazy Export","version":1}}' },
    });
    expect(screen.getByText('Copy Contents.json')).toBeInTheDocument();
  });

  it('export-success without metadata does not surface the Copy Contents.json button', () => {
    render(<App />);
    postFromPlugin({ type: 'export-success', message: '✅ Applied!' });
    expect(screen.queryByText('Copy Contents.json')).not.toBeInTheDocument();
  });
});

describe('App optimistic CRUD', () => {
  let postSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    postSpy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.onmessage = null;
  });

  it('optimistically removes a preset on delete after two-step confirm', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
    postFromPlugin({
      type: 'preferences-loaded',
      preferences: { customPresets: [examplePreset], advancedModeEnabled: false },
    });

    expect(screen.getByText('My Custom Preset')).toBeInTheDocument();

    // First click arms the button — no deletion yet.
    fireEvent.click(screen.getByTitle('Delete preset'));
    expect(screen.getByText('My Custom Preset')).toBeInTheDocument();
    const sentAfterArm = postSpy.mock.calls.filter(
      (c: [unknown, ...unknown[]]) => (c[0] as { pluginMessage: UIMessage }).pluginMessage.type === 'delete-preset'
    );
    expect(sentAfterArm).toHaveLength(0);

    // Second click (confirm) deletes.
    fireEvent.click(screen.getByTitle('Click again to confirm deletion'));
    expect(screen.queryByText('My Custom Preset')).not.toBeInTheDocument();

    const sent = postSpy.mock.calls.map(
      (c: [unknown, ...unknown[]]) => (c[0] as { pluginMessage: UIMessage }).pluginMessage
    );
    expect(sent).toContainEqual({ type: 'delete-preset', presetId: 'custom-1' });
  });

  it('does not delete when the first (arm) click is not followed by confirm', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
    postFromPlugin({
      type: 'preferences-loaded',
      preferences: { customPresets: [examplePreset], advancedModeEnabled: false },
    });

    // Only one click — arms but doesn't confirm.
    fireEvent.click(screen.getByTitle('Delete preset'));

    expect(screen.getByText('My Custom Preset')).toBeInTheDocument();
    const deletes = postSpy.mock.calls.filter(
      (c: [unknown, ...unknown[]]) => (c[0] as { pluginMessage: UIMessage }).pluginMessage.type === 'delete-preset'
    );
    expect(deletes).toHaveLength(0);
  });
});
