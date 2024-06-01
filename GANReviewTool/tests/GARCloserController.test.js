const { GARCloserController } = require( '../modules/GARCloserController.js' );

let controller;
beforeEach( () => {
	controller = new GARCloserController();
} );

// Private methods ===========================================================

describe( 'getIndividualReassessmentParentArticle(title)', () => {
	it( 'Should handle a high numbered GA (e.g. GA12)', () => {
		const title = 'Talk:Abcdef/GA12';
		const output = 'Abcdef';
		expect( controller.getIndividualReassessmentParentArticle( title ) ).toBe( output );
	} );

	it( 'Should handle a space in title', () => {
		const title = 'Talk:Abc def/GA2';
		const output = 'Abc def';
		expect( controller.getIndividualReassessmentParentArticle( title ) ).toBe( output );
	} );

	it( 'Should handle slash in title', () => {
		const title = 'Talk:Abc def/test/GA2';
		const output = 'Abc def/test';
		expect( controller.getIndividualReassessmentParentArticle( title ) ).toBe( output );
	} );
} );

describe( 'getCommunityReassessmentParentArticle(title)', () => {
	it( 'Should handle a high number (e.g. 12)', () => {
		const title = 'Wikipedia:Good article reassessment/Abcdef/12';
		const output = 'Abcdef';
		expect( controller.getCommunityReassessmentParentArticle( title ) ).toBe( output );
	} );

	it( 'Should handle a space in title', () => {
		const title = 'Wikipedia:Good article reassessment/Abc def/2';
		const output = 'Abc def';
		expect( controller.getCommunityReassessmentParentArticle( title ) ).toBe( output );
	} );

	it( 'Should handle slash in title', () => {
		const title = 'Wikipedia:Good article reassessment/Abc def/test/2';
		const output = 'Abc def/test';
		expect( controller.getCommunityReassessmentParentArticle( title ) ).toBe( output );
	} );
} );

describe( 'countOccurrencesInString(needleRegEx, haystack)', () => {
	it( 'Should count wikicode level 2 headings', () => {
		const needleRegEx = /^==[^=]*==$/gm;
		const haystack =
`== Test ==
aa

=== Test ===
bb

== Test2 ==
cc`;
		const output = 2;
		expect( controller.countOccurrencesInString( needleRegEx, haystack ) ).toBe( output );
	} );
} );

describe( 'incrementArchiveTitle(title)', () => {
	it( 'Should increment a high-numbered community assessment archive page', () => {
		const title = 'Wikipedia:Good article reassessment/Archive 67';
		const output = 'Wikipedia:Good article reassessment/Archive 68';
		expect( controller.incrementArchiveTitle( title ) ).toBe( output );
	} );
} );
