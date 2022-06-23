const { GANReviewToolView } = require("../modules/GANReviewToolView");

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

let view = new GANReviewToolView();

describe('getHTML(gaTitle)', () => {
	it(`injects $gaTitle into the form's HTML`, () => {
		let gaTitle = `UnqiueString~~~Test`;
		let output = 'UnqiueString~~~Test';
		expect(view.getHTML(gaTitle)).toMatch(output);
	});

	it(`html escapes $gaTitle before injecting it`, () => {
		let gaTitle = `UnqiueString~~~"&<>`;
		let output = 'UnqiueString~~~&quot;&amp;&lt;&gt;';
		expect(view.getHTML(gaTitle)).toMatch(output);
	});
});