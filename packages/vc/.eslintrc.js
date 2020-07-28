module.exports = {
  env: {
    es6: true,
    jest: true,
    node: true
  },
  extends: [
    'plugin:jest/recommended',
    'plugin:jest/style',
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: [
    'jest'
  ],
  rules: {
  }
}
