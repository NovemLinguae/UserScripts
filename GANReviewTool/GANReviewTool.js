// <nowiki>

$(async function() {
	let ganController = new GANReviewToolController();
	await ganController.execute($, mw, location);

	let garController = new GARCloserController();
	await garController.execute($, mw, location);
});

// </nowiki>