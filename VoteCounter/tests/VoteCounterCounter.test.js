const { VoteCounterCounter } = require( '../modules/VoteCounterCounter.js' );

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/
// Don't forget to change all your classes to "export class"

describe( '_convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)', () => {
	const vcc = new VoteCounterCounter( '', [] );

	it( 'Should handle heading level 2', () => {
		const lineOfWikicode = '==Test==';
		const output = 'Test';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should handle heading level 4', () => {
		const lineOfWikicode = '====Test====';
		const output = 'Test';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should delete spaces touching == internally', () => {
		const lineOfWikicode = '== Test ==';
		const output = 'Test';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should delete spaces touching == externally', () => {
		const lineOfWikicode = '==Test== ';
		const output = 'Test';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should change spaces to underscores', () => {
		const lineOfWikicode = '==Test test==';
		const output = 'Test_test';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should delete wikilink brackets', () => {
		const lineOfWikicode = '==[[Test]]==';
		const output = 'Test';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should delete bold', () => {
		const lineOfWikicode = '==\'\'\'Test\'\'\'==';
		const output = 'Test';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should delete italic', () => {
		const lineOfWikicode = '==\'\'Test\'\'==';
		const output = 'Test';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should handle {{tlx}}', () => {
		const lineOfWikicode = '=== Proposal 22: Add short description and shorten {{tlx|GANentry}} ===';
		const output = 'Proposal_22:_Add_short_description_and_shorten_{{GANentry}}';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should handle {{u}}', () => {
		const lineOfWikicode = '== {{U|Pvmoutside}} autopatrolled rights ==';
		const output = 'Pvmoutside_autopatrolled_rights';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should handle piped wikilinks, e.g. [[User:abc|abc]]', () => {
		const lineOfWikicode = '== Requesting lift of Topic Ban on Sports Articles from [[User:NicholasHui|NicholasHui]] ==';
		const output = 'Requesting_lift_of_Topic_Ban_on_Sports_Articles_from_NicholasHui';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should convert multiple spaces to one space', () => {
		const lineOfWikicode = '====Proposal A:  IBAN Between [[User:BrownHairedGirl]] and [[User:Laurel Lodged]]==== ';
		const output = 'Proposal_A:_IBAN_Between_User:BrownHairedGirl_and_User:Laurel_Lodged';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );

	it( 'Should handle HTML tags', () => {
		const lineOfWikicode = '== Survey_<small>(tagline)</small> ==';
		const output = 'Survey_(tagline)';
		expect( vcc._convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) ).toEqual( output );
	} );
} );
