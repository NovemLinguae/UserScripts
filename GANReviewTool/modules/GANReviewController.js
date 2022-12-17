import { GANReviewHTMLGenerator } from "./GANReviewHTMLGenerator";
import { GANReviewWikicodeGenerator } from "./GANReviewWikicodeGenerator";

export class GANReviewController {
	/**
	 * @param {function} $ jQuery
	 * @param {mw} mw mediawiki, https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw
	 * @param {Location} location https://developer.mozilla.org/en-US/docs/Web/API/Window/location
	 * @param {GANReviewWikicodeGenerator} wg
	 * @param {GANReviewHTMLGenerator} hg
	 */
	async execute($, mw, location, wg, hg) {
		if ( arguments.length !== 5 ) throw new Error('Incorrect # of arguments');

		this.$ = $;
		this.mw = mw;
		this.location = location;
		this.wg = wg;
		this.hg = hg;

		this.ganReviewPageTitle = this.mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
		this.ganReviewPageTitle = this.ganReviewPageTitle.replace(/_/g, ' '); // underscores to spaces. prevents some bugs later

		if ( ! this.shouldRunOnThisPageQuickChecks(this.ganReviewPageTitle) ) return;
		if ( ! await this.shouldRunOnThisPageSlowChecks() ) return;

		this.displayForm();
		await this.warnUserIfNotReviewCreator();
		this.handleUserChangingFormType();

		this.$(`#GANReviewTool-Submit`).on('click', async () => {
			await this.clickSubmit();
		});
	}

	/**
	 * @private
	 */
	async clickSubmit() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.readFormAndSetVariables();

		let hasFormValidationErrors = this.validateForm();
		if ( hasFormValidationErrors ) {
			return;
		}

		this.$(`#GANReviewTool-Form`).hide();
		this.$(`#GANReviewTool-ProcessingMessage`).show();

		this.editSummarySuffix = ' ([[User:Novem Linguae/Scripts/GANReviewTool|GANReviewTool]])';
		this.reviewTitle = this.ganReviewPageTitle;
		this.error = false;
		try {
			if ( this.action === 'pass' ) {
				await this.doPass();
			} else if ( this.action === 'fail' ) {
				await this.doFail();
			} else if ( this.action === 'placeOnHold' ) {
				await this.placeOnHold();
			} else if ( this.action === 'askSecondOpinion' ) {
				await this.askSecondOpinion();
			} else if ( this.action === 'answerSecondOpinion' ) {
				await this.answerSecondOpinion();
			}
		} catch(err) {
			this.pushStatus(`<span class="GANReviewTool-ErrorNotice">An error occurred :( Details: ${err.message}</span>`);
			this.error = err;
		}

		await this.writeToLog();

		if ( ! this.error ) {
			this.pushStatus('Script complete. Refreshing page.');
			// TODO: 1 second delay?

			location.reload();
		}
	}

	async placeOnHold() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.editSummary = `placed [[${this.gaTitle}]] GAN nomination on hold` + this.editSummarySuffix;

		await this.processOnHoldForTalkPage();
	}

	async askSecondOpinion() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.editSummary = `asked for a 2nd opinion regarding [[${this.gaTitle}]] GAN nomination` + this.editSummarySuffix;

		await this.processAskSecondOpinionForTalkPage();
	}

	async answerSecondOpinion() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.editSummary = `answered 2nd opinion request regarding [[${this.gaTitle}]] GAN nomination` + this.editSummarySuffix;

		await this.processAnswerSecondOpinionForTalkPage();
	}

	/**
	 * @private
	 */
	async processOnHoldForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Marking article talk page status as "on hold"');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		talkWikicode = this.wg.getOnHoldWikicodeForTalkPage(talkWikicode);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	/**
	 * @private
	 */
	async processAskSecondOpinionForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Marking article talk page status as "asking for a second opinion"');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		talkWikicode = this.wg.getAskSecondOpinionWikicodeForTalkPage(talkWikicode);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	/**
	 * @private
	 */
	async processAnswerSecondOpinionForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Marking article talk page status as "answered second opinion request (onreview)"');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		talkWikicode = this.wg.getAnswerSecondOpinionWikicodeForTalkPage(talkWikicode);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	/**
	 * @return {boolean} hasFormValidationErrors
	 * @private
	 */
	validateForm() {
		this.$(`.GANReviewTool-ValidationError`).hide();

		let hasFormValidationErrors = false;

		// if pass, a WP:GA subpage heading must be selected
		if ( this.action === 'pass' && ! this.detailedTopic ) {
			this.$(`#GANReviewTool-NoTopicMessage`).show();
			hasFormValidationErrors = true;
		}

		// "Wikicode to display" text box must not contain a pipe. Prevents this kind of thing from being written to the [[WP:GA]] subpages: [[HMS Resistance (1801)|HMS Resistance (1801)|HMS ''Resistance'' (1801)]]
		if ( this.$(`[name="GANReviewTool-DisplayWikicode"]`).val().includes('|') ) {
			this.$(`#GANReviewTool-NoPipesMessage`).show();
			hasFormValidationErrors = true;
		}

		return hasFormValidationErrors;
	}

	/**
	 * @private
	 */
	async doPass() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.editSummary = `promote [[${this.gaTitle}]] to good article` + this.editSummarySuffix;
		this.gaSubpageShortTitle = this.$(`[name="GANReviewTool-Topic"]`).val();

		if ( this.needsATOP ) {
			await this.processPassForGANPage();
		}
		await this.processPassForTalkPage();
		await this.processPassForGASubPage();
	}

	/**
	 * @private
	 */
	async doFail() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.editSummary = `close [[${this.gaTitle}]] good article nomination as unsuccessful` + this.editSummarySuffix;

		if ( this.needsATOP ) {
			await this.processFailForGANPage();
		}
		await this.processFailForTalkPage();
	}

	/**
	 * @private
	 */
	async processFailForGANPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Placing {{atop}} and {{abot}} on GA review page.');
		let reviewWikicode = await this.getWikicode(this.ganReviewPageTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		reviewWikicode = this.wg.getFailWikicodeForGANPage(reviewWikicode);
		this.reviewRevisionID = await this.makeEdit(this.reviewTitle, this.editSummary, reviewWikicode);
	}

	/**
	 * @private
	 */
	async processFailForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Deleting {{GA nominee}} from article talk page.');
		this.pushStatus('Adding {{FailedGA}} or {{Article history}} to article talk page.');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		let oldid = await this.getRevisionIDOfNewestRevision(this.gaTitle);
		talkWikicode = this.wg.getFailWikicodeForTalkPage(talkWikicode, this.reviewTitle, oldid);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	/**
	 * @private
	 */
	async processPassForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Deleting {{GA nominee}} from article talk page.');
		this.pushStatus('Adding {{GA}} or {{Article history}} to article talk page.');
		this.pushStatus('Changing WikiProject template class parameters to GA on article talk page.');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		let oldid = await this.getRevisionIDOfNewestRevision(this.gaTitle);
		talkWikicode = this.wg.getPassWikicodeForTalkPage(talkWikicode, this.reviewTitle, this.gaSubpageShortTitle, oldid);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	/**
	 * @private
	 */
	async processPassForGASubPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Adding to appropriate subpage of [[WP:GA]]');
		let gaSubpageLongTitle = `Wikipedia:Good articles/` + this.gaSubpageShortTitle;
		let gaDisplayTitle = this.$(`[name="GANReviewTool-DisplayWikicode"]`).val();
		let gaSubpageWikicode = await this.getWikicode(gaSubpageLongTitle);
		gaSubpageWikicode = this.wg.getPassWikicodeForGAListPage(this.detailedTopic, gaSubpageWikicode, this.gaTitle, gaDisplayTitle);
		let gaSubPageEditSummary = this.getGASubPageEditSummary(this.editSummary, this.detailedTopic);
		this.gaRevisionID = await this.makeEdit(gaSubpageLongTitle, gaSubPageEditSummary, gaSubpageWikicode);
	}

	/**
	 * @private
	 */
	async processPassForGANPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Placing {{atop}} and {{abot}} on GA review page.');
		let reviewWikicode = await this.getWikicode(this.ganReviewPageTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		reviewWikicode = this.wg.getPassWikicodeForGANPage(reviewWikicode);
		this.reviewRevisionID = await this.makeEdit(this.reviewTitle, this.editSummary, reviewWikicode);
	}

	/**
	 * @private
	 */
	async getRevisionIDOfNewestRevision(pageTitle) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		let api = new this.mw.Api();
		let params = {
			"action": "query",
			"format": "json",
			"prop": "revisions",
			"titles": pageTitle,
			"formatversion": "2",
			"rvlimit": "1",
			"rvdir": "older"
		};
		let result = await api.post(params);
		let revisionID = result['query']['pages'][0]['revisions'][0]['revid'];
		return revisionID;
	}
	
	/**
	 * @private
	 */
	readFormAndSetVariables() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.action = this.$(`[name="GANReviewTool-PassOrFail"]:checked`).val();
		this.needsATOP = this.$(`[name="GANReviewTool-ATOPYesNo"]`).is(":checked");
		this.detailedTopic = document.querySelector(`[name="GANReviewTool-Topic"]`); // TODO: change this to jquery, so less dependencies, more unit testable
		this.detailedTopic = this.detailedTopic.options[this.detailedTopic.selectedIndex];
		this.detailedTopic = this.detailedTopic.text;
	}

	/**
	 * Show or hide different parts of the form depending on whether the user clicks pass or fail.
	 * @private
	 */
	handleUserChangingFormType() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.$(`[name="GANReviewTool-PassOrFail"]`).on('change', () => {
			if ( this.$(`[name="GANReviewTool-PassOrFail"]:checked`).val() === 'pass' ) {
				this.$(`#GANReviewTool-PassDiv`).show();
				this.$('#GANReviewTool-PassFailDiv').show();
			} else if ( this.$(`[name="GANReviewTool-PassOrFail"]:checked`).val() === 'fail' ) {
				this.$(`#GANReviewTool-PassDiv`).hide();
				this.$(`#GANReviewTool-NoTopicMessage`).hide();
				this.$('#GANReviewTool-PassFailDiv').show();
			} else { // onHold, askSecondOpinion, answerSecondOpinion
				this.$(`#GANReviewTool-PassDiv`).hide();
				this.$(`#GANReviewTool-NoTopicMessage`).hide();
				this.$('#GANReviewTool-PassFailDiv').hide();
			}
		});
	}

	/**
	 * Show a warning if viewer is not the creator of the GAN Review page. This is to help prevent accidentally closing the wrong GAN Review.
	 * @private
	 */
	async warnUserIfNotReviewCreator() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		let pageCreator = await this.getPageCreator(this.ganReviewPageTitle);
		if ( pageCreator !== this.mw.config.get('wgUserName') ) {
			this.$('.GANReviewTool-NotCreatorNotice').show();
		} else {
			this.$('#GANReviewTool-MainForm').show();
		}

		this.$('#GANReviewTool-ReviewAnywayLink').on('click', () => {
			this.$('.GANReviewTool-NotCreatorNotice').hide();
			this.$('#GANReviewTool-MainForm').show();
		});
	}

	/**
	 * @private
	 */
	displayForm() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.$('#mw-content-text').prepend(this.hg.getHTML(this.gaTitle));
	}

	/**
	 * @private
	 */
	async shouldRunOnThisPageSlowChecks() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		// only run if this review hasn't already been closed. check for {{atop}}
		let reviewWikicode = await this.getWikicode(this.ganReviewPageTitle);
		if ( reviewWikicode.match(/\{\{atop/i) ) {
			return false;
		}

		// only run if talk page has {{GA nominee}}
		this.gaTitle = this.getGATitle(this.ganReviewPageTitle);
		this.gaTalkTitle = this.getGATalkTitle(this.gaTitle);
		let talkWikicode = await this.getWikicode(this.gaTalkTitle);
		if ( this.ganReviewPageTitle !== 'User:Novem_Linguae/sandbox' && ! talkWikicode.match(/\{\{GA nominee/i) ) {
			return false;
		}

		return true;
	}
	
	/**
	 * @private
	 */
	async writeToLog() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		// always log no matter what. hopefully log some errors so I can fix them
		this.pushStatus('Adding to log');
		let username = this.mw.config.get('wgUserName');
		let textToAppend = this.wg.getLogMessageToAppend(username, this.action, this.reviewTitle, this.reviewRevisionID, this.talkRevisionID, this.gaRevisionID, this.error);
		await this.appendToPage('User:Novem Linguae/Scripts/GANReviewTool/GANReviewLog', this.editSummary, textToAppend);
	}

	/**
	 * @private
	 */
	async getWikicode(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		let api = new this.mw.Api();
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
	async makeEdit(title, editSummary, wikicode) {
		if ( arguments.length !== 3 ) throw new Error('Incorrect # of arguments');

		let api = new this.mw.Api();
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
	async getPageCreator(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		let api = new this.mw.Api();
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
	async appendToPage(title, editSummary, wikicodeToAppend) {
		if ( arguments.length !== 3 ) throw new Error('Incorrect # of arguments');

		let api = new this.mw.Api();
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
	pushStatus(statusToAdd) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		this.$(`#GANReviewTool-ProcessingMessage > p`).append('<br />' + statusToAdd);
	}

	/**
	 * @private
	 */
	shouldRunOnThisPageQuickChecks(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		// don't run when not viewing articles
		let action = this.mw.config.get('wgAction');
		if ( action != 'view' ) return false;
		
		// don't run when viewing diffs
		let isDiff = this.mw.config.get('wgDiffNewId');
		if ( isDiff ) return false;
		
		let isDeletedPage = ( ! this.mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) return false;

		// always run in Novem's sandbox
		if ( title === 'User:Novem_Linguae/sandbox' ) return true;
		
		// only run in talk namespace
		let namespace = this.mw.config.get('wgNamespaceNumber');
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
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		return Boolean(title.match(/\/GA\d{1,2}$/));
	}

	/**
	 * @private
	 */
	getGATitle(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		title = title.replace('Talk:', '');
		title = title.replace(/_/g, ' ');
		title = title.match(/^[^\/]*/)[0];
		return title;
	}

	/**
	 * @private
	 */
	getGATalkTitle(gaTitle) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		if ( gaTitle.includes(':') ) {
			return gaTitle.replace(/^([^:]*)(:.*)$/gm, '$1 talk$2');
		} else {
			return 'Talk:' + gaTitle;
		}
	}

	/**
	 * @param {string} detailedTopic The heading name, with leading and trailing === to denote it as a heading
	 * @private
	 */
	getGASubPageEditSummary(editSummary, detailedTopic) {
		if ( arguments.length !== 2 ) throw new Error('Incorrect # of arguments');

		// remove heading syntax == and trim
		detailedTopic = detailedTopic.match(/={2,6} ?(.+?) ?={2,6}/)[1];

		// remove '' style formatting, this should not go in the anchor. #''Test'' should be #Test
		detailedTopic = detailedTopic.replace(/'{2,}/g, '');
		
		// prepend /* heading */
		editSummary = `/* ${detailedTopic} */ ${editSummary}`;

		return editSummary;
	}
}