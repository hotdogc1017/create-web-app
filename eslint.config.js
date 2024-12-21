import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['template-*'],
  rules: {
    'antfu/no-import-dist': 'off',
  },
})
