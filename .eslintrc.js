'use strict'
//eslint-disable-next-line no-implicit-globals
const m = 'Use arrow fn instead.'

//eslint-disable-next-line no-undef
module.exports = {
	env: {
		browser: true,
		es2021: true
	},
	extends: 'eslint:recommended',
	parserOptions: {
		ecmaVersion: 'latest'
	},
	rules: {
		'no-magic-numbers': [
			'warn',
			{
				ignore: [
					-1,
					0,
					1,
					2
				],
				ignoreArrayIndexes: true,
				ignoreDefaultValues: true,
				enforceConst: true
			}
		],
		'no-unused-vars': [
			'warn',
			{
				varsIgnorePattern: '^_$',
				argsIgnorePattern: '^_$'
			}
		],
		'no-param-reassign': 'error',
		'no-implicit-globals': [
			'error',
			{
				lexicalBindings: true
			}
		],/*
		'no-restricted-syntax': [
			'error',
			{
				selector: 'FunctionDeclaration',
				message: m
			},
			{
				selector: 'FunctionExpression',
				message: m
			}
		],*/
		'no-empty-function': 'error',
		'no-loop-func': 'error',
		'no-lone-blocks': 'error',
		'no-constant-binary-expression': 'error',
		'no-self-compare': 'error',
		'no-unmodified-loop-condition': 'error',
		'no-unreachable-loop': 'error',
		'no-extra-label': 'error',
		'no-else-return': [
			'error',
			{
				'allowElseIf': false
			}
		],
		'require-atomic-updates': 'error',
		'no-eval': 'error',
		'no-implied-eval': 'error',
		'dot-notation': 'error',
		'no-array-constructor': 'error',
		'max-depth': 'warn',
		'max-nested-callbacks': [
			'error',
			3
		],
		'max-params': [
			'error',
			4
		],
		'indent': [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'no-template-curly-in-string': 'warn',
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'never'
		]
	}
}
