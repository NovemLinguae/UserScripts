const { MassGARWikicodeGenerator } = require("../modules/MassGARWikicodeGenerator.js");

let wg;
beforeEach(() => {
	wg = new MassGARWikicodeGenerator();
});

describe('hasGoodArticleTemplate(mainArticleWikicode)', () => {
	it(`Should return false if no good article templates found`, () => {
		let wikicode =
`{{Short description|None}}
{{USmusicgenres}}
== Test==
Test
`;
		let output = false;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});

	it(`Should detect {{Good article}} 1`, () => {
		let wikicode =
`{{Short description|None}}
{{Good article}}
{{USmusicgenres}}`;
		let output = true;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});

	it(`Should handle template being at top of wikicode`, () => {
		let wikicode =
`{{Good article}}
{{USmusicgenres}}`;
		let output = true;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});

	it(`Should handle template being at bottom of wikicode`, () => {
		let wikicode =
`{{USmusicgenres}}
{{Good article}}`;
		let output = true;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});

	it(`Should detect {{good article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{good article}}
{{USmusicgenres}}`;
		let output = true;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});

	it(`Should detect {{Good Article}} 2`, () => {
		let wikicode =
`{{Short description|None}}
{{Good Article}}
{{USmusicgenres}}`;
		let output = true;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});

	it(`Should detect {{GA article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{GA article}}
{{USmusicgenres}}`;
		let output = true;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});

	it(`Should detect {{ga article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{ga article}}
{{USmusicgenres}}`;
		let output = true;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});

	it(`Should detect {{GA icon}}`, () => {
		let wikicode =
`{{Short description|None}}
{{GA icon}}
{{USmusicgenres}}`;
		let output = true;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});

	it(`Should detect {{ga icon}}`, () => {
		let wikicode =
`{{Short description|None}}
{{ga icon}}
{{USmusicgenres}}`;
		let output = true;
		expect(wg.hasGoodArticleTemplate(wikicode)).toBe(output);
	});
});

describe('talkPageIndicatesGA(talkPageWikicode)', () => {
	it(`Should return false if not good article`, () => {
		let wikicode =
`{{Talk header}}
{{Article history
|status = DGA
}}

== Section ==
Test
`;
		let output = false;
		expect(wg.talkPageIndicatesGA(wikicode)).toBe(output);
	});

	it(`Should return true if {{GA}} template present`, () => {
		let wikicode =
`{{Talk header}}
{{GA|06:16, 24 March 2016 (UTC)|topic=Transport|page=2|oldid=711685892}}

== Section ==
Test
`;
		let output = true;
		expect(wg.talkPageIndicatesGA(wikicode)).toBe(output);
	});

	it(`Should not get confused by case insensitive, e.g. {{Ga}}`, () => {
		let wikicode =
`{{Talk header}}
{{Ga|06:16, 24 March 2016 (UTC)|topic=Transport|page=2|oldid=711685892}}

== Section ==
Test
`;
		let output = true;
		expect(wg.talkPageIndicatesGA(wikicode)).toBe(output);
	});

	it(`Should not detect templates starting with {{Ga as {{GA}}`, () => {
		let wikicode =
`{{Talk header}}
{{Game rationale}}

== Section ==
Test
`;
		let output = false;
		expect(wg.talkPageIndicatesGA(wikicode)).toBe(output);
	});

	it(`Should return true if {{Article history}} present and contains |currentstatus=GA`, () => {
		let wikicode =
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
		let output = true;
		expect(wg.talkPageIndicatesGA(wikicode)).toBe(output);
	});

	it(`Should not get confused by whitespace in |currentstatus=GA`, () => {
		let wikicode =
`{{Talk header}}
{{ArticleHistory
| currentstatus = GA
|topic=television}}

== Section ==
Test
`;
		let output = true;
		expect(wg.talkPageIndicatesGA(wikicode)).toBe(output);
	});

	it(`Should not get confused by |currentstatus=GA|`, () => {
		let wikicode =
`{{Talk header}}
{{ArticleHistory|currentstatus=GA|topic=television}}

== Section ==
Test
`;
		let output = true;
		expect(wg.talkPageIndicatesGA(wikicode)).toBe(output);
	});

	it(`Should not get confused by |currentstatus=GA}}`, () => {
		let wikicode =
`{{Talk header}}
{{ArticleHistory|currentstatus=GA}}

== Section ==
Test
`;
		let output = true;
		expect(wg.talkPageIndicatesGA(wikicode)).toBe(output);
	});

	it(`Should detect article history's aliases`, () => {
		let aliases = ['Articlehistory', 'Article milestones', 'Articlemilestones', 'Article History', 'ArticleHistory'];
		for ( let template of aliases ) {
			let wikicode =
`{{Talk header}}
{{${template}
| currentstatus = GA
| other stuff   = blah
}}

== Section ==
Test
`;
			let output = true;
			expect(wg.talkPageIndicatesGA(wikicode)).toBe(output);
		}
	});
});

describe('hasOpenGAR(talkPageWikicode)', () => {
	it(`Should return false if no GAR template present`, () => {
		let wikicode =
`{{Talk header}}
{{Article history
|status = DGA
}}

== Section ==
Test
`;
		let output = false;
		expect(wg.hasOpenGAR(wikicode)).toBe(output);
	});

	it(`Should return true if {{GAR/link}} template present`, () => {
		let wikicode =
`{{Talk header}}
{{GAR/link|15:34, 17 February 2023 (UTC)|page=2|GARpage=1|status= }}

== Section ==
Test
`;
		let output = true;
		expect(wg.hasOpenGAR(wikicode)).toBe(output);
	});

	it(`Should be case insensitive`, () => {
		let wikicode =
`{{Talk header}}
{{gar/link|15:34, 17 February 2023 (UTC)|page=2|GARpage=1|status= }}

== Section ==
Test
`;
		let output = true;
		expect(wg.hasOpenGAR(wikicode)).toBe(output);
	});
});