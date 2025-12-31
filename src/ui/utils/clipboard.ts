/**
 * Copies text to clipboard using the legacy execCommand API
 * which is required for Figma plugins where navigator.clipboard is restricted.
 */
export function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;

      // Ensure it's not visible but part of the DOM
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';

      document.body.appendChild(textarea);

      // Select and copy
      textarea.select();
      const success = document.execCommand('copy');

      // Cleanup
      document.body.removeChild(textarea);

      if (success) {
        resolve();
      } else {
        reject(new Error('execCommand copy failed'));
      }
    } catch (error) {
      reject(error);
    }
  });
}
