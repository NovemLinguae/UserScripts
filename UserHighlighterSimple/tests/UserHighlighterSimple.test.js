/* eslint-disable quotes, block-spacing, brace-style, max-statements-per-line */

import { UserHighlighterSimple } from '../modules/UserHighlighterSimple.js';

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

const userHighlighterSimple = new UserHighlighterSimple( $, mw, window );

describe( 'linksToAUser( url )', () => {
	test( 'normal non-userpage URL using /wiki/', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://en.wikipedia.org/wiki/Main_Page' ) ).toBe( false );
	} );

	test( 'normal userpage URL using /wiki/', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://en.wikipedia.org/wiki/User:Novem_Linguae' ) ).toBe( true );
	} );

	test( 'normal user talk page URL using /wiki/', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://en.wikipedia.org/wiki/User talk:Novem_Linguae' ) ).toBe( true );
	} );

	test( 'not http or https', () => {
		expect( userHighlighterSimple.linksToAUser( 'ftp://en.wikipedia.org/wiki/User:Novem_Linguae' ) ).toBe( false );
	} );

	test( 'is an anchor URL only (starts with #)', () => {
		expect( userHighlighterSimple.linksToAUser( 'ftp://en.wikipedia.org/wiki/User:Novem_Linguae' ) ).toBe( false );
	} );

	test( 'gibberish string', () => {
		expect( userHighlighterSimple.linksToAUser( 'abcd' ) ).toBe( false );
	} );

	test( 'empty string', () => {
		expect( userHighlighterSimple.linksToAUser( '' ) ).toBe( false );
	} );

	test( 'URL starts with /, needs a domain added', () => {
		expect( userHighlighterSimple.linksToAUser( '/wiki/User:Novem_Linguae' ) ).toBe( true );
	} );

	test( 'URL starts with /, needs a domain added', () => {
		expect( userHighlighterSimple.linksToAUser( '/wiki/Main_Page' ) ).toBe( false );
	} );

	test( 'URL with section link should not throw error', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://meta.wikimedia.org/wiki/Community_Wishlist_Survey_2022/Larger_suggestions#1%' ) ).toBe( false );
	} );

	test( 'URL with parameters that aren\'t title, action, or redlink', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://en.wikipedia.org/w/index.php?title=User:Novem_Linguae&diff=prev&oldid=1276401726' ) ).toBe( false );
	} );

	test( 'URL with parameters that are title, action, or redlink', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://en.wikipedia.org/w/index.php?title=Main_Page' ) ).toBe( false );
	} );

	test( 'URL with parameters that are title, action, or redlink', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://en.wikipedia.org/w/index.php?title=User:Novem_Linguae' ) ).toBe( true );
	} );

	test( 'archive URL of a user page', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://web.archive.org/web/20231105033559/https://en.wikipedia.org/wiki/User:SandyGeorgia/SampleIssue' ) ).toBe( false );
	} );

	test( 'wrong namespace', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://en.wikipedia.org/wiki/Template:Uw-test1' ) ).toBe( false );
	} );

	test( 'DiscussionTools section link', () => {
		expect( userHighlighterSimple.linksToAUser( 'https://en.wikipedia.org/wiki/User_talk:Novem_Linguae#c-Scope_creep-20250218175200-Novem_Linguae-20250218170600' ) ).toBe( false );
	} );
} );

describe( 'getTitle( url )', () => {
	test( 'URL using /wiki/, user namespace', () => {
		expect( userHighlighterSimple.getTitle( 'https://en.wikipedia.org/wiki/User:Novem_Linguae' ) ).toBe( 'User:Novem_Linguae' );
	} );

	test( 'URL using ?title=, user namespace', () => {
		expect( userHighlighterSimple.getTitle( 'https://en.wikipedia.org/w/index.php?title=User:Novem_Linguae' ) ).toBe( 'User:Novem_Linguae' );
	} );

	test( 'URL using /wiki/, user talk namespace', () => {
		expect( userHighlighterSimple.getTitle( 'https://en.wikipedia.org/wiki/User talk:Novem_Linguae' ) ).toBe( 'User talk:Novem_Linguae' );
	} );

	test( 'URL using ?title=, user talk namespace', () => {
		expect( userHighlighterSimple.getTitle( 'https://en.wikipedia.org/w/index.php?title=User talk:Novem_Linguae' ) ).toBe( 'User talk:Novem_Linguae' );
	} );

	test( 'neither of the above', () => {
		expect( userHighlighterSimple.getTitle( 'https://en.wikipedia.org/' ) ).toBe( '' );
	} );
} );
