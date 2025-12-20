const { MassGARWikicodeGenerator } = require( '../modules/MassGARWikicodeGenerator.js' );

/* eslint-disable quotes */

let wg;
beforeEach( () => {
	wg = new MassGARWikicodeGenerator();
} );

describe( 'hasGoodArticleTemplate(mainArticleWikicode)', () => {
	it( 'Should return false if no good article templates found', () => {
		const wikicode =
`{{Short description|None}}
{{USmusicgenres}}
== Test==
Test
`;
		const output = false;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );

	it( 'Should detect {{Good article}} 1', () => {
		const wikicode =
`{{Short description|None}}
{{Good article}}
{{USmusicgenres}}`;
		const output = true;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );

	it( 'Should handle template being at top of wikicode', () => {
		const wikicode =
`{{Good article}}
{{USmusicgenres}}`;
		const output = true;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );

	it( 'Should handle template being at bottom of wikicode', () => {
		const wikicode =
`{{USmusicgenres}}
{{Good article}}`;
		const output = true;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );

	it( 'Should detect {{good article}}', () => {
		const wikicode =
`{{Short description|None}}
{{good article}}
{{USmusicgenres}}`;
		const output = true;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );

	it( 'Should detect {{Good Article}} 2', () => {
		const wikicode =
`{{Short description|None}}
{{Good Article}}
{{USmusicgenres}}`;
		const output = true;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );

	it( 'Should detect {{GA article}}', () => {
		const wikicode =
`{{Short description|None}}
{{GA article}}
{{USmusicgenres}}`;
		const output = true;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );

	it( 'Should detect {{ga article}}', () => {
		const wikicode =
`{{Short description|None}}
{{ga article}}
{{USmusicgenres}}`;
		const output = true;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );

	it( 'Should detect {{GA icon}}', () => {
		const wikicode =
`{{Short description|None}}
{{GA icon}}
{{USmusicgenres}}`;
		const output = true;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );

	it( 'Should detect {{ga icon}}', () => {
		const wikicode =
`{{Short description|None}}
{{ga icon}}
{{USmusicgenres}}`;
		const output = true;
		expect( wg.hasGoodArticleTemplate( wikicode ) ).toBe( output );
	} );
} );

describe( 'talkPageIndicatesGA(talkPageWikicode)', () => {
	it( 'Should return false if not good article', () => {
		const wikicode =
`{{Talk header}}
{{Article history
|status = DGA
}}

== Section ==
Test
`;
		const output = false;
		expect( wg.talkPageIndicatesGA( wikicode ) ).toBe( output );
	} );

	it( 'Should return true if {{GA}} template present', () => {
		const wikicode =
`{{Talk header}}
{{GA|06:16, 24 March 2016 (UTC)|topic=Transport|page=2|oldid=711685892}}

== Section ==
Test
`;
		const output = true;
		expect( wg.talkPageIndicatesGA( wikicode ) ).toBe( output );
	} );

	it( 'Should not get confused by case insensitive, e.g. {{Ga}}', () => {
		const wikicode =
`{{Talk header}}
{{Ga|06:16, 24 March 2016 (UTC)|topic=Transport|page=2|oldid=711685892}}

== Section ==
Test
`;
		const output = true;
		expect( wg.talkPageIndicatesGA( wikicode ) ).toBe( output );
	} );

	it( 'Should not detect templates starting with {{Ga as {{GA}}', () => {
		const wikicode =
`{{Talk header}}
{{Game rationale}}

== Section ==
Test
`;
		const output = false;
		expect( wg.talkPageIndicatesGA( wikicode ) ).toBe( output );
	} );

	it( 'Should return true if {{Article history}} present and contains |currentstatus=GA', () => {
		const wikicode =
`{{Talk header}}
{{ArticleHistory
|action1=GAN
|action1date=20:17, 26 October 2011 (UTC)
|action1link=Talk:Red or Black?/GA1
|action1result=listed
|action1oldid=457473186
|dykdate=11 July 2011
|dykentry=... that [[Simon Cowell]] conceived the idea for '''''[[Red or Black?]]''''', the most expensive game show ever made?
|currentstatus=GA
|topic=television}}

== Section ==
Test
`;
		const output = true;
		expect( wg.talkPageIndicatesGA( wikicode ) ).toBe( output );
	} );

	it( 'Should not get confused by whitespace in |currentstatus=GA', () => {
		const wikicode =
`{{Talk header}}
{{ArticleHistory
| currentstatus = GA
|topic=television}}

== Section ==
Test
`;
		const output = true;
		expect( wg.talkPageIndicatesGA( wikicode ) ).toBe( output );
	} );

	it( 'Should not get confused by |currentstatus=GA|', () => {
		const wikicode =
`{{Talk header}}
{{ArticleHistory|currentstatus=GA|topic=television}}

== Section ==
Test
`;
		const output = true;
		expect( wg.talkPageIndicatesGA( wikicode ) ).toBe( output );
	} );

	it( 'Should not get confused by |currentstatus=GA}}', () => {
		const wikicode =
`{{Talk header}}
{{ArticleHistory|currentstatus=GA}}

== Section ==
Test
`;
		const output = true;
		expect( wg.talkPageIndicatesGA( wikicode ) ).toBe( output );
	} );

	it( 'Should detect article history\'s aliases', () => {
		const aliases = [ 'Articlehistory', 'Article milestones', 'Articlemilestones', 'Article History', 'ArticleHistory' ];
		for ( const template of aliases ) {
			const wikicode =
`{{Talk header}}
{{${ template }
| currentstatus = GA
| other stuff   = blah
}}

== Section ==
Test
`;
			const output = true;
			expect( wg.talkPageIndicatesGA( wikicode ) ).toBe( output );
		}
	} );
} );

describe( 'hasOpenGAR(talkPageWikicode)', () => {
	it( 'Should return false if no GAR template present', () => {
		const wikicode =
`{{Talk header}}
{{Article history
|status = DGA
}}

== Section ==
Test
`;
		const output = false;
		expect( wg.hasOpenGAR( wikicode ) ).toBe( output );
	} );

	it( 'Should return true if {{GAR/link}} template present', () => {
		const wikicode =
`{{Talk header}}
{{GAR/link|15:34, 17 February 2023 (UTC)|page=2|GARpage=1|status= }}

== Section ==
Test
`;
		const output = true;
		expect( wg.hasOpenGAR( wikicode ) ).toBe( output );
	} );

	it( 'Should be case insensitive', () => {
		const wikicode =
`{{Talk header}}
{{gar/link|15:34, 17 February 2023 (UTC)|page=2|GARpage=1|status= }}

== Section ==
Test
`;
		const output = true;
		expect( wg.hasOpenGAR( wikicode ) ).toBe( output );
	} );
} );

describe( '_wikicodeHasTemplate( wikicode, listOfTemplates )', () => {
	it( '0 templates in haystack, 0 templates to search for', () => {
		const wikicode = `Test`;
		const listOfTemplates = [];
		const expected = false;
		expect( wg._wikicodeHasTemplate( wikicode, listOfTemplates ) ).toBe( expected );
	} );

	it( '1 template in haystack, 0 templates to search for', () => {
		const wikicode = `Test {{GA}}`;
		const listOfTemplates = [];
		const expected = false;
		expect( wg._wikicodeHasTemplate( wikicode, listOfTemplates ) ).toBe( expected );
	} );

	it( '1 template in haystack, 1 template to search for', () => {
		const wikicode = `Test {{GA}}`;
		const listOfTemplates = [ 'GA' ];
		const expected = true;
		expect( wg._wikicodeHasTemplate( wikicode, listOfTemplates ) ).toBe( expected );
	} );

	it( '1 template in haystack, 2 templates to search for #1', () => {
		const wikicode = `Test {{GA}}`;
		const listOfTemplates = [ 'GA', 'FA' ];
		const expected = true;
		expect( wg._wikicodeHasTemplate( wikicode, listOfTemplates ) ).toBe( expected );
	} );

	it( '1 template in haystack, 2 templates to search for #2', () => {
		const wikicode = `Test {{GA}} {{FA}}`;
		const listOfTemplates = [ 'GA', 'FA' ];
		const expected = true;
		expect( wg._wikicodeHasTemplate( wikicode, listOfTemplates ) ).toBe( expected );
	} );

	it( '1 template in haystack, 2 templates to search for #3', () => {
		const wikicode = `Test {{FA}}`;
		const listOfTemplates = [ 'GA', 'FA' ];
		const expected = true;
		expect( wg._wikicodeHasTemplate( wikicode, listOfTemplates ) ).toBe( expected );
	} );
} );
