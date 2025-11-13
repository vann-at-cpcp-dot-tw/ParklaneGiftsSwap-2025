module.exports = {
  globals: {
    _: 'readonly',
    lodash: 'readonly',
  },
  extends: [
    "next/core-web-vitals",
    "plugin:tailwindcss/recommended"
  ],
  plugins: ["import"],
  settings: {
    tailwindcss: {
      removeDuplicates: true,
      officialSorting: true,
      prependCustom: true,
    }
  },
  rules: {
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal"],
        "pathGroups": [
          {
            "pattern": "react",
            "group": "external",
            "position": "before"
          }
        ],
        "pathGroupsExcludedImportTypes": ["react"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ],
    semi: ['error', 'never', { beforeStatementContinuationChars: 'always' }],
    indent: [
      'warn',
      2,
      {
        ignoredNodes: ['JSXAttribute', 'JSXSpreadAttribute', 'TemplateLiteral'],
        SwitchCase: 1,
        VariableDeclarator: 'first',
        // MemberExpression: 0,
        // FunctionDeclaration: { body: 1, parameters: 1 },
        // FunctionExpression: { body: 1, parameters: 1 },
        // CallExpression: { arguments: 1 },
      },
    ],

    // from eslint-plugin-tailwind
    'tailwindcss/no-custom-classname': 'off',
    'tailwindcss/classnames-order': ['warn']
  }
}