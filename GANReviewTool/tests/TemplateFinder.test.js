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
	test( 'Find any template - No template', () => {
		const wikitext = 'Hi';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const output = undefined;
		const tf = new TemplateFinder( wikitext );
		expect( tf.firstTemplate( templateNameRegExOrArrayCaseInsensitive ) ).toBe( output );
	} );

	test( 'Find any template - Normal', () => {
		const wikitext = 'Hi{{First|hello}}';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const output = 'First';
		const tf = new TemplateFinder( wikitext );
		expect( TemplateFinder.removePrefix( ( tf.firstTemplate( templateNameRegExOrArrayCaseInsensitive ) ).name ) ).toBe( output );
	} );

	test( 'Find any template - Two templates', () => {
		const wikitext = 'Test {{First}} Test {{Second}} Test';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const output = 'First';
		const tf = new TemplateFinder( wikitext );
		expect( TemplateFinder.removePrefix( ( tf.firstTemplate( templateNameRegExOrArrayCaseInsensitive ) ).name ) ).toBe( output );
	} );

	test( 'Find specific template - No template', () => {
		const wikitext = 'Hi';
		const templateNameRegExOrArrayCaseInsensitive = 'First';
		const output = undefined;
		const tf = new TemplateFinder( wikitext );
		expect( tf.firstTemplate( templateNameRegExOrArrayCaseInsensitive ) ).toBe( output );
	} );

	test( 'Find specific template - Normal', () => {
		const wikitext = 'Hi{{First|hello}}';
		const templateNameRegExOrArrayCaseInsensitive = 'First';
		const output = 'First';
		const tf = new TemplateFinder( wikitext );
		expect( TemplateFinder.removePrefix( ( tf.firstTemplate( templateNameRegExOrArrayCaseInsensitive ) ).name ) ).toBe( output );
	} );

	test( 'Find specific template - Two templates', () => {
		const wikitext = 'Test {{First}} Test {{Second}} Test';
		const templateNameRegExOrArrayCaseInsensitive = 'Second';
		const output = 'Second';
		const tf = new TemplateFinder( wikitext );
		expect( TemplateFinder.removePrefix( ( tf.firstTemplate( templateNameRegExOrArrayCaseInsensitive ) ).name ) ).toBe( output );
	} );
} );
