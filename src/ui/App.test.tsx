import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import App from './App.js';
import { CUSTOM_NAME_ERROR } from '../shared/customName.js';
import type { PluginMessage } from '../shared/types.js';

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
