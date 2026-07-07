import nextPlugin from '@next/eslint-plugin-next'
import type { Linter } from 'eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

import base from './base'

const config: Linter.Config[] = [
  ...base,

  // react-hooks, react, and @next/next ship legacy-format types incompatible
  // with ESLint 9's Plugin type — use double cast to bypass the mismatch
  {
    plugins: { 'react-hooks': reactHooksPlugin },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  } as unknown as Linter.Config,

  {
    plugins: { react: reactPlugin },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  } as unknown as Linter.Config,

  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  } as unknown as Linter.Config,

  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
]

export default config
