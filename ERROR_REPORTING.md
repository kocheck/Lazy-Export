# Error Reporting Guide

This document explains the error reporting system in Lazy Export and how to use it to report bugs.

## Overview

Lazy Export includes a privacy-focused error reporting system that helps users report bugs while protecting sensitive information.

## For Users

### When an Error Occurs

If the plugin encounters an error, you'll see one of two things:

#### 1. Error Boundary (Fatal UI Errors)

A full-screen error message with:
- **Warning Icon**: Visual indication of the error
- **Error Description**: What went wrong
- **Copy Debug Info**: Button to copy sanitized error details
- **Report on GitHub**: Link to create a new issue
- **Reload Plugin**: Button to restart the plugin

#### 2. Toast Notification (Non-Fatal Errors)

A small notification at the bottom of the screen with:
- **Error Message**: Brief description
- **Copy Debug Info**: Button to copy error details
- **Report Issue**: Link to GitHub issues
- **Close Button**: Dismiss the notification

### How to Report a Bug

1. **Copy Debug Info**
   - Click the "📋 Copy Debug Info" button
   - This copies a sanitized error report to your clipboard

2. **Create GitHub Issue**
   - Click "🐛 Report on GitHub" or "Report Issue"
   - This opens GitHub in your browser
   - Paste the copied debug info into the issue description
   - Add any additional context about what you were doing
   - Submit the issue

### What Information is Shared?

The error report includes **ONLY**:
- ✅ Error type and message
- ✅ Stack trace (with sanitized paths)
- ✅ Plugin version
- ✅ Figma API version
- ✅ Timestamp

**NOT included** (automatically removed):
- ❌ Your Figma file keys
- ❌ Your username or user ID
- ❌ Specific layer IDs
- ❌ Email addresses
- ❌ File paths with your username
- ❌ Image hashes

## For Developers

### Error Handling Architecture

```
┌─────────────────┐
│   UI (React)    │ ──────┐
└─────────────────┘       │
                          ▼
                   ┌──────────────┐
                   │ ErrorBoundary│ (Catches React errors)
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ sanitizeLog  │ (Removes sensitive data)
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │    Toast     │ (Shows notification)
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Clipboard   │ (User copies info)
                   └──────────────┘

┌─────────────────┐
│ Plugin (Sandbox)│ ──────┐
└─────────────────┘       │
                          ▼
                   ┌──────────────┐
                   │  try/catch   │ (Global error handler)
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ postMessage  │ (Sends to UI)
                   └──────────────┘
```

### Components

#### 1. ErrorBoundary

**Location**: `src/ui/components/ErrorBoundary.tsx`

**Purpose**: Catches React component errors

**Usage**:
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Features**:
- Catches errors in child components
- Displays user-friendly error screen
- Provides copy & report functionality
- Includes reload button
- Development-only error details

#### 2. Toast

**Location**: `src/ui/components/Toast.tsx`

**Purpose**: Non-blocking error notifications

**Usage**:
```typescript
import { Toast } from './components/Toast';

<Toast
  message="Failed to save preset"
  type="error"
  error={error}
  onClose={() => setToast(null)}
/>
```

**Props**:
- `message`: Display message
- `type`: 'error' | 'success' | 'info'
- `error?`: Error object (enables reporting)
- `onClose`: Callback when dismissed

#### 3. sanitizeLog

**Location**: `src/shared/sanitizeLog.ts`

**Purpose**: Remove sensitive data from errors

**Usage**:
```typescript
import { sanitizeLog, formatLogForGitHub } from './sanitizeLog';

const sanitized = sanitizeLog({
  error: new Error('Something failed'),
  pluginVersion: '2.0.0',
  figmaVersion: '124.5.6',
  timestamp: Date.now(),
  additionalContext: {
    action: 'export',
    presetId: 'ios'
  }
});

const markdown = formatLogForGitHub(sanitized);
navigator.clipboard.writeText(markdown);
```

**Sanitization Rules**:

```typescript
// File Keys
'file/abc123def456' → 'file/[SANITIZED]'

// User IDs
'user_id:12345' → 'user_id:[SANITIZED]'

// Node IDs
'123:456' → '[NODE_ID]'

// Email Addresses
'user@example.com' → '[EMAIL]'

// File Paths
'/Users/john/project/file.ts' → '/Users/[USER]/project/file.ts'
'C:\Users\John\project' → 'C:\Users\[USER]\project'

// Image Hashes
'a1b2c3d4e5f6...' → '[IMAGE_HASH]'
```

### Plugin Error Handling

**Location**: `src/plugin/main.ts`

**Implementation**:
```typescript
function handlePluginError(error: Error): void {
  console.error('Plugin error:', error);
  
  const errorMessage: PluginMessage = {
    type: 'error',
    message: error.message,
    stack: error.stack,
  };
  
  figma.ui.postMessage(errorMessage);
}

// Wrap all async operations
(async () => {
  try {
    // Plugin code
  } catch (error) {
    handlePluginError(error as Error);
  }
})();
```

### Adding Error Handling to New Features

#### 1. UI Component Errors

Wrap components in ErrorBoundary:

```typescript
function MyFeature() {
  // Component that might throw
  return <SomethingRisky />;
}

// In parent
<ErrorBoundary>
  <MyFeature />
</ErrorBoundary>
```

#### 2. Plugin Operations

Wrap in try/catch and send to UI:

```typescript
figma.ui.onmessage = async (msg: UIMessage) => {
  try {
    switch (msg.type) {
      case 'my-action':
        await performAction();
        break;
    }
  } catch (error) {
    handlePluginError(error as Error);
  }
};
```

#### 3. Async Operations in UI

Use try/catch and show Toast:

```typescript
const handleSave = async () => {
  try {
    await savePreset(preset);
  } catch (error) {
    setToast({
      message: 'Failed to save preset',
      type: 'error',
      error: error as Error
    });
  }
};
```

### Testing Error Handling

#### Test ErrorBoundary

```typescript
it('should catch errors in children', () => {
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

#### Test Sanitization

```typescript
it('should sanitize user IDs', () => {
  const context = {
    error: new Error('User user_id:12345 not found'),
    pluginVersion: '2.0.0',
    timestamp: Date.now()
  };
  
  const sanitized = sanitizeLog(context);
  expect(sanitized.errorMessage).not.toContain('12345');
  expect(sanitized.errorMessage).toContain('[SANITIZED]');
});
```

### Error Report Format

The copied debug info follows this Markdown format:

```markdown
### Bug Report

**Context:**
- Plugin Version: 2.0.0
- Figma Version: 124.5.6
- Timestamp: 2024-01-01T00:00:00.000Z

**Error:**
- Type: TypeError
- Message: Cannot read property 'settings' of undefined

**Stack Trace:**
```
TypeError: Cannot read property 'settings' of undefined
    at applyPreset (src/plugin/main.ts:42:15)
    at handleMessage (src/plugin/main.ts:89:7)
```

**Additional Context:**
```json
{
  "action": "apply-preset",
  "platform": "iOS"
}
```
```

### Privacy Considerations

1. **User Control**: Users must explicitly click to copy and share
2. **No Auto-Reporting**: Never send error data automatically
3. **Sanitization**: Always run through sanitizeLog before sharing
4. **Transparency**: Show what's being copied in development mode
5. **GitHub Public**: Users know reports are public

### Security Best Practices

1. **Never log credentials** or API keys
2. **Sanitize before logging** to console
3. **Use generic messages** for sensitive operations
4. **Validate error objects** before sanitizing
5. **Test sanitization** with realistic data

## Troubleshooting

### ErrorBoundary Not Catching Errors

ErrorBoundary only catches errors in:
- Render methods
- Lifecycle methods
- Constructor

It does **not** catch:
- Event handlers (use try/catch)
- Async code (use try/catch)
- Server-side rendering
- Errors in ErrorBoundary itself

### Clipboard Copy Fails

The code includes a fallback using `document.execCommand('copy')`:

```typescript
navigator.clipboard.writeText(text)
  .catch(() => {
    // Fallback for environments without clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  });
```

### Sanitization Too Aggressive

If legitimate content is being sanitized, adjust the regex patterns in `sanitizeLog.ts`. Be conservative - it's better to over-sanitize than leak sensitive data.

## Future Enhancements

Potential improvements to error reporting:

1. **Error Codes**: Unique codes for common errors
2. **Suggested Fixes**: Context-aware help text
3. **Error History**: Track repeated errors
4. **Telemetry**: Optional anonymous error tracking
5. **Localization**: Multi-language error messages
6. **Recovery Actions**: Automatic fixes for known issues

## Resources

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Error Handling Best Practices](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)
- [Privacy by Design](https://www.smashingmagazine.com/2017/07/privacy-by-design-framework/)
