const { GARCloserController } = require("../modules/GARCloserController.js");

let controller;
beforeEach(() => {
	controller = new GARCloserController();
});

// Private methods ===========================================================

describe('getIndividualReassessmentParentArticle(title)', () => {
	it(`Should handle a high numbered GA (e.g. GA12)`, () => {
		let title = `Talk:Abcdef/GA12`;
		let output = 'Abcdef';
		expect(controller.getIndividualReassessmentParentArticle(title)).toBe(output);
	});

	it(`Should handle a space in title`, () => {
		let title = `Talk:Abc def/GA2`;
		let output = 'Abc def';
		expect(controller.getIndividualReassessmentParentArticle(title)).toBe(output);
	});

	it(`Should handle slash in title`, () => {
		let title = `Talk:Abc def/test/GA2`;
		let output = 'Abc def/test';
		expect(controller.getIndividualReassessmentParentArticle(title)).toBe(output);
	});
});

describe('getCommunityReassessmentParentArticle(title)', () => {
	it(`Should handle a high number (e.g. 12)`, () => {
		let title = `Wikipedia:Good article reassessment/Abcdef/12`;
		let output = 'Abcdef';
		expect(controller.getCommunityReassessmentParentArticle(title)).toBe(output);
	});

	it(`Should handle a space in title`, () => {
		let title = `Wikipedia:Good article reassessment/Abc def/2`;
		let output = 'Abc def';
		expect(controller.getCommunityReassessmentParentArticle(title)).toBe(output);
	});

	it(`Should handle slash in title`, () => {
		let title = `Wikipedia:Good article reassessment/Abc def/test/2`;
		let output = 'Abc def/test';
		expect(controller.getCommunityReassessmentParentArticle(title)).toBe(output);
	});
});

describe('countOccurrencesInString(needleRegEx, haystack)', () => {
	it(`Should count wikicode level 2 headings`, () => {
		let needleRegEx = /^==[^=]*==$/gm;
		let haystack =
`== Test ==
aa

=== Test ===
bb

== Test2 ==
cc`;
		let output = 2;
		expect(controller.countOccurrencesInString(needleRegEx, haystack)).toBe(output);
	});
});

describe('incrementArchiveTitle(title)', () => {
	it(`Should increment a high-numbered community assessment archive page`, () => {
		let title = 'Wikipedia:Good article reassessment/Archive 67';
		let output = 'Wikipedia:Good article reassessment/Archive 68';
		expect(controller.incrementArchiveTitle(title)).toBe(output);
	});
});

describe('getGAListTitleFromTalkPageWikicode(wikicode)', () => {
	it(`Should handle topic`, () => {
		let wikicode = '{{Article history|topic=television}}';
		let output = 'Wikipedia:Good articles/Media and drama';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should handle subtopic`, () => {
		let wikicode = '{{Article history|subtopic=television}}';
		let output = 'Wikipedia:Good articles/Media and drama';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should handle uppercase`, () => {
		let wikicode = '{{Article history|topic=Television}}';
		let output = 'Wikipedia:Good articles/Media and drama';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should handle spaces`, () => {
		let wikicode = '{{Article history|topic=agriculture, food, and drink}}';
		let output = 'Wikipedia:Good articles/Agriculture, food and drink';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should handle multiline`, () => {
		let wikicode =
`{{GAR/link|04:19, 11 January 2022 (UTC)|page=1|GARpage=1|status= }}
{{Article history|action1=GAN
|action1date=19 August 2007
|action1result=listed
|action1link=
|action1oldid=152335196

|action2=GAR
|action2date=12:58, 10 June 2009 (UTC)
|action2link=Talk:WIN Television#GA Sweeps
|action2result=kept
|action2oldid=293945032

|currentstatus=GA
|topic=Television
}}`;
		let output = 'Wikipedia:Good articles/Media and drama';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});
});

describe('getGAListTitleFromTalkPageWikicode(wikicode)', () => {
	it(`Should handle {{Article history}}`, () => {
		let wikicode = `{{Article history|topic=sports}}`;
		let output = 'Wikipedia:Good articles/Sports and recreation';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should handle {{GA}}`, () => {
		let wikicode = `{{GA|topic=sports}}`;
		let output = 'Wikipedia:Good articles/Sports and recreation';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should be case insensitive`, () => {
		let wikicode = `{{aRTiClE HiStOrY|ToPiC=SpOrTs}}`;
		let output = 'Wikipedia:Good articles/Sports and recreation';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should ignore {{Vital article}}`, () => {
		let wikicode =
`{{Vital article|level=5|topic=People|subpage=Entertainers|class=}}
{{Article history|action1=GAN
|action1date=22:40, 2 June 2008
|action1link=/GA1
|action1result=listed
|action1oldid=216607709
|topic=sports
|currentstatus = DGA
}}`;
		let output = 'Wikipedia:Good articles/Sports and recreation';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should ignore {{Vital article}} 2`, () => {
		let wikicode =
`{{GAR/link|17:25, 24 December 2022 (UTC)|page=1|GARpage=1|status= }}
{{Talk header}}
{{Vital article|topic=Society|level=5|class=GA}}
{{Article history
|action1=GAN
|action1date=21:19, 17 December 2006
|action1result=listed
|action1oldid=94955852

|action2=GAR
|action2date=18:59, 2 April 2008 (UTC)
|action2result=kept
|action2oldid=202860759

|currentstatus=GA
|topic=television
}}`;
		let output = 'Wikipedia:Good articles/Media and drama';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should ignore {{Vital article}} and not ignore {{ArticleHistory}}`, () => {
		let wikicode =
`{{GAR/link|17:25, 24 December 2022 (UTC)|page=1|GARpage=1|status= }}
{{Talk header}}
{{Vital article|topic=Society|level=5|class=GA}}
{{ArticleHistory
|action1=GAN
|action1date=21:19, 17 December 2006
|action1result=listed
|action1oldid=94955852

|action2=GAR
|action2date=18:59, 2 April 2008 (UTC)
|action2result=kept
|action2oldid=202860759

|currentstatus=GA
|topic=television
}}`;
		let output = 'Wikipedia:Good articles/Media and drama';
		expect(controller.getGAListTitleFromTalkPageWikicode(wikicode)).toBe(output);
	});

	it(`Should throw an error if no |topic= found`, () => {
		let wikicode = `Test :)`;
		expect(() => {controller.getGAListTitleFromTalkPageWikicode(wikicode)}).toThrow();
	});
});