module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    jest: true
  },
  extends: [
    'plugin:jest/recommended',
    'plugin:jest/style',
    'plugin:jsdoc/recommended',
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  plugins: [
    'jest',
    'jsdoc'
  ],
  rules: {
    'no-global-assign': ['error', { exceptions: ['require'] }]
  }
}
