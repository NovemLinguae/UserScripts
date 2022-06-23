// <nowiki>

// giving up on node.js style includes for now. is messing up my unit test includes
//const { GANReviewToolController } = require("./modules/GANReviewToolController");

// See also: https://en.wikipedia.org/wiki/User:Novem_Linguae/Work_instructions/GAN

// TODO: selenium tests / Docker / GitHub Actions
// TODO: GANNominationTool.js

$(async function() {
	let controller = new GANReviewToolController();
	await controller.execute($, mw, location);
});

// </nowiki>