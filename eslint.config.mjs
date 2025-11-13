import nextConfig from 'eslint-config-next'
import importPlugin from 'eslint-plugin-import'
import tailwindcss from 'eslint-plugin-tailwindcss'

const config = [
  // Next.js config already includes:
  // - React, React Hooks rules
  // - Next.js specific rules
  // - TypeScript support
  // - Global ignores (.next/, out/, build/)
  ...nextConfig,

  // Main configuration with custom rules
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],

    plugins: {
      'import': importPlugin,
      'tailwindcss': tailwindcss,
    },

    languageOptions: {
      globals: {
        _: 'readonly',
        lodash: 'readonly',
      },
    },

    settings: {
      tailwindcss: {
        removeDuplicates: true,
        officialSorting: true,
        prependCustom: true,
      },
    },

    rules: {
      // Import ordering rules (preserved from .eslintrc.js)
      '@next/next/no-img-element': 'off',
      'import/order': [
        'error',
        {
          'groups': ['builtin', 'external', 'internal'],
          'pathGroups': [
            {
              'pattern': 'react',
              'group': 'external',
              'position': 'before',
            },
          ],
          'pathGroupsExcludedImportTypes': ['react'],
          'newlines-between': 'always',
          'alphabetize': {
            'order': 'asc',
            'caseInsensitive': true,
          },
        },
      ],

      // Semicolon rules (preserved)
      'semi': ['error', 'never', { beforeStatementContinuationChars: 'always' }],

      // Indentation rules (preserved)
      'indent': [
        'warn',
        2,
        {
          ignoredNodes: ['JSXAttribute', 'JSXSpreadAttribute', 'TemplateLiteral'],
          SwitchCase: 1,
          VariableDeclarator: 'first',
        },
      ],

      // Tailwindcss rules (preserved)
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/classnames-order': ['warn'],
    },
  },
]

export default config
