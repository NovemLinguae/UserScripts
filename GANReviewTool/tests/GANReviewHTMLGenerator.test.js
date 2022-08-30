const { GANReviewHTMLGenerator } = require("../modules/GANReviewHTMLGenerator");

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

let hg = new GANReviewHTMLGenerator();

describe('getHTML(gaTitle)', () => {
	it(`Should inject $gaTitle into the form's HTML`, () => {
		let gaTitle = `UnqiueString~~~Test`;
		let output = 'UnqiueString~~~Test';
		expect(hg.getHTML(gaTitle)).toMatch(output);
	});

	it(`Should html escape $gaTitle before injecting it`, () => {
		let gaTitle = `UnqiueString~~~"&<>`;
		let output = 'UnqiueString~~~&quot;&amp;&lt;&gt;';
		expect(hg.getHTML(gaTitle)).toMatch(output);
	});
});

describe('getDefaultDisplayText(gaTitle)', () => {
	it(`Should handle no parentheses`, () => {
		let gaTitle = `Test`;
		let output = 'Test';
		expect(hg.getDefaultDisplayText(gaTitle)).toMatch(output);
	});

	it(`Should handle parentheses not in dictionary`, () => {
		let gaTitle = `Test (123)`;
		let output = 'Test (123)';
		expect(hg.getDefaultDisplayText(gaTitle)).toMatch(output);
	});

	it(`Should handle parentheses in dictionary suffixesThatTriggerItalics`, () => {
		let gaTitle = `Test (album)`;
		let output = `''Test'' (album)`;
		expect(hg.getDefaultDisplayText(gaTitle)).toMatch(output);
	});

	it(`Should handle parentheses in dictionary suffixesThatTriggerDoubleQuotes`, () => {
		let gaTitle = `Test (song)`;
		let output = '"Test" (song)';
		expect(hg.getDefaultDisplayText(gaTitle)).toMatch(output);
	});

	it(`Should handle parentheses in dictionary suffixesThatTriggerDoubleQuotesAndItalics`, () => {
		let gaTitle = `Test (30 Rock)`;
		let output = `"Test" (''30 Rock'')`;
		expect(hg.getDefaultDisplayText(gaTitle)).toMatch(output);
	});

	it(`Should handle long parentheses in dictionary suffixesThatTriggerDoubleQuotesAndItalics`, () => {
		let gaTitle = `Test (Test2 30 Rock)`;
		let output = `"Test" (''Test2 30 Rock'')`;
		expect(hg.getDefaultDisplayText(gaTitle)).toMatch(output);
	});

	it(`Should handle Llegar a Ti (song)`, () => {
		let gaTitle = `Llegar a Ti (song)`;
		let output = `"Llegar a Ti" (song)`;
		expect(hg.getDefaultDisplayText(gaTitle)).toMatch(output);
	});
});