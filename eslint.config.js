'use strict';

// This is a good example file to copy:
// https://gerrit.wikimedia.org/r/c/mediawiki/extensions/CheckUser/+/1371784/1/eslint.config.js

const { defineConfig, globalIgnores } = require( 'eslint/config' );
const globals = require( 'globals' );
const wikimedia = require( 'eslint-config-wikimedia/flat' );

module.exports = defineConfig( [
	// js, json, and yml are linted by default. Other file types are not linted by default.
	globalIgnores( [
		'=*/',
		'**/coverage/',
		'**/dist/',
		'**/jsconfig.json',
		'**/tsconfig.json',
		'**/package.json',
		'**/package-lock.json',
		'test.js',
		'test2.js'
	] ),

	{
		ignores: [ 'eslint.config.js' ],
		extends: [ wikimedia( 'client', 'jquery', 'mediawiki' ) ],
		languageOptions: {
			ecmaVersion: 2024,
			globals: {
				// From `env: { jest: true }`
				...globals.jest,
				mediaWiki: 'readonly'
			},
			sourceType: 'module'
		},
		rules: {
			// Default rules we don't like
			'compat/compat': 'off',
			'es-x/no-class-fields': 'off',
			'es-x/no-string-prototype-matchall': 'off',
			'es-x/no-string-prototype-replaceall': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns': 'off',
			'max-len': 'off',
			'mediawiki/class-doc': 'off',
			'no-alert': 'off',
			'no-console': 'off',
			'no-jquery/no-class-state': 'off',
			'no-jquery/no-extend': 'off',
			'no-jquery/no-global-selector': 'off',
			'no-jquery/no-parse-html-literal': 'off',
			'no-shadow': 'off',
			'no-underscore-dangle': 'off',
			'security/detect-non-literal-regexp': 'off',
			'security/detect-unsafe-regex': 'off',

			// Non-default rules we do like
			'no-nested-ternary': 'error',

			// Rules we should probably fix someday
			camelcase: 'off',
			eqeqeq: 'off',
			'jsdoc/check-param-names': 'off'
		}
	}
] );
