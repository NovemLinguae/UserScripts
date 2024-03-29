import { GARCloserHTMLGenerator } from "./GARCloserHTMLGenerator";
import { GARCloserWikicodeGenerator } from "./GARCloserWikicodeGenerator";

export class GARCloserController {
	/**
	 * @param {Function} $ jQuery
	 * @param {mw} mw mediawiki, https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw
	 * @param {Location} location https://developer.mozilla.org/en-US/docs/Web/API/Window/location
	 * @param {GARCloserWikicodeGenerator} wg
	 * @param {GARCloserHTMLGenerator} hg
	 */
	async execute($, mw, location, wg, hg) {
		if ( arguments.length !== 5 ) throw new Error('Incorrect # of arguments');

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
		this.talkPageTitle = `Talk:${this.parentArticle}`;

		let hasGARLinkTemplate = await this.hasGARLinkTemplate(this.talkPageTitle);
		let hasATOP = await this.hasATOP(this.garPageTitle);
		if ( ! hasGARLinkTemplate || hasATOP ) {
			return;
		}

		// place HTML on page
		this.$('#mw-content-text').prepend(hg.getHTML());

		this.$(`#GARCloser-Keep`).on('click', async () => {
			await this.clickKeep();
		});

		this.$(`#GARCloser-Delist`).on('click', async () => {
			await this.clickDelist();
		});
	}

	async clickKeep() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		// TODO: {{subst:GAR/result|result=outcome}} ~~~~ ? Ask Femke. May need to check if user already did it. Would do for both keep and delist.

		try {
			this.editSummary = `close GAR [[${this.garPageTitle}]] as keep` + this.editSummarySuffix;
			this.deactivateBothButtons();
			this.message = this.$(`#GARCloser-Message`).val();
			await this.processKeepForGARPage();
			await this.processKeepForTalkPage();
			if ( this.isCommunityAssessment() ) {
				await this.makeCommunityAssessmentLogEntry();
				await this.makeSureCategoryPageHasWikitext();
			}
			await this.makeScriptLogEntry('keep');
			this.pushStatus(`Done! Reloading...`);
			location.reload();
		} catch (err) {
			this.error = err;
			console.error(err);
			// this.editSummary += ' cc [[User:Novem Linguae]]';
			await this.makeScriptLogEntry('keep');
			this.pushStatus(`<span class="GARCloserTool-ErrorNotice">An error occurred :( Details: ${this.error}</span>`);
		}
	}

	async clickDelist() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		try {
			this.editSummary = `close GAR [[${this.garPageTitle}]] as delist` + this.editSummarySuffix;
			if ( ! this.apiMode ) {
				this.deactivateBothButtons();
				this.message = this.$(`#GARCloser-Message`).val();
			}
			await this.processDelistForGARPage();
			await this.processDelistForTalkPage();
			await this.processDelistForArticle();
			await this.processDelistForGAList();
			if ( this.isCommunityAssessment() ) {
				await this.makeCommunityAssessmentLogEntry();
				await this.makeSureCategoryPageHasWikitext();
			}
			await this.makeScriptLogEntry('delist');
			if ( ! this.apiMode ) {
				this.pushStatus(`Done! Reloading...`);
				location.reload();
			}
		} catch (err) {
			this.error = err;
			console.error(err);
			this.editSummary += ' cc [[User:Novem Linguae]]';
			await this.makeScriptLogEntry('delist');
			this.pushStatus(`<span class="GARCloserTool-ErrorNotice">An error occurred :( Details: ${this.error}</span>`);
		}

		if ( this.apiMode && this.error ) {
			throw new Error(this.error);
		}
	}

	/**
	  * Used by MassGARController. Does the same thing as this.clickDelist(), but with JQuery calls fixed to target MassGARController, no refresh of the page at the end of the task, 10 second edit delay for API etiquette reasons, and re-throwing any caught errors.
	  */
	async delistAPI(reassessmentPageTitle, editSummarySuffix, editThrottleInSeconds, message, $, mw, wg) {
		this.apiMode = true;
		this.editThrottleInSeconds = editThrottleInSeconds;
		this.editSummarySuffix = ` - ${editSummarySuffix}`;
		this.garPageTitle = reassessmentPageTitle;
		this.message = message;
		this.$ = $;
		this.mw = mw;
		this.wg = wg;

		this.parentArticle = this.getIndividualReassessmentParentArticle(this.garPageTitle);
		this.talkPageTitle = `Talk:${this.parentArticle}`;
		this.scriptLogTitle = `User:Novem Linguae/Scripts/GANReviewTool/GARLog`;

		await this.clickDelist();
	}

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
		if ( result['query']['pages'][0]['missing'] ) {
			throw new Error(`getRevisionIDOfNewestRevision: Page appears to have zero revisions`);
		}
		let revisionID = result['query']['pages'][0]['revisions'][0]['revid'];
		return revisionID;
	}

	async hasGARLinkTemplate(title) {
		let wikicode = await this.getWikicode(title);
		return Boolean(wikicode.match(/\{\{GAR\/link/i));
	}

	async hasATOP(title) {
		let wikicode = await this.getWikicode(title);
		return Boolean(wikicode.match(/\{\{Atop/i));
		// TODO: don't match a small ATOP, must be ATOP of entire talk page
	}

	deactivateBothButtons() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.$(`#GARCloser-Keep`).prop('disabled', true);
		this.$(`#GARCloser-Delist`).prop('disabled', true);
	}

	async processKeepForGARPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Place {{atop}} on GAR page. Replace {{GAR/current}} if present.`);
		let wikicode = await this.getWikicode(this.garPageTitle);
		wikicode = this.wg.processKeepForGARPage(wikicode, this.message, this.isCommunityAssessment());
		this.garPageRevisionID = await this.makeEdit(this.garPageTitle, this.editSummary, wikicode);
		if ( this.garPageRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	async processDelistForGARPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Place {{atop}} on GAR page`);
		let wikicode = await this.getWikicode(this.garPageTitle);
		wikicode = this.wg.processDelistForGARPage(wikicode, this.message, this.isCommunityAssessment());
		this.garPageRevisionID = await this.makeEdit(this.garPageTitle, this.editSummary, wikicode);
		if ( this.garPageRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	async processKeepForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Remove {{GAR/link}} from talk page, and update {{Article history}}`);
		let wikicode = await this.getWikicode(this.talkPageTitle);
		let oldid = await this.getRevisionIDOfNewestRevision(this.parentArticle);
		wikicode = this.wg.processKeepForTalkPage(wikicode, this.garPageTitle, this.talkPageTitle, oldid);
		this.talkRevisionID = await this.makeEdit(this.talkPageTitle, this.editSummary, wikicode);
		if ( this.talkRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	isCommunityAssessment() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		if ( this.garPageTitle.startsWith('Wikipedia:Good article reassessment/') ) {
			return true;
		}
		return false;
	}

	async makeCommunityAssessmentLogEntry() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Add entry to community assessment log`);

		// figure out newest GAR community assessment log (the "archive")
		this.archiveTitle = await this.getHighestNumberedPage("Wikipedia:Good article reassessment/Archive ");
		// TODO: handle no existing log pages at all

		// count # of entries in newest GAR community assessment log (the "archive")
		let archiveOldWikicode = await this.getWikicode(this.archiveTitle);
		let garTemplateCount = this.countGARTemplates(archiveOldWikicode);

		// do we need to start a new archive page?
		let maximumNumberOfHeadingsAllowedInArchive = 82;
		let isNewArchive = false;
		if ( garTemplateCount >= maximumNumberOfHeadingsAllowedInArchive ) {
			this.archiveTitle = this.incrementArchiveTitle(this.archiveTitle);
			isNewArchive = true;
			archiveOldWikicode = ``;
			await this.incrementGARArchiveTemplate(this.archiveTitle);
		}

		// add log entry
		let archiveNewWikicode = this.wg.makeCommunityAssessmentLogEntry(
			this.garPageTitle,
			archiveOldWikicode,
			isNewArchive,
			this.archiveTitle
		);
		this.garLogRevisionID = await this.makeEdit(this.archiveTitle, this.editSummary, archiveNewWikicode);
		if ( this.garLogRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	async makeSureCategoryPageHasWikitext() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		// use this.archiveTitle to figure out our current GAR archive #
		let archiveNumber = this.archiveTitle.match(/\d+$/);

		// read the wikicode for Category:GAR/#
		let categoryTitle = `Category:GAR/${archiveNumber}`;
		let categoryWikicode = await this.getWikicodeAndDoNotThrowError(categoryTitle);

		// if the category has no wikitext, add some boilerplate wikitext, so the category isn't a red link
		if ( ! categoryWikicode ) {
			let newWikicode =
`{{Wikipedia category}}

[[Category:Wikipedia good article reassessment]]
`;
			this.categoryRevisionID = await this.makeEdit(categoryTitle, this.editSummary, newWikicode);
		}
	}

	async incrementGARArchiveTemplate(archiveTitle) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Update count at Template:GARarchive`);
		let wikicode = await this.getWikicode('Template:GARarchive');
		let newTemplateWikicode = this.wg.setGARArchiveTemplate(archiveTitle, wikicode);
		this.garArchiveTemplateRevisionID = await this.makeEdit('Template:GARarchive', this.editSummary, newTemplateWikicode);
		if ( this.garArchiveTemplateRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	/**
	 * Takes a Wikipedia page name with a number on the end, and returns that page name with the number on the end incremented by one. Example: "Wikipedia:Good article reassessment/Archive 67" -> "Wikipedia:Good article reassessment/Archive 68"
	 */
	incrementArchiveTitle(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		let number = title.match(/\d{1,}$/);
		number++;
		let titleWithNoNumber = title.replace(/\d{1,}$/, '');
		return titleWithNoNumber + number.toString();
	}

	/**
	 * Counts number of times "{{Wikipedia:Good article reassessment/" occurs in wikicode.
	 */
	countGARTemplates(wikicode) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		return this.countOccurrencesInString(/\{\{Wikipedia:Good article reassessment\//g, wikicode);
	}

	/**
	 * CC BY-SA 4.0, Lorenz Lo Sauer, https://stackoverflow.com/a/10671743/3480193
	 * @param {RegExp} needleRegEx Make sure to set the /g parameter.
	 */
	countOccurrencesInString(needleRegEx, haystack) {
		if ( arguments.length !== 2 ) throw new Error('Incorrect # of arguments');

		return (haystack.match(needleRegEx)||[]).length;
	}

	/**
	 * @param {'keep'|'delist'} keepOrDelist
	 */
	async makeScriptLogEntry(keepOrDelist) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Add entry to GARCloser debug log`);
		let username = this.mw.config.get('wgUserName');
		let wikicode = this.wg.makeScriptLogEntryToAppend(
			username,
			keepOrDelist,
			this.garPageTitle,
			this.garPageRevisionID,
			this.talkRevisionID,
			this.articleRevisionID,
			this.gaListRevisionID,
			this.garLogRevisionID,
			this.garArchiveTemplateRevisionID,
			this.error,
			this.categoryRevisionID
		);
		await this.appendToPage(this.scriptLogTitle, this.editSummary, wikicode);
	}

	async processDelistForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Remove {{GAR/link}} from talk page, update {{Article history}}, remove |class=GA`);
		let wikicode = await this.getWikicode(this.talkPageTitle);

		// while we have the talk page wikicode, go ahead and figure out the gaListTitle. saves an API query later.
		// this will come back blank if the topic isn't in the dictionary. throw an error later, so that writing the talk page doesn't get interrupted
		this.gaListTitle = this.wg.getGAListTitleFromTalkPageWikicode(wikicode);

		let oldid = await this.getRevisionIDOfNewestRevision(this.parentArticle);
		wikicode = this.wg.processDelistForTalkPage(wikicode, this.garPageTitle, this.talkPageTitle, oldid);
		this.talkRevisionID = await this.makeEdit(this.talkPageTitle, this.editSummary, wikicode);
		if ( this.talkRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	async processDelistForArticle() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Remove {{Good article}} from article`);
		let wikicode = await this.getWikicode(this.parentArticle);
		wikicode = this.wg.processDelistForArticle(wikicode);
		this.articleRevisionID = await this.makeEdit(this.parentArticle, this.editSummary, wikicode);
		// If we can't remove {{Good article}}, don't throw an error like in the other code paths, just continue. There are cases where this is desirable. For example, maybe the GA got merged and redirected, so the {{Good article}} template itself is no longer present.
	}

	async processDelistForGAList() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Remove article from list of good articles`);

		if ( ! this.gaListTitle ) {
			throw new Error(`Unable to determine WP:GA subpage. Is the |topic= on the article's talk page correct?`);
		}

		let wikicode = await this.getWikicode(this.gaListTitle);
		wikicode = this.wg.processDelistForGAList(wikicode, this.parentArticle);
		this.gaListRevisionID = await this.makeEdit(this.gaListTitle, this.editSummary, wikicode);
		// Don't throw an error if we can't find the link to delete. Probably means it was already deleted.
	}

	/**
	 * This also checks if GARCloser should run at all. A falsey result means that the supplied title is not a GAR page.
	 */
	async confirmGARAndGetArticleName() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		let parentArticle = ``;
		
		// CASE 1: INDIVIDUAL ==================================
		// Example: Talk:Cambodia women's national football team/GA3

		let namespace = this.mw.config.get('wgNamespaceNumber');
		let isTalkNamespace = ( namespace === 1 );

		let isGASubPage = this.isGASubPage(this.garPageTitle);

		// Check this so that we don't accidentally run on GAN subpages, which use the same title formatting
		let garPageWikicode = await this.getWikicode(this.garPageTitle);
		let hasGAReassessmentHeading = garPageWikicode.match(/==GA Reassessment==/i);

		let couldBeIndividualReassessment = isTalkNamespace && isGASubPage && hasGAReassessmentHeading;

		if ( couldBeIndividualReassessment ) {
			parentArticle = this.getIndividualReassessmentParentArticle(this.garPageTitle);
			let parentArticleWikicode = await this.getWikicode(`Talk:${parentArticle}`);
			if ( parentArticleWikicode.match(/\{\{GAR\/link/i) ) {
				return parentArticle;
			}
		}

		// CASE 2: COMMUNITY ===================================
		// Example: Wikipedia:Good article reassessment/Cambodia women's national football team/2

		let couldBeCommunityReassessment = this.garPageTitle.startsWith('Wikipedia:Good article reassessment/');
		if ( couldBeCommunityReassessment ) {
			parentArticle = this.getCommunityReassessmentParentArticle(this.garPageTitle);
			let parentArticleWikicode = await this.getWikicode(`Talk:${parentArticle}`);
			if ( parentArticleWikicode.match(/\{\{GAR\/link/i) ) {
				return parentArticle;
			}
		}
	}

	getIndividualReassessmentParentArticle(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		return title.match(/Talk:(.*)\/GA/)[1];
	}

	getCommunityReassessmentParentArticle(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		return title.match(/Wikipedia:Good article reassessment\/(.*)\/\d/)[1];
	}

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
		let wikicode = result['parse']['wikitext']['*'];
		return wikicode;
	}

	async getWikicodeAndDoNotThrowError(title) {
		try {
			return await this.getWikicode(title);
		} catch (err) {
			// Catch error and do nothing
		}

		return '';
	}

	async makeEdit(title, editSummary, wikicode) {
		if ( arguments.length !== 3 ) throw new Error('Incorrect # of arguments');

		if ( this.apiMode ) {
			// API etiquette. 10 second delay between edits.
			await this.delay(this.editThrottleInSeconds);
		}

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
		if ( arguments.length !== 3 ) throw new Error('Incorrect # of arguments');

		if ( this.apiMode ) {
			// API etiquette. 10 second delay between edits.
			await this.delay(this.editThrottleInSeconds);
		}

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
	  * Example: To get the latest archive of "Wikipedia:Good article reassessment/Archive ", use getHighestNumberedPage("Wikipedia:Good article reassessment/Archive "), which will return "Wikipedia:Good article reassessment/Archive 67"
	  * @private
	  */
	async getHighestNumberedPage(prefix) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		let t = new this.mw.Title(prefix); // https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw.Title
		let prefixNoNamespace = t.getMainText();
		let namespaceNumber = t.getNamespaceId();
		let api = new this.mw.Api();
		let params ={
			"action": "query",
			"format": "json",
			"list": "allpages",
			"apprefix": prefixNoNamespace,
			"apnamespace": namespaceNumber,
			"aplimit": "1",
			"apdir": "descending"
		};
		let result = await api.post(params);
		let title = result['query']['allpages'][0]['title'];
		return title;
	}

	pushStatus(statusToAdd) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		if ( this.apiMode ) {
			this.$(`#MassGARTool-Status`).show();
			this.$(`#MassGARTool-Status > p`).append(`<br>${this.parentArticle}: ${statusToAdd}`);
		} else {
			this.$(`#GARCloserTool-Status`).show();
			this.$(`#GARCloserTool-Status > p`).append(`<br>${statusToAdd}`);
		}
	}

	shouldRunOnThisPageQuickChecks() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		// don't run when not viewing articles
		let action = this.mw.config.get('wgAction');
		if ( action !== 'view' ) return false;
		
		// don't run when viewing diffs
		let isDiff = this.mw.config.get('wgDiffNewId');
		if ( isDiff ) return false;
		
		let isDeletedPage = ( ! this.mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) return false;

		// always run in Novem's sandbox
		if ( this.garPageTitle === 'User:Novem_Linguae/sandbox' ) return true;

		return true;
	}

	isGASubPage(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		return Boolean(title.match(/\/GA\d{1,2}$/));
	}

	async delay(seconds) {
		let milliseconds = seconds * 1000;
		return new Promise(function (res) {
			setTimeout(res, milliseconds);
		});
	}
}