import importPlugin from 'eslint-plugin-import'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import eslintJs from '@eslint/js'
import eslintTs from 'typescript-eslint'

const tsFiles = ['apps/backend/**/*.ts', 'packages/**/*.ts']

const languageOptions = {
    globals: {
        ...globals.node,
        ...globals.jest,
    },
    ecmaVersion: 2023,
    sourceType: 'module',
}

const customTypescriptConfig = {
    files: tsFiles,
    plugins: {
        import: importPlugin,
        'import/parsers': tsParser,
    },
    languageOptions: {
        ...languageOptions,
        parser: tsParser,
        parserOptions: {
            project: './tsconfig.base.json',
        },
    },
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts'],
        },
    },
    rules: {
        ...importPlugin.configs.typescript.rules,
        '@typescript-eslint/prefer-for-of': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        		'@typescript-eslint/ban-ts-comment': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-empty-function': 'off'

    },
}

// Add the files for applying the recommended TypeScript configs 
// only for the Typescript files.
// This is necessary when we have the multiple extensions files 
// (e.g. .ts, .tsx, .js, .cjs, .mjs, etc.).
const recommendedTypeScriptConfigs = [
    ...eslintTs.configs.recommended.map((config) => ({
        ...config,
        files: tsFiles,
    })),
    ...eslintTs.configs.stylistic.map((config) => ({
        ...config,
        files: tsFiles,
    })),
]

export default [
    { ignores: ['**/lib/*', '**/dist/*'] }, // global ignores
    eslintJs.configs.recommended,
    ...recommendedTypeScriptConfigs,
    customTypescriptConfig,
]