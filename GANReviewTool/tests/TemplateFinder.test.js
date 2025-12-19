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

describe( 'firstTemplateInsertCode( templateNameRegExOrArrayCaseInsensitive, codeToInsert )', () => {
	it( 'Should do nothing if template not found', () => {
		const wikitext = 'Hi';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const codeToInsert = '|parameter=value';
		const output = 'Hi';
		const tf = new TemplateFinder( wikitext );
		tf.firstTemplateInsertCode( templateNameRegExOrArrayCaseInsensitive, codeToInsert );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should insert code into first template found', () => {
		const wikitext = 'Hi{{First}}{{Second}}';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const codeToInsert = '|parameter=value';
		const output = 'Hi{{First|parameter=value\n}}{{Second}}';
		const tf = new TemplateFinder( wikitext );
		tf.firstTemplateInsertCode( templateNameRegExOrArrayCaseInsensitive, codeToInsert );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should insert code into specific template found', () => {
		const wikitext = 'Hi{{First}}{{Second}}';
		const templateNameRegExOrArrayCaseInsensitive = 'Second';
		const codeToInsert = '|parameter=value';
		const output = 'Hi{{First}}{{Second|parameter=value\n}}';
		const tf = new TemplateFinder( wikitext );
		tf.firstTemplateInsertCode( templateNameRegExOrArrayCaseInsensitive, codeToInsert );
		expect( tf.getWikitext() ).toBe( output );
	} );
} );

describe( 'firstTemplateGetParameterValue( templateNameRegExOrArrayCaseInsensitive, parameter )', () => {
	test( 'No template', () => {
		const wikitext = 'Hi';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const parameter = 'parameter';
		const output = null;
		const tf = new TemplateFinder( wikitext );
		expect( tf.firstTemplateGetParameterValue( templateNameRegExOrArrayCaseInsensitive, parameter ) ).toBe( output );
	} );

	test( 'No parameter', () => {
		const wikitext = 'Hi{{First}}';
		const templateNameRegExOrArrayCaseInsensitive = 'First';
		const parameter = 'parameter';
		const output = null;
		const tf = new TemplateFinder( wikitext );
		expect( tf.firstTemplateGetParameterValue( templateNameRegExOrArrayCaseInsensitive, parameter ) ).toBe( output );
	} );

	test( 'With parameter', () => {
		const wikitext = 'Hi{{First|parameter = value}}';
		const templateNameRegExOrArrayCaseInsensitive = 'First';
		const parameter = 'parameter';
		const output = 'value';
		const tf = new TemplateFinder( wikitext );
		expect( tf.firstTemplateGetParameterValue( templateNameRegExOrArrayCaseInsensitive, parameter ) ).toBe( output );
	} );

	test( 'Multiple templates - No parameter', () => {
		const wikitext = 'Hi{{First}}{{Second|parameter = value2}}';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const parameter = 'parameter';
		const output = null;
		const tf = new TemplateFinder( wikitext );
		expect( tf.firstTemplateGetParameterValue( templateNameRegExOrArrayCaseInsensitive, parameter ) ).toBe( output );
	} );

	test( 'Multiple templates - With parameter', () => {
		const wikitext = 'Hi{{First|parameter = value1}}{{Second|parameter = value2}}';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const parameter = 'parameter';
		const output = 'value1';
		const tf = new TemplateFinder( wikitext );
		expect( tf.firstTemplateGetParameterValue( templateNameRegExOrArrayCaseInsensitive, parameter ) ).toBe( output );
	} );
} );

describe( 'firstTemplateDeleteParameter( templateNameRegExOrArrayCaseInsensitive, parameter )', () => {
	it( 'Should do nothing if template not found', () => {
		const wikitext = 'Hi';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const parameter = 'parameter';
		const output = 'Hi';
		const tf = new TemplateFinder( wikitext );
		tf.firstTemplateDeleteParameter( templateNameRegExOrArrayCaseInsensitive, parameter );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should do nothing if parameter not found', () => {
		const wikitext = 'Hi{{First|other=value}}';
		const templateNameRegExOrArrayCaseInsensitive = 'First';
		const parameter = 'parameter';
		const output = 'Hi{{First|other=value}}';
		const tf = new TemplateFinder( wikitext );
		tf.firstTemplateDeleteParameter( templateNameRegExOrArrayCaseInsensitive, parameter );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should delete parameter from first template found', () => {
		const wikitext = 'Hi{{First|parameter=value|other=value2}}{{Second|parameter=value3}}';
		const templateNameRegExOrArrayCaseInsensitive = '';
		const parameter = 'parameter';
		const output = 'Hi{{First|other=value2}}{{Second|parameter=value3}}';
		const tf = new TemplateFinder( wikitext );
		tf.firstTemplateDeleteParameter( templateNameRegExOrArrayCaseInsensitive, parameter );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should delete parameter from specific template found', () => {
		const wikitext = 'Hi{{First|parameter=value}}{{Second|parameter=value2|other=value3}}';
		const templateNameRegExOrArrayCaseInsensitive = 'Second';
		const parameter = 'parameter';
		const output = 'Hi{{First|parameter=value}}{{Second|other=value3}}';
		const tf = new TemplateFinder( wikitext );
		tf.firstTemplateDeleteParameter( templateNameRegExOrArrayCaseInsensitive, parameter );
		expect( tf.getWikitext() ).toBe( output );
	} );
} );

describe( 'placeATOP( prependText, levels )', () => {
	it( 'Should prepend text if no headings found', () => {
		const wikitext = 'Hi';
		const prependText = 'Hello';
		const levels = [ 2 ];
		const output = 'Hello\nHi';
		const tf = new TemplateFinder( wikitext );
		tf.placeATOP( prependText, levels );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should prepend text if no matching headings found', () => {
		const wikitext = 'Hi\n== Heading ==';
		const prependText = 'Hello';
		const levels = [ 3 ];
		const output = 'Hello\nHi\n== Heading ==';
		const tf = new TemplateFinder( wikitext );
		tf.placeATOP( prependText, levels );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should insert text after first matching heading found', () => {
		const wikitext = 'Hi\n== Heading 2 ==\n=== Heading 3 ===';
		const prependText = 'Hello';
		const levels = [ 3 ];
		const output = 'Hi\n== Heading 2 ==\n=== Heading 3 ===\nHello';
		const tf = new TemplateFinder( wikitext );
		tf.placeATOP( prependText, levels );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should insert text after first matching heading found (multiple candidates)', () => {
		const wikitext = 'Hi\n== Heading 2 ==\n=== Heading 3 ===';
		const prependText = 'Hello';
		const levels = [ 2, 3 ];
		const output = 'Hi\n== Heading 2 ==\nHello\n=== Heading 3 ===';
		const tf = new TemplateFinder( wikitext );
		tf.placeATOP( prependText, levels );
		expect( tf.getWikitext() ).toBe( output );
	} );
} );

describe( 'getTemplates( templateNameCaseInsensitive )', () => {
	it( 'Should return all matching templates', () => {
		const wikitext = 'Hi{{First}}{{Second}}{{first}}';
		const templateNameCaseInsensitive = 'First';
		const output = 2;
		const tf = new TemplateFinder( wikitext );
		expect( tf.getTemplates( templateNameCaseInsensitive ).length ).toBe( output );
	} );
} );

describe( 'deleteTemplate( templateNameRegExOrArrayCaseInsensitive )', () => {
	it( 'Should do nothing if template not found', () => {
		const wikitext = 'Hi';
		const templateNameRegExOrArrayCaseInsensitive = 'First';
		const output = 'Hi';
		const tf = new TemplateFinder( wikitext );
		tf.deleteTemplate( templateNameRegExOrArrayCaseInsensitive );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should delete first matching template found', () => {
		const wikitext = 'Hi{{First}}\n{{Second}}\n{{First}}';
		const templateNameRegExOrArrayCaseInsensitive = 'First';
		const output = 'Hi{{Second}}\n{{First}}';
		const tf = new TemplateFinder( wikitext );
		tf.deleteTemplate( templateNameRegExOrArrayCaseInsensitive );
		expect( tf.getWikitext() ).toBe( output );
	} );
} );

describe( 'addWikicodeAfterTemplates( templates, codeToAdd )', () => {
	it( 'Should add code at the top if no templates found', () => {
		const wikitext = 'Hi';
		const templates = [ 'First', 'Second' ];
		const codeToAdd = '{{Added}}';
		const output = '{{Added}}Hi';
		const tf = new TemplateFinder( wikitext );
		tf.addWikicodeAfterTemplates( templates, codeToAdd );
		expect( tf.getWikitext() ).toBe( output );
	} );

	it( 'Should add code after last matching template found', () => {
		const wikitext = 'Hi{{First}}\n{{Second}}';
		const templates = [ 'First', 'Second' ];
		const codeToAdd = '{{Added}}';
		const output = 'Hi{{First}}\n{{Second}}\n{{Added}}';
		const tf = new TemplateFinder( wikitext );
		tf.addWikicodeAfterTemplates( templates, codeToAdd );
		expect( tf.getWikitext() ).toBe( output );
	} );
} );

describe( 'hasTemplate( templateNameRegExOrArrayCaseInsensitive )', () => {
	test( 'No template', () => {
		const wikitext = 'Hi';
		const templateNameRegExOrArrayCaseInsensitive = 'First';
		const output = false;
		const tf = new TemplateFinder( wikitext );
		expect( tf.hasTemplate( templateNameRegExOrArrayCaseInsensitive ) ).toBe( output );
	} );

	test( 'Template exists', () => {
		const wikitext = 'Hi{{First}}';
		const templateNameRegExOrArrayCaseInsensitive = 'First';
		const output = true;
		const tf = new TemplateFinder( wikitext );
		expect( tf.hasTemplate( templateNameRegExOrArrayCaseInsensitive ) ).toBe( output );
	} );
} );
