import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App.js';
import { CUSTOM_NAME_ERROR } from '../shared/customName.js';

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
