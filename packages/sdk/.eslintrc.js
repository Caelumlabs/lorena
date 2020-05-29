module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    mocha: true
  },
  extends: [
    'standard',
    'plugin:jest/recommended',
    'plugin:jest/style',
    'plugin:jsdoc/recommended'
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
