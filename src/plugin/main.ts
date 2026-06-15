/**
 * Lazy Export - Figma Plugin Main Entry Point
 *
 * Runs in the Figma plugin sandbox (no DOM access). This file is intentionally
 * thin: all logic lives in `core.ts` (importable + unit-tested). Here we only
 * perform the one side effect that must happen at plugin startup — wiring up
 * the command switch, the selection listener, and the UI message handler.
 *
 * @see ./core.ts for the implementation
 * @see ARCHITECTURE.md for detailed technical documentation
 */

import { initPlugin } from './core';

initPlugin();
