const { VoteCounterCounter } = require("../modules/VoteCounterCounter");

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/
// Don't forget to change all your classes to "export class"

describe('_convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)', () => {
	let vcc = new VoteCounterCounter('', []);

	it(`Should handle heading level 2`, () => {
		let lineOfWikicode = `==Test==`;
		let output = 'Test';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should handle heading level 4`, () => {
		let lineOfWikicode = `====Test====`;
		let output = 'Test';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should delete spaces touching == internally`, () => {
		let lineOfWikicode = `== Test ==`;
		let output = 'Test';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should delete spaces touching == externally`, () => {
		let lineOfWikicode = `==Test== `;
		let output = 'Test';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should change spaces to underscores`, () => {
		let lineOfWikicode = `==Test test==`;
		let output = 'Test_test';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should delete wikilink brackets`, () => {
		let lineOfWikicode = `==[[Test]]==`;
		let output = 'Test';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should delete bold`, () => {
		let lineOfWikicode = `=='''Test'''==`;
		let output = 'Test';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should delete italic`, () => {
		let lineOfWikicode = `==''Test''==`;
		let output = 'Test';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should handle {{tlx}}`, () => {
		let lineOfWikicode = `=== Proposal 22: Add short description and shorten {{tlx|GANentry}} ===`;
		let output = 'Proposal_22:_Add_short_description_and_shorten_{{GANentry}}';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should handle {{u}}`, () => {
		let lineOfWikicode = `== {{U|Pvmoutside}} autopatrolled rights ==`;
		let output = 'Pvmoutside_autopatrolled_rights';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should handle piped wikilinks, e.g. [[User:abc|abc]]`, () => {
		let lineOfWikicode = `== Requesting lift of Topic Ban on Sports Articles from [[User:NicholasHui|NicholasHui]] ==`;
		let output = 'Requesting_lift_of_Topic_Ban_on_Sports_Articles_from_NicholasHui';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});

	it(`Should convert multiple spaces to one space`, () => {
		let lineOfWikicode = `====Proposal A:  IBAN Between [[User:BrownHairedGirl]] and [[User:Laurel Lodged]]==== `;
		let output = 'Proposal_A:_IBAN_Between_User:BrownHairedGirl_and_User:Laurel_Lodged';
		expect(vcc._convertWikicodeHeadingToHTMLSectionID(lineOfWikicode)).toEqual(output);
	});
});