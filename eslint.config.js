import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.agents/**',
      '.claude/**',
      'apps/*/coverage/**',
      'apps/*/dist/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'packages/*/coverage/**',
      'packages/*/dist/**',
      'reports/**',
      'temp/**',
      'test-results/**',
      'docs/.vitepress/dist/**',
      'docs/.vitepress/cache/**',
      'docs/public/games/**',
      'docs/public/level-editor/**',
      'docs/public/particle-editor/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
