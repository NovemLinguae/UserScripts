export class GARCloserController {
	/**
	 * @param {function} $ jQuery
	 * @param {Object} mw mediawiki object, https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw
	 * @param {Location} location https://developer.mozilla.org/en-US/docs/Web/API/Window/location
	 * @param {GARCloserWikicodeGenerator} wg
	 * @param {GARCloserHTMLGenerator} hg
	 */
	async execute($, mw, location, wg, hg) {
		this.$ = $;
		this.mw = mw;
		this.location = location;
		this.wg = wg;
		this.hg = hg;

		this.scriptLogTitle = `User:Novem Linguae/Scripts/GANReviewTool/GARLog`;
		this.editSummarySuffix = ' ([[User:Novem Linguae/Scripts/GANReviewTool|GANReviewTool]])';

		this.garPageTitle = this.mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
		this.garPageTitle = this.garPageTitle.replace(/_/g, ' '); // underscores to spaces. prevents some bugs later

		if ( ! this.shouldRunOnThisPageQuickChecks() ) {
			return;
		}

		this.parentArticle = await this.confirmGARAndGetArticleName();
		if ( ! this.parentArticle ) {
			return;
		}

		// TODO: remove this when done testing
		let username = this.mw.config.get('wgUserName');
		if ( username !== "Novem Linguae" ) {
			return;
		}

		// place HTML on page
		this.$(`.mw-headline`).first().append(hg.getHTML());

		this.$(`#GARCloser-Keep`).on('click', async () => {
			this.clickKeep();
		});

		this.$(`#GARCloser-Delist`).on('click', async () => {
			this.clickDelist();
		});
	}

	/**
	 * @private
	 */
	clickKeep() {
		// TODO: {{subst:GAR/result|result=outcome}} ~~~~ ? Ask Femke. May need to check if user already did it. Would do for both keep and delist.

		try {
			this.editSummary = `close GAR [[${this.garPageTitle}]] as keep` + this.editSummarySuffix;
			this.deactivateBothButtons();
			await this.processKeepForGARPage();
			await this.processKeepForTalkPage(`Talk:${this.parentArticle}`);
			if ( this.isCommunityAssessment() ) {
				// await this.makeCommunityAssessmentLogEntry();
			}
		} catch(err) {
			this.error = err;
		}

		await this.makeScriptLogEntry('keep');

		if ( ! this.error ) {
			this.pushStatus(`Done! Reloading...`);
			location.reload();
		}
	}

	clickDelist() {
		/*
		
		try {
			let editSummary = `close GAR [[${this.garPageTitle}]] as delist` + this.editSummarySuffix;
			this.deactivateBothButtons();
			await this.processDelistForGARPage();
			await this.processDelistForTalkPage();
			await this.processDelistForArticle();
			await this.processDelistForGAList();
			if ( this.isCommunityAssessment() ) {
				await this.makeCommunityAssessmentLogEntry();
			}
		} catch(err) {
			this.error = err;
		}

		await this.makeScriptLogEntry();

		if ( ! this.error ) {
			this.pushStatus(`Done! Reloading...`);
			location.reload();
		}

		*/
	}

	/**
	 * @private
	 */
	deactivateBothButtons() {
		this.$(`#GARCloser-Keep`).prop('disabled', true);
		this.$(`#GARCloser-Delist`).prop('disabled', true);
	}

	/**
	 * @private
	 */
	async processKeepForGARPage() {
		this.pushStatus(`Place {{atop}} on GAR page`);
		let wikicode = await this.getWikicode(this.garPageTitle);
		wikicode = this.wg.processKeepForGARPage(wikicode);
		this.garPageRevisionID = await this.makeEdit(this.garPageTitle, this.editSummary, wikicode);
	}

	/**
	 * @private
	 */
	async processDelistForGARPage() {
		this.pushStatus(`Place {{atop}} on GAR page`);
		let wikicode = await this.getWikicode(this.garPageTitle);
		wikicode = this.wg.processDelistForGARPage(wikicode);
		this.garPageRevisionID = await this.makeEdit(this.garPageTitle, this.editSummary, wikicode);
	}

	/**
	 * @private
	 */
	async processKeepForTalkPage(talkPageTitle) {
		this.pushStatus(`Remove {{GAR/link}} from talk page, and update {{Article history}}`);
		let wikicode = await this.getWikicode(talkPageTitle);
		wikicode = this.wg.processKeepForTalkPage(wikicode, this.garPageTitle, talkPageTitle);
		this.talkRevisionID = await this.makeEdit(talkPageTitle, this.editSummary, wikicode);
	}

	/**
	 * @private
	 */
	isCommunityAssessment() {
		if ( this.garPageTitle.startsWith('Wikipedia:Good article reassessment/') ) {
			return true;
		}
		return false;
	}

	/**
	 * @private
	 */
	makeCommunityAssessmentLogEntry() {
		this.pushStatus(`Add entry to community assessment log`);
		// API query to figure out highest #'d archive subpage
		// wikicode = archiveSubpage
		// count headings.
		// if headings > ?
			// increment page title by 1
			// update Template:GARarchive
		// wikicode = wg.? (to append)
		// this.?ID = append to that page
	}

	/**
	 * @param {'keep'|'delist'} keepOrDelist
	 * @private
	 */
	async makeScriptLogEntry(keepOrDelist) {
		this.pushStatus(`Add entry to GARCloser debug log`);

		let username = this.mw.config.get('wgUserName');
		this.error = false;
		
		let wikicode = this.wg.makeScriptLogEntryToAppend(
			username,
			keepOrDelist,
			this.garPageTitle,
			this.garPageRevisionID,
			this.talkRevisionID,
			this.articleRevisionID,
			this.gaListRevisionID,
			this.garLogRevisionID,
			this.error
		);
		await this.appendToPage(this.scriptLogTitle, this.editSummary, wikicode);
	}

	/**
	 * @private
	 */
	processDelistForTalkPage() {
		this.pushStatus(`Remove {{GAR/link}} from talk page, update {{Article history}}, remove |class=GA`);
		// TODO:
	}

	/**
	 * @private
	 */
	processDelistForArticle() {
		this.pushStatus(`Remove {{Good article}} from article`);
		// TODO:
	}

	/**
	 * @private
	 */
	processDelistForGAList() {
		this.pushStatus(`Remove article from list of good articles`);
		// TODO:
	}

	/**
	 * This also checks if GARCloser should run at all. A falsey result means that the supplied title is not a GAR page.
	 * @private
	 */
	async confirmGARAndGetArticleName() {
		let parentArticle = ``;
		
		// CASE 1: INDIVIDUAL ==================================
		let namespace = this.mw.config.get('wgNamespaceNumber');
		let isTalkNamespace = ( namespace === 1 );
		let isGASubPage = this.isGASubPage(this.garPageTitle);
		let couldBeIndividualReassessment = isTalkNamespace && isGASubPage;

		if ( couldBeIndividualReassessment ) {
			parentArticle = this.getIndividualReassessmentParentArticle(this.garPageTitle);
			let parentArticleWikicode = await this.getWikicode(`Talk:${parentArticle}`);
			if ( parentArticleWikicode.match(/\{\{GAR\/link/i) ) {
				return parentArticle;
			}
		}

		// CASE 2: COMMUNITY ===================================
		let couldBeCommunityReassessment = this.garPageTitle.startsWith('Wikipedia:Good article reassessment/');
		if ( couldBeCommunityReassessment ) {
			parentArticle = this.getCommunityReassessmentParentArticle(this.garPageTitle);
			let parentArticleWikicode = await this.getWikicode(`Talk:${parentArticle}`);
			if ( parentArticleWikicode.match(/\{\{GAR\/link/i) ) {
				return parentArticle;
			}
		}
	}

	/**
	 * @private
	 */
	getIndividualReassessmentParentArticle(title) {
		return title.match(/Talk:(.*)\/GA/)[1];
	}

	/**
	 * @private
	 */
	getCommunityReassessmentParentArticle(title) {
		return title.match(/Wikipedia:Good article reassessment\/(.*)\/\d/)[1];
	}

	/**
	 * @private
	 */
	async getWikicode(title) {
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
	  * Lets you append without getting the Wikicode first. Saves an API query.
	  * @private
	  */
	async appendToPage(title, editSummary, wikicodeToAppend) {
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
		this.$(`#GARCloser-Status`).html(statusToAdd);
	}

	/**
	 * @private
	 */
	shouldRunOnThisPageQuickChecks() {
		// don't run when not viewing articles
		let action = this.mw.config.get('wgAction');
		if ( action != 'view' ) return false;
		
		// don't run when viewing diffs
		let isDiff = this.mw.config.get('wgDiffNewId');
		if ( isDiff ) return false;
		
		let isDeletedPage = ( ! this.mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) return false;

		// always run in Novem's sandbox
		if ( this.garPageTitle === 'User:Novem_Linguae/sandbox' ) return true;

		return true;
	}

	/**
	 * @private
	 */
	isGASubPage(title) {
		return Boolean(title.match(/\/GA\d{1,2}$/));
	}

	// /**
	//   * @private
	//   */
	// getGATitle(title) {
	// 	title = title.replace('Talk:', '');
	// 	title = title.replace(/_/g, ' ');
	// 	title = title.match(/^[^\/]*/)[0];
	// 	return title;
	// }

	// /**
	//   * @private
	//   */
	// getGATalkTitle(gaTitle) {
	// 	if ( gaTitle.includes(':') ) {
	// 		return gaTitle.replace(/^([^:]*)(:.*)$/gm, '$1 talk$2');
	// 	} else {
	// 		return 'Talk:' + gaTitle;
	// 	}
	// }
}