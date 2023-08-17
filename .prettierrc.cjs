/**
 * @type {import('prettier').Options}
 */
module.exports = {
  plugins: [require.resolve('@plasmohq/prettier-plugin-sort-imports')],
  importOrder: ['^@plasmohq/(.*)$', '^~(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  bracketSpacing: true,
  bracketSameLine: true,
  semi: true,
};
