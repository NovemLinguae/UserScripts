// <nowiki>

const { GANReviewHTMLGenerator } = require("./modules/GANReviewHTMLGenerator.js");
const { GANReviewWikicodeGenerator } = require("./modules/GANReviewWikicodeGenerator.js");
const { GARCloserHTMLGenerator } = require("./modules/GARCloserHTMLGenerator.js");
const { GARCloserWikicodeGenerator } = require("./modules/GARCloserWikicodeGenerator.js");

$(async function() {
	let ganController = new GANReviewController();
	await ganController.execute($, mw, location, new GANReviewWikicodeGenerator(), new GANReviewHTMLGenerator());

	let garController = new GARCloserController();
	await garController.execute($, mw, location, new GARCloserWikicodeGenerator(), new GARCloserHTMLGenerator());
});

// </nowiki>