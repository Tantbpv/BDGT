import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import type { Linter } from 'eslint'
import importPlugin from 'eslint-plugin-import'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'

const config: Linter.Config[] = [
  js.configs.recommended,

  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  ...(tsPlugin.configs['flat/recommended'] as Linter.Config[]),

  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { disallowTypeAnnotations: false, fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: false, allowTernary: false },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['variableLike'],
          format: ['PascalCase', 'camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: ['variable'],
          format: ['PascalCase', 'camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'function',
          format: ['PascalCase', 'camelCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
      ],
    },
  },

  {
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
    },
  },

  {
    rules: {
      'no-nested-ternary': 'error',
      eqeqeq: 'error',
      'max-params': ['error', 3],
      'no-else-return': 'error',
      'no-var': 'error',
      'no-void': ['error', { allowAsStatement: true }],
      'no-unused-vars': 'off',
      'max-lines-per-function': [
        'warn',
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['warn', { max: 25 }],
    },
  },
]

export default config
