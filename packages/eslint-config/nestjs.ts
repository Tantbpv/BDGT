import type { Linter } from 'eslint'

import base from './base'

const config: Linter.Config[] = [
  ...base,
  {
    rules: {
      // emitDecoratorMetadata requires value imports for injected classes.
      // import type causes tsc to emit Object instead of the class reference,
      // which breaks NestJS DI container resolution at runtime.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
]

export default config
