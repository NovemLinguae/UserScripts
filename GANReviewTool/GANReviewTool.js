// <nowiki>

const { GANReviewController } = require("./modules/GANReviewController.js");
const { GANReviewHTMLGenerator } = require("./modules/GANReviewHTMLGenerator.js");
const { GANReviewWikicodeGenerator } = require("./modules/GANReviewWikicodeGenerator.js");
const { GARCloserController } = require("./modules/GARCloserController.js");
const { GARCloserHTMLGenerator } = require("./modules/GARCloserHTMLGenerator.js");
const { GARCloserWikicodeGenerator } = require("./modules/GARCloserWikicodeGenerator.js");
const { MassGARController } = require("./modules/MassGARController.js");
const { MassGARWikicodeGenerator } = require("./modules/MassGARWikicodeGenerator.js");

$(async function() {
	let ganController = new GANReviewController();
	await ganController.execute(
		$,
		mw,
		location,
		new GANReviewWikicodeGenerator(),
		new GANReviewHTMLGenerator()
	);

	let garController = new GARCloserController();
	await garController.execute(
		$,
		mw,
		location,
		new GARCloserWikicodeGenerator(),
		new GARCloserHTMLGenerator()
	);

	let massGARController = new MassGARController();
	await massGARController.execute(
		$,
		mw,
		new MassGARWikicodeGenerator(),
		new GARCloserController(),
		new GARCloserWikicodeGenerator()
	);

	// TODO: extract API calls into a MediaWikiApi class, which is essentially the model. can be 1 class used by both GANReviewController and GARCloserController
	// TODO: extract $ and location into a Browser class, which is essentially the view. maybe also merge HTMLGenerators into this class
	// TODO: selenium tests
});

// </nowiki>