import pluginVue from 'eslint-plugin-vue';

export default [
	...pluginVue.configs['flat/vue2-essential'],
	{
		files: ['*.vue', '**/*.vue'],
		languageOptions: {
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		},
		rules: {}
	}
];
