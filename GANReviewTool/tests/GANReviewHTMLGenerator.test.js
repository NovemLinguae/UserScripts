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