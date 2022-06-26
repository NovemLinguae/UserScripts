// giving up on node.js style includes for now. is messing up my unit test includes
//const { GANReviewToolView } = require("./modules/GANReviewToolView");
//const { GANReviewToolService } = require("./modules/GANReviewToolService");

export class GANReviewToolController {
	async execute($, mw, location) { // Classes are walled gardens. Global variables must be passed in. This is good!
		let title = mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
		title = title.replace(/_/g, ' '); // underscores to spaces. prevents some bugs later
		if ( ! this.shouldRunOnThisPage(title) ) return;

		// only run if this review hasn't already been closed. check for {{atop}}
		let reviewWikicode = await this.getWikicode(title, mw);
		if ( reviewWikicode.match(/\{\{atop/i) ) return;

		// only run if talk page has {{GA nominee}}
		let gaTitle = this.getGATitle(title);
		let gaTalkTitle = this.getGATalkTitle(gaTitle);
		let talkWikicode = await this.getWikicode(gaTalkTitle, mw);
		if ( title !== 'User:Novem_Linguae/sandbox' && ! talkWikicode.match(/\{\{GA nominee/i) ) return;

		// display HTML form
		let view = new GANReviewToolView();
		$('#contentSub2').prepend(view.getHTML(gaTitle));

		// Show a warning if viewer is not the creator of the page
		let pageCreator = await this.getPageCreator(title, mw);
		if ( pageCreator !== mw.config.get('wgUserName') ) {
			$('.GANReviewTool-NotCreatorNotice').show();
		} else {
			$('#GANReviewTool-MainForm').show();
		}

		$('#GANReviewTool-ReviewAnywayLink').on('click', () => { // must use arrow functions in classes. else "this" keyword is not properly recognized, and can't acess class methods
			$('.GANReviewTool-NotCreatorNotice').hide();
			$('#GANReviewTool-MainForm').show();
		});

		// Show or hide different parts of the form depending on whether the user clicks pass or fail
		$(`[name="GANReviewTool-PassOrFail"]`).on('change', () => { // must use arrow functions in classes. else "this" keyword is not properly recognized, and can't acess class methods
			if ( $(`[name="GANReviewTool-PassOrFail"]:checked`).val() === 'pass' ) {
				$(`#GANReviewTool-PassDiv`).show();
			} else {
				$(`#GANReviewTool-PassDiv`).hide();
			}
		});

		// Submit button
		$(`#GANReviewTool-Submit`).on('click', async () => { // must use arrow functions in classes. else "this" keyword is not properly recognized, and can't acess class methods
			// if pass, a WP:GA subpage heading must be selected
			let passOrFail = $(`[name="GANReviewTool-PassOrFail"]:checked`).val();
			let needsATOP = $(`[name="GANReviewTool-ATOPYesNo"]`).is(":checked");
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

			let service = new GANReviewToolService();

			try {
				if ( passOrFail === 'pass' ) {
					let editSummary = `promote [[${gaTitle}]] to good article` + editSummarySuffix;

					if ( needsATOP ) {
						this.pushStatus('Placing {{atop}} and {{abot}} on GA review page.', $);
						reviewWikicode = await this.getWikicode(title, mw); // get this wikicode again, in case it changed between page load and "submit" button click
						reviewWikicode = service.getPassWikicodeForGANPage(reviewWikicode);
						reviewRevisionID = await this.makeEdit(reviewTitle, editSummary, reviewWikicode, mw);
					}
					
					this.pushStatus('Deleting {{GA nominee}} from article talk page.', $);
					this.pushStatus('Adding {{GA}} or {{Article history}} to article talk page.', $);
					this.pushStatus('Changing WikiProject template class parameters to GA on article talk page.', $);
					talkWikicode = await this.getWikicode(gaTalkTitle, mw); // get this wikicode again, in case it changed between page load and "submit" button click
					talkWikicode = service.getPassWikicodeForTalkPage(talkWikicode, reviewTitle);
					talkRevisionID = await this.makeEdit(gaTalkTitle, editSummary, talkWikicode, mw);

					this.pushStatus('Adding to appropriate subpage of [[WP:GA]]', $);
					let gaSubpageTitle = $(`[name="GANReviewTool-Topic"]`).val();
					gaSubpageTitle = `Wikipedia:Good articles/` + gaSubpageTitle;
					let gaDisplayTitle = $(`[name="GANReviewTool-DisplayWikicode"]`).val();
					let gaSubpageWikicode = await this.getWikicode(gaSubpageTitle, mw);
					gaSubpageWikicode = service.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle);
					gaRevisionID = await this.makeEdit(gaSubpageTitle, editSummary, gaSubpageWikicode, mw);
				} else if ( passOrFail === 'fail' ) {
					let editSummary = `close GAN as unsuccessful` + editSummarySuffix;

					if ( needsATOP ) {
						this.pushStatus('Placing {{atop}} and {{abot}} on GA review page.', $);
						reviewWikicode = await this.getWikicode(title, mw); // get this wikicode again, in case it changed between page load and "submit" button click
						reviewWikicode = service.getFailWikicodeForGANPage(reviewWikicode);
						reviewRevisionID = await this.makeEdit(reviewTitle, editSummary, reviewWikicode, mw);
					}

					this.pushStatus('Deleting {{GA nominee}} from article talk page.', $);
					this.pushStatus('Adding {{FailedGA}} or {{Article history}} to article talk page.', $);
					talkWikicode = await this.getWikicode(gaTalkTitle, mw); // get this wikicode again, in case it changed between page load and "submit" button click
					talkWikicode = service.getFailWikicodeForTalkPage(talkWikicode, reviewTitle);
					talkRevisionID = await this.makeEdit(gaTalkTitle, editSummary, talkWikicode, mw);
				}
			} catch(err) {
				this.pushStatus('<span class="GANReviewTool-ErrorNotice">An error occurred :(</span>', $);
				error = err;
			}

			// always log no matter what. hopefully log some errors so I can fix them
			this.pushStatus('Adding to log', $);
			let editSummary = `log [[${gaTitle}]]` + editSummarySuffix;
			let username = mw.config.get('wgUserName');
			let textToAppend = service.getLogMessage(username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error, needsATOP);
			await this.appendToPage('User:Novem Linguae/Scripts/GANReviewTool/Log', editSummary, textToAppend, mw);

			if ( ! error ) {
				this.pushStatus('Script complete. Refreshing page.', $);
				// TODO: 1 second delay?

				location.reload();
			}
		});
	}

	/**
	  * @private
	  */
	async getWikicode(title, mw) {
		let api = new mw.Api();
		let params = {
			"action": "parse",
			"page": title,
			"prop": "wikitext",
			"format": "json",
		};
		let result = await api.post(params);
		if ( result['error'] ) return '';
		let wikicode = result['parse']['wikitext']['*'];
		return wikicode;
	}

	/**
	  * @private
	  */
	async makeEdit(title, editSummary, wikicode, mw) {
		let api = new mw.Api();
		let params = {
			"action": "edit",
			"format": "json",
			"title": title,
			"text": wikicode,
			"summary": editSummary,
		};
		let result = await api.postWithToken('csrf', params);
		let revisionID = result['edit']['newrevid'];
		return revisionID;
	}

	/**
	  * @private
	  */
	async getPageCreator(title, mw) {
		let api = new mw.Api();
		let params = {
			action: 'query',
			prop: 'revisions',
			titles: title,
			rvlimit: 1,
			rvprop: 'user',
			rvdir: 'newer',
			format: 'json',
		};
		let result = await api.post(params);
		let wikicode = result['query']['pages']
		let key = Object.keys(wikicode)[0];
		wikicode = wikicode[key]['revisions'][0]['user'];
		return wikicode;
	}

	/**
	  * Lets you append without getting the Wikicode first. Saves an API query.
	  * @private
	  */
	async appendToPage(title, editSummary, wikicodeToAppend, mw) {
		let api = new mw.Api();
		let params = {
			"action": "edit",
			"format": "json",
			"title": title,
			"appendtext": wikicodeToAppend,
			"summary": editSummary,
		};
		let result = await api.postWithToken('csrf', params);
		let revisionID = result['edit']['newrevid'];
		return revisionID;
	}

	/**
	  * @private
	  */
	pushStatus(statusToAdd, $) {
		$(`#GANReviewTool-ProcessingMessage > p`).append('<br />' + statusToAdd);
	}

	/**
	  * @private
	  */
	shouldRunOnThisPage(title) {
		// don't run when not viewing articles
		let action = mw.config.get('wgAction');
		if ( action != 'view' ) return false;
		
		// don't run when viewing diffs
		let isDiff = mw.config.get('wgDiffNewId');
		if ( isDiff ) return false;
		
		let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) return false;

		// always run in Novem's sandbox
		if ( title === 'User:Novem_Linguae/sandbox' ) return true;
		
		// only run in talk namespace
		let namespace = mw.config.get('wgNamespaceNumber');
		let isTalkNamespace = ( namespace === 1 );
		if ( ! isTalkNamespace ) return false;

		// only run on pages that end in /GA##
		if ( ! this.isGASubPage(title) ) return false;

		return true;
	}

	/**
	  * @private
	  */
	isGASubPage(title) {
		return Boolean(title.match(/\/GA\d{1,2}$/));
	}

	/**
	  * @private
	  */
	getGATitle(title) {
		title = title.replace('Talk:', '');
		title = title.replace(/_/g, ' ');
		title = title.match(/^[^\/]*/)[0];
		return title;
	}

	/**
	  * @private
	  */
	getGATalkTitle(gaTitle) {
		if ( gaTitle.includes(':') ) {
			return gaTitle.replace(/^([^:]*)(:.*)$/gm, '$1 talk$2');
		} else {
			return 'Talk:' + gaTitle;
		}
	}
}