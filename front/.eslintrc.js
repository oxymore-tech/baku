module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
    '@vue/typescript',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'max-len': [1, 200, 2],
    'class-methods-use-this': 0,
    'no-plusplus': 0,
    'no-empty-pattern': 0,
    'no-use-before-define': 0,
    'import/prefer-default-export': 0,
    'no-unused-vars': 'off',
    // 'quotes': ["error", "double"],
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
    }],
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
};
