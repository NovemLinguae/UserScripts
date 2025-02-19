/* eslint-disable quotes, block-spacing, brace-style, max-statements-per-line */

import { UserHighlighterSimple } from '../modules/UserHighlighterSimple.js';

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

const userHighlighterSimple = new UserHighlighterSimple();

describe( 'linksToAUser( url )', () => {
	test( 'https://en.wikipedia.org/wiki/Main_Page', () => {
		// TODO: instantiate a UserHighlighterSimple class with 3 parameters. They can be mocks.
		// TODO: test linksToAUser( 'https://en.wikipedia.org/wiki/Main_Page' ) and assert that it equals fasle
	} );
} );
