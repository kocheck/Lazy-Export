# Testing Guide

This document explains the testing infrastructure for Lazy Export and how to run, write, and maintain tests.

## Overview

The Lazy Export plugin uses **Vitest** for unit and component testing, with **React Testing Library** for UI components. We maintain **93.82% code coverage** on business logic.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (during development)
npm test -- --watch

# Run tests with coverage report
npm run test:coverage

# Open interactive UI for running tests
npm run test:ui
```

## Test Structure

```
src/
├── plugin/
│   └── main.test.ts          # Plugin logic tests
├── shared/
│   └── sanitizeLog.test.ts   # Utility function tests
├── ui/
│   └── components/
│       ├── Button.test.tsx
│       ├── Input.test.tsx
│       ├── Toggle.test.tsx
│       ├── PresetCard.test.tsx
│       ├── ErrorBoundary.test.tsx
│       └── Toast.test.tsx
└── test/
    ├── setup.ts              # Test environment setup
    └── figma-mock.ts         # Figma API mocks
```

## Writing Tests

### Plugin Tests

Plugin tests use Figma API mocks to simulate the plugin sandbox environment:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { installFigmaMock, createMockNode } from '../test/figma-mock.js';

describe('Plugin Feature', () => {
  let figmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('should apply settings to node', () => {
    const node = createMockNode();
    node.exportSettings = [/* ... */];
    expect(node.exportSettings.length).toBe(1);
  });
});
```

### Component Tests

Component tests use React Testing Library:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent.js';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

## Figma API Mocks

The `src/test/figma-mock.ts` file provides mock implementations of Figma's plugin API:

- **clientStorage**: In-memory key-value storage
- **ui.postMessage**: Mock message passing
- **currentPage.selection**: Mock node selection
- **currentUser**: Mock user data
- **notify**: Mock notification system

Example usage:

```typescript
const figmaMock = installFigmaMock();

// Mock storage operations
await figmaMock.clientStorage.setAsync('key', { data: 'value' });
const data = await figmaMock.clientStorage.getAsync('key');

// Mock node selection
figmaMock.currentPage.selection = [createMockNode()];
```

## Coverage Goals

- **Business Logic**: 100% coverage target
- **UI Components**: 90%+ coverage
- **Utilities**: 100% coverage

Excluded from coverage:
- CSS files
- Test files
- Type definitions
- Configuration files
- Entry points (main.tsx)

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad: Testing implementation details
expect(component.state.isOpen).toBe(true);

// ✅ Good: Testing user-visible behavior
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => { /* ... */ });

// ✅ Good
it('should display error message when form submission fails', () => { /* ... */ });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should save preset when button is clicked', () => {
  // Arrange
  const onSave = vi.fn();
  render(<PresetCreator onSave={onSave} />);
  
  // Act
  const saveButton = screen.getByText('Save');
  fireEvent.click(saveButton);
  
  // Assert
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    name: 'My Preset'
  }));
});
```

### 4. Clean Up After Tests

The test setup file automatically cleans up after each test using React Testing Library's `cleanup()`. For async operations, ensure proper cleanup:

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
```

## Common Testing Scenarios

### Testing Async Operations

```typescript
it('should load preferences on mount', async () => {
  const preferences = { customPresets: [] };
  figmaMock.clientStorage.setAsync('preferences', preferences);
  
  render(<App />);
  
  await waitFor(() => {
    expect(screen.getByText('No custom presets')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
it('should toggle advanced mode when switch is clicked', () => {
  const onChange = vi.fn();
  render(<Toggle checked={false} onChange={onChange} />);
  
  const toggle = screen.getByRole('checkbox');
  fireEvent.click(toggle);
  
  expect(onChange).toHaveBeenCalledWith(true);
});
```

### Testing Error Handling

```typescript
it('should display error boundary on component error', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
});
```

## Continuous Integration

Tests run automatically on every push and pull request. The CI pipeline:

1. Installs dependencies
2. Runs linters
3. Runs all tests with coverage
4. Fails if coverage drops below threshold
5. Runs security scans

## Troubleshooting

### Tests Timing Out

Increase the timeout for specific tests:

```typescript
it('should handle long operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Mock Not Working

Ensure mocks are installed before importing the code under test:

```typescript
beforeEach(() => {
  installFigmaMock(); // Install before importing
});
```

### Coverage Not Updating

Clear the coverage cache:

```bash
rm -rf coverage/
npm run test:coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Testing Best Practices](https://testingjavascript.com/)
