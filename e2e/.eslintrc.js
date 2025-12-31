module.exports = {
  extends: ['../.eslintrc.js'],
  env: {
    node: true,
    browser: true,
  },
  rules: {
    // Allow any types in tests
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow non-null assertions in tests
    '@typescript-eslint/no-non-null-assertion': 'off',
    // Allow empty functions in mocks
    '@typescript-eslint/no-empty-function': 'off',
  },
};
