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