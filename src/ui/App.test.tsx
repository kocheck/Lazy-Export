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

/** Extract the pluginMessages sent to the parent from a postMessage spy. */
function pluginMessages(
  spy: ReturnType<typeof vi.spyOn>
): Array<{ type: string; [k: string]: unknown }> {
  return spy.mock.calls
    .map(
      (call: [unknown, ...unknown[]]) =>
        (call[0] as { pluginMessage?: { type: string } } | undefined)?.pluginMessage
    )
    .filter(
      (m: { type: string } | undefined): m is { type: string; [k: string]: unknown } => Boolean(m)
    );
}

const clearBtn = () => screen.getByText('Clear Export Settings').closest('button')!;

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

describe('App busy-state acks (F4)', () => {
  beforeEach(() => {
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    window.onmessage = null;
  });

  it('apply: marks the clicked card busy, disables others, resets on apply-complete', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });

    fireEvent.click(screen.getByLabelText(/Apply iOS/i));

    expect(screen.getByLabelText(/Apply iOS/i)).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText(/Apply Web/i)).toBeDisabled();
    expect(clearBtn()).toBeDisabled();

    postFromPlugin({ type: 'apply-complete' });

    expect(screen.getByLabelText(/Apply iOS/i)).not.toHaveAttribute('aria-busy');
    expect(screen.getByLabelText(/Apply Web/i)).not.toBeDisabled();
    expect(clearBtn()).not.toBeDisabled();
  });

  it('apply: invalid-custom-name also clears the busy state', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
    fireEvent.click(screen.getByLabelText(/Apply iOS/i));
    expect(screen.getByLabelText(/Apply iOS/i)).toHaveAttribute('aria-busy', 'true');

    postFromPlugin({ type: 'invalid-custom-name', message: 'bad name' });
    expect(screen.getByLabelText(/Apply iOS/i)).not.toHaveAttribute('aria-busy');
  });

  it('clear: marks Clear busy + disabled, resets on clear-complete', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });

    fireEvent.click(clearBtn());
    expect(clearBtn()).toHaveAttribute('aria-busy', 'true');
    expect(clearBtn()).toBeDisabled();
    expect(screen.getByLabelText(/Apply iOS/i)).toBeDisabled();

    postFromPlugin({ type: 'clear-complete' });
    expect(clearBtn()).not.toHaveAttribute('aria-busy');
    expect(screen.getByLabelText(/Apply iOS/i)).not.toBeDisabled();
  });

  it('delete: confirmed delete locks other controls until success', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
    postFromPlugin({
      type: 'preferences-loaded',
      preferences: { customPresets: [examplePreset], advancedModeEnabled: false },
    });

    fireEvent.click(screen.getByTitle('Delete preset')); // arm
    fireEvent.click(screen.getByTitle('Click again to confirm deletion')); // confirm

    expect(screen.queryByText('My Custom Preset')).not.toBeInTheDocument(); // optimistic removal
    expect(screen.getByLabelText(/Apply iOS/i)).toBeDisabled();
    expect(clearBtn()).toBeDisabled();

    postFromPlugin({ type: 'success', message: 'Preset deleted' });
    expect(screen.getByLabelText(/Apply iOS/i)).not.toBeDisabled();
  });

  it('error clears the busy state for any in-flight op', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
    fireEvent.click(clearBtn());
    expect(clearBtn()).toBeDisabled();

    postFromPlugin({ type: 'error', message: 'Something failed' });
    expect(clearBtn()).not.toHaveAttribute('aria-busy');
    expect(screen.getByLabelText(/Apply iOS/i)).not.toBeDisabled();
  });
});

describe('App save lifecycle (F3)', () => {
  let postSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    postSpy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    window.onmessage = null;
  });

  function openCreatorAndSave(name: string) {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
    postFromPlugin({
      type: 'preferences-loaded',
      preferences: { customPresets: [], advancedModeEnabled: false },
    });
    fireEvent.click(screen.getByText('+ Create Custom Preset'));
    fireEvent.change(screen.getByPlaceholderText(/My Custom Preset/i), { target: { value: name } });
    fireEvent.click(screen.getByText('Save Preset'));
  }

  it('keeps the creator open and Save busy after posting save-preset', () => {
    openCreatorAndSave('Brand New');

    expect(pluginMessages(postSpy).some((m) => m.type === 'save-preset')).toBe(true);
    expect(screen.getByText('Save Preset')).toBeInTheDocument(); // still open
    expect(screen.getByText('Save Preset').closest('button')!).toHaveAttribute('aria-busy', 'true');
  });

  it('closes the creator and commits the optimistic preset on success', () => {
    openCreatorAndSave('Brand New');
    postFromPlugin({ type: 'success', message: 'Preset saved successfully' });

    expect(screen.queryByText('Save Preset')).not.toBeInTheDocument(); // closed
    expect(screen.getByText('Brand New')).toBeInTheDocument(); // committed
  });

  it('keeps the creator open and reloads authoritative data on error', () => {
    openCreatorAndSave('Will Fail');
    postSpy.mockClear();
    postFromPlugin({ type: 'error', message: 'Save failed' });

    expect(screen.getByText('Save Preset')).toBeInTheDocument(); // still open
    expect(pluginMessages(postSpy).some((m) => m.type === 'get-preferences')).toBe(true);
  });
});

describe('App delete confirmation lifecycle (#3)', () => {
  beforeEach(() => {
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.onmessage = null;
  });

  function setupArmed() {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
    postFromPlugin({
      type: 'preferences-loaded',
      preferences: { customPresets: [examplePreset], advancedModeEnabled: false },
    });
    fireEvent.click(screen.getByTitle('Delete preset'));
    expect(screen.getByTitle('Click again to confirm deletion')).toBeInTheDocument();
  }

  it('auto-disarms an armed delete after 3000ms', () => {
    setupArmed();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTitle('Delete preset')).toBeInTheDocument();
    expect(screen.queryByTitle('Click again to confirm deletion')).not.toBeInTheDocument();
  });

  it('disarms an armed delete on Escape', () => {
    setupArmed();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTitle('Delete preset')).toBeInTheDocument();
  });

  it('disarms an armed delete on selection change', () => {
    setupArmed();
    postFromPlugin({ type: 'selection-changed', count: 2 });
    expect(screen.getByTitle('Delete preset')).toBeInTheDocument();
  });
});

describe('App toast timing (#7)', () => {
  beforeEach(() => {
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.onmessage = null;
  });

  it('auto-dismisses a success toast after 3000ms', () => {
    render(<App />);
    postFromPlugin({ type: 'success', message: 'Saved!' });
    expect(screen.getByText('Saved!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('keeps an iOS-metadata export-success toast past 10000ms', () => {
    render(<App />);
    postFromPlugin({
      type: 'export-success',
      message: 'Applied! Copy Contents.json',
      metadata: { iosContentsJson: '{"images":[]}' },
    });
    expect(screen.getByText('Applied! Copy Contents.json')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByText('Applied! Copy Contents.json')).toBeInTheDocument();
  });

  it('a new toast cancels the previous auto-dismiss timer', () => {
    render(<App />);
    postFromPlugin({ type: 'success', message: 'First' });
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    postFromPlugin({ type: 'success', message: 'Second' });
    // If the first timer were still live, +1ms would fire it and clear the toast.
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('First')).not.toBeInTheDocument();
  });
});

describe('App accessibility announcements (#14)', () => {
  beforeEach(() => {
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.onmessage = null;
  });

  it('announces the selection count in the live region (debounced ~300ms)', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 2 });
    expect(screen.getByRole('status')).not.toHaveTextContent('2 layers selected');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole('status')).toHaveTextContent('2 layers selected');
  });

  it('announces "No layers selected" when the selection is cleared', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 0 });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole('status')).toHaveTextContent('No layers selected');
  });

  it('announces the delete-arm confirmation', () => {
    render(<App />);
    postFromPlugin({ type: 'selection-changed', count: 1 });
    postFromPlugin({
      type: 'preferences-loaded',
      preferences: { customPresets: [examplePreset], advancedModeEnabled: false },
    });
    fireEvent.click(screen.getByTitle('Delete preset'));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Press delete again to confirm removing My Custom Preset.'
    );
  });
});
