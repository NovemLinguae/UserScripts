const { TemplateFinder } = require( '../modules/TemplateFinder.js' );

describe( 'removePrefix( templateName )', () => {
	it( 'Should remove Template:', () => {
		const templateName = 'Template:Good article';
		const output = 'Good article';
		expect( TemplateFinder.removePrefix( templateName ) ).toBe( output );
	} );
} );

describe( 'getWikitext()', () => {
	it( 'Should return wikitext', () => {
		const wikitext = '{{Good article}}';
		const output = '{{Good article}}';
		const tf = new TemplateFinder( wikitext );
		expect( tf.getWikitext( wikitext ) ).toBe( output );
	} );
} );

describe( 'firstTemplate( templateNameRegExOrArrayCaseInsensitive )', () => {
	test( 'No template', () => {
		const wikitext = 'Hi';
		const tf = new TemplateFinder( wikitext );
		expect( () => tf.removePrefix( tf.firstTemplate( wikitext ) ) ).toThrow( 'getFirstTemplateNameFromwikitext: No template found in wikitext.' );
	} );

	test( 'Normal', () => {
		const wikitext = 'Hi{{Test|hello}}';
		const output = 'Test';
		const tf = new TemplateFinder( wikitext );
		expect( tf.removePrefix( tf.firstTemplate( wikitext ) ) ).toBe( output );
	} );

	test( 'Two templates', () => {
		const wikitext = 'Test {{First}} Test {{Second}} Test';
		const output = 'First';
		const tf = new TemplateFinder( wikitext );
		expect( tf.removePrefix( tf.firstTemplate( wikitext ) ) ).toBe( output );
	} );
} );
