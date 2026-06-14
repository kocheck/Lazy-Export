import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'src/coverage/**', '**/*.css'],
  },

  // TypeScript source files
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Ban native dialogs and unsafe window.open
      'no-restricted-globals': [
        'error',
        { name: 'alert', message: 'Use inline validation or toast instead of alert().' },
        { name: 'confirm', message: 'Use a non-blocking confirmation affordance instead of confirm().' },
        { name: 'prompt', message: 'Use a form input instead of prompt().' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='window'][callee.property.name='open']",
          message: 'Use figma.openExternal or the open-external-url message instead of window.open.',
        },
      ],
      'no-case-declarations': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Relax some rules in test files
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  }
);
