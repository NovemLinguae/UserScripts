// <nowiki>

// See also: https://en.wikipedia.org/wiki/User:Novem_Linguae/Work_instructions/GAN

// TODO: selenium tests / Docker / GitHub Actions
// TODO: GANNominationTool.js

$(async function() {
	let title = mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
	title = title.replace(/_/g, ' '); // underscores to spaces. prevents some bugs later
	if ( ! shouldRunOnThisPage(title) ) return;

	// only run if this review hasn't already been closed. check for {{atop}}
	let reviewWikicode = await getWikicode(title);
	if ( reviewWikicode.match(/\{\{atop/i) ) return;

	// only run if talk page has {{GA nominee}}
	let gaTitle = getGATitle(title);
	let gaTalkTitle = getGATalkTitle(gaTitle);
	let talkWikicode = await getWikicode(gaTalkTitle);
	if ( title !== 'User:Novem_Linguae/sandbox' && ! talkWikicode.match(/\{\{GA nominee/i) ) return;

	// display HTML form
	$('#contentSub2').prepend(getHTML(gaTitle));

	// Show a warning if viewer is not the creator of the page
	let pageCreator = await getPageCreator(title);
	if ( pageCreator !== mw.config.get('wgUserName') ) {
		$('.GANReviewTool-NotCreatorNotice').show();
	} else {
		$('#GANReviewTool-MainForm').show();
	}

	$('#GANReviewTool-ReviewAnywayLink').on('click', function() {
		$('.GANReviewTool-NotCreatorNotice').hide();
		$('#GANReviewTool-MainForm').show();
	});

	// Show or hide different parts of the form depending on whether the user clicks pass or fail
	$(`[name="GANReviewTool-PassOrFail"]`).on('change', function() {
		if ( $(`[name="GANReviewTool-PassOrFail"]:checked`).val() === 'pass' ) {
			$(`#GANReviewTool-PassDiv`).show();
		} else {
			$(`#GANReviewTool-PassDiv`).hide();
		}
	});

	// Submit button
	$(`#GANReviewTool-Submit`).on('click', async function() {
		// if pass, a WP:GA subpage heading must be selected
		let passOrFail = $(`[name="GANReviewTool-PassOrFail"]:checked`).val();
		let gaSubpageHeading = document.querySelector(`[name="GANReviewTool-Topic"]`);
		gaSubpageHeading = gaSubpageHeading.options[gaSubpageHeading.selectedIndex];
		gaSubpageHeading = gaSubpageHeading.text;
		if ( passOrFail === 'pass' && ! gaSubpageHeading ) {
			$(`#GANReviewTool-FormValidationError`).show();
			return;
		}

		$(`#GANReviewTool-Form`).hide();
		$(`#GANReviewTool-ProcessingMessage`).show();

		let editSummarySuffix = ' ([[User:Novem Linguae/Scripts/GANReviewTool|GANReviewTool]])';

		let reviewTitle = title;
		let reviewRevisionID, talkRevisionID, gaRevisionID;
		let error = false;

		try {
			if ( passOrFail === 'pass' ) {
				let editSummary = `promote [[${gaTitle}]] to good article` + editSummarySuffix;

				pushStatus('Placing {{atop}} and {{abot}} on GA review page.');
				reviewWikicode = placeATOP(reviewWikicode, 'Passed ~~~~', 'green');
				reviewRevisionID = await makeEdit(reviewTitle, editSummary, reviewWikicode);
				
				pushStatus('Deleting {{GA nominee}} from article talk page.');
				let topic = getTopicFromGANomineeTemplate(talkWikicode);
				let gaPageNumber = getTemplateParameter(talkWikicode, 'GA nominee', 'page');
				talkWikicode = deleteGANomineeTemplate(talkWikicode);

				// TODO: get top revision ID of main article, pass it into below functions, have it add the revision ID
				pushStatus('Adding {{GA}} or {{Article history}} to article talk page.');
				let boolHasArticleHistoryTemplate = hasArticleHistoryTemplate(talkWikicode);
				if ( boolHasArticleHistoryTemplate ) {
					talkWikicode = updateArticleHistory(talkWikicode, topic, reviewTitle, 'listed');
				} else {
					talkWikicode = addGATemplate(talkWikicode, topic, gaPageNumber);
				}

				pushStatus('Changing WikiProject template class parameters to GA on article talk page.');
				talkWikicode = changeWikiProjectArticleClassToGA(talkWikicode);
				talkRevisionID = await makeEdit(gaTalkTitle, editSummary, talkWikicode);

				pushStatus('Adding to appropriate subpage of [[WP:GA]]');
				let gaSubpageTitle = $(`[name="GANReviewTool-Topic"]`).val();
				gaSubpageTitle = `Wikipedia:Good articles/` + gaSubpageTitle;
				let gaDisplayTitle = $(`[name="GANReviewTool-DisplayWikicode"]`).val();
				let gaSubpageWikicode = await getWikicode(gaSubpageTitle);
				gaSubpageWikicode = addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle);
				gaRevisionID = await makeEdit(gaSubpageTitle, editSummary, gaSubpageWikicode);
			} else if ( passOrFail === 'fail' ) {
				let editSummary = `close GAN as unsuccessful` + editSummarySuffix;

				pushStatus('Placing {{atop}} and {{abot}} on GA review page.');
				reviewWikicode = placeATOP(reviewWikicode, 'Unsuccessful ~~~~', 'red');
				reviewRevisionID = await makeEdit(reviewTitle, editSummary, reviewWikicode);

				pushStatus('Deleting {{GA nominee}} from article talk page.');
				let topic = getTopicFromGANomineeTemplate(talkWikicode);
				let gaPageNumber = getTemplateParameter(talkWikicode, 'GA nominee', 'page');
				talkWikicode = deleteGANomineeTemplate(talkWikicode);

				// TODO: get top revision ID of main article, pass it into below functions, have it add the revision ID
				pushStatus('Adding {{FailedGA}} or {{Article history}} to article talk page.');
				let boolHasArticleHistoryTemplate = hasArticleHistoryTemplate(talkWikicode);
				if ( boolHasArticleHistoryTemplate ) {
					talkWikicode = updateArticleHistory(talkWikicode, topic, reviewTitle, 'failed');
				} else {
					talkWikicode = addFailedGATemplate(talkWikicode, topic, gaPageNumber);
				}
				talkRevisionID = await makeEdit(gaTalkTitle, editSummary, talkWikicode);
			}
		} catch(err) {
			pushStatus('<span class="GANReviewTool-ErrorNotice">An error occurred :(</span>');
			error = err;
		}

		// always log no matter what. hopefully log some errors so I can fix them
		pushStatus('Adding to log');
		let editSummary = `log [[${gaTitle}]]` + editSummarySuffix;
		let username = mw.config.get('wgUserName');
		let textToAppend = getLogMessage(username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error);
		await appendToPage('User:Novem Linguae/Scripts/GANReviewTool/Log', editSummary, textToAppend);

		if ( ! error ) {
			pushStatus('Script complete. Refreshing page.');
			// TODO: 1 second delay?

			location.reload();
		}
	});
});

// </nowiki>