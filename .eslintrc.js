"use strict"
/*
eslint
no-magic-numbers: off,
no-implicit-globals: off,
*/

// shorthands to prevent typos
const
	E = "error",
	W = "warn"

/**
regex pattern of intentionally unused identifiers
*/
const UNUSED_ID = "^(_|(foo)?(ba[rz])?|bruh|yeet|gyatt?|amon?gus)$"

//eslint-disable-next-line no-undef
module.exports = {
	env: { browser: true, es2022: true },
	parserOptions: { ecmaVersion: "latest" },

	extends: "eslint:recommended",
	rules: {
		"no-unused-expressions": W,
		"no-unused-vars": [
			W,
			{
				varsIgnorePattern: UNUSED_ID,
				argsIgnorePattern: UNUSED_ID
			}
		],
		"no-magic-numbers": [
			W,// too many false-positives
			{
				ignore: [-1, 0, 1, 2],
				ignoreArrayIndexes: true,
				ignoreDefaultValues: true,
				enforceConst: true
			}
		],
		// Rust certified
		"prefer-const": E,
		/*
		this is not forbidden, it's just to make mutation intentional.
		to-do: replace by this proposal:
		https://github.com/Fishrock123/proposal-const-function-arguments
		*/"no-param-reassign": E,// should it be `W`?
		"no-var": E,
		"no-implicit-globals": [E, { lexicalBindings: true }],

		"no-empty-function": E,
		"no-loop-func": E,
		"no-lone-blocks": E,

		"no-constant-binary-expression": E,
		"no-self-compare": E,

		"no-unmodified-loop-condition": E,
		"no-unreachable-loop": E,

		"no-extra-label": E,

		// guard-clauses are better
		"no-else-return": [E, { "allowElseIf": false }],
		"no-useless-return": E,
		"no-unneeded-ternary": [E, { "defaultAssignment": false }],
		"no-useless-computed-key": [E, { "enforceForClassMembers": true }],
		"no-useless-concat": E,
		"no-useless-constructor": E,
		"no-useless-rename": E,
		"object-shorthand": E,

		"require-atomic-updates": E,

		"no-eval": E,
		"no-implied-eval": E,
		"no-script-url": E,

		"dot-notation": E,
		"no-array-constructor": E,
		"no-sequences": E,

		// prefer Object bags
		"max-params": [E, 4],
		"max-depth": W,
		// avoid CB-Hell
		"max-nested-callbacks": [E, 3],
		indent: [E, "tab"],
		"linebreak-style": [E, "unix"],
		"no-template-curly-in-string": W,
		quotes: [
			E,
			// "single" is cleaner,
			// but "double" is more consistent with JSON
			"double"
		],
		semi: [
			E,
			// ASI is confusing, regardless of what you do
			"never"
		],
		// GH-issues can be used as alt,
		// that's why no `W`
		"no-warning-comments": [E, { "terms": ["todo", "to-do"] }]
	}
}
