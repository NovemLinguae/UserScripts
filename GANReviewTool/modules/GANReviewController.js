import { GANReviewHTMLGenerator } from "./GANReviewHTMLGenerator";
import { GANReviewWikicodeGenerator } from "./GANReviewWikicodeGenerator";

export class GANReviewController {
	/**
	 * @param {Function} $ jQuery
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

		await this.displayForm();
		await this.listenForUncollapse();
		this.handleUserChangingFormType();

		this.$(`#GANReviewTool-Submit`).on('click', async () => {
			await this.clickSubmit();
		});
	}

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
			await this.writeToLog();
			this.pushStatus('Script complete. Refreshing page.');
			// TODO: 1 second delay?
			location.reload();
		} catch (err) {
			// Documentation for the http error is in the "response" section of https://doc.wikimedia.org/mediawiki-core/REL1_41/js/#!/api/mw.Api-method-ajax
			this.pushStatus(`<span class="GANReviewTool-ErrorNotice">An error occurred :( Details: ${err}</span>`);
			this.error = err;
			// this.editSummary += ' cc [[User:Novem Linguae]]';
			await this.writeToLog();
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

	async processOnHoldForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Marking article talk page status as "on hold"');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		talkWikicode = this.wg.getOnHoldWikicodeForTalkPage(talkWikicode);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	async processAskSecondOpinionForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Marking article talk page status as "asking for a second opinion"');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		talkWikicode = this.wg.getAskSecondOpinionWikicodeForTalkPage(talkWikicode);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	async processAnswerSecondOpinionForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Marking article talk page status as "answered second opinion request (onreview)"');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		talkWikicode = this.wg.getAnswerSecondOpinionWikicodeForTalkPage(talkWikicode);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	/**
	 * @return {boolean} hasFormValidationErrors
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

	async doFail() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.editSummary = `close [[${this.gaTitle}]] good article nomination as unsuccessful` + this.editSummarySuffix;

		if ( this.needsATOP ) {
			await this.processFailForGANPage();
		}
		await this.processFailForTalkPage();
	}

	async processFailForGANPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Placing {{atop}} and {{abot}} on GA review page.');
		let reviewWikicode = await this.getWikicode(this.ganReviewPageTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		reviewWikicode = this.wg.getFailWikicodeForGANPage(reviewWikicode);
		this.reviewRevisionID = await this.makeEdit(this.reviewTitle, this.editSummary, reviewWikicode);
	}

	async processFailForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Deleting {{GA nominee}} from article talk page.');
		this.pushStatus('Adding {{FailedGA}} or {{Article history}} to article talk page.');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		let oldid;
		try {
			oldid = await this.getRevisionIDOfNewestRevision(this.gaTitle);
		} catch (err) {
			throw new Error(`Unable to get main article's newest revision ID for placement in the |oldid= parameter of the talk page template. Is the main article created yet?`);
		}
		talkWikicode = this.wg.getFailWikicodeForTalkPage(talkWikicode, this.reviewTitle, oldid);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	async processPassForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Deleting {{GA nominee}} from article talk page.');
		this.pushStatus('Adding {{GA}} or {{Article history}} to article talk page.');
		this.pushStatus('Changing WikiProject template class parameters to GA on article talk page.');
		let talkWikicode = await this.getWikicode(this.gaTalkTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		let oldid;
		try {
			oldid = await this.getRevisionIDOfNewestRevision(this.gaTitle);
		} catch (err) {
			throw new Error(`Unable to get main article's newest revision ID for placement in the |oldid= parameter of the talk page template. Is the main article created yet?`);
		}
		talkWikicode = this.wg.getPassWikicodeForTalkPage(talkWikicode, this.reviewTitle, this.gaSubpageShortTitle, oldid);
		this.talkRevisionID = await this.makeEdit(this.gaTalkTitle, this.editSummary, talkWikicode);
	}

	async processPassForGASubPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Adding to appropriate subpage of [[WP:GA]]');
		let gaSubpageLongTitle = `Wikipedia:Good articles/` + this.gaSubpageShortTitle;
		let gaDisplayTitle = this.$(`[name="GANReviewTool-DisplayWikicode"]`).val();

		let gaSubpageWikicode;
		try {
			gaSubpageWikicode = await this.getWikicode(gaSubpageLongTitle);
		} catch (err) {
			throw new Error('Error getting GA subpage wikicode. Is this GA subpage created yet?');
		}

		gaSubpageWikicode = this.wg.getPassWikicodeForGAListPage(this.detailedTopic, gaSubpageWikicode, this.gaTitle, gaDisplayTitle);
		let gaSubPageEditSummary = this.getGASubPageEditSummary(this.editSummary, this.detailedTopic);
		this.gaRevisionID = await this.makeEdit(gaSubpageLongTitle, gaSubPageEditSummary, gaSubpageWikicode);
	}

	async processPassForGANPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus('Placing {{atop}} and {{abot}} on GA review page.');
		let reviewWikicode = await this.getWikicode(this.ganReviewPageTitle); // get this wikicode again, in case it changed between page load and "submit" button click
		reviewWikicode = this.wg.getPassWikicodeForGANPage(reviewWikicode);
		this.reviewRevisionID = await this.makeEdit(this.reviewTitle, this.editSummary, reviewWikicode);
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
		let revisionID = result['query']['pages'][0]['revisions'][0]['revid'];
		return revisionID;
	}
	
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

	async listenForUncollapse() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.$('#GANReviewTool-Uncollapse').on('click', () => {
			this.$('.GANReviewTool-Collapsed').hide();
			this.$('#GANReviewTool-MainForm').show();
		});
	}

	async displayForm() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		// split this query in two, to avoid the 12MB limit
		let obj1 = await this.getWikicodeForMultiplePages([
			'Wikipedia:Good articles/Agriculture, food and drink',
			'Wikipedia:Good articles/Art and architecture',
			'Wikipedia:Good articles/Engineering and technology',
			'Wikipedia:Good articles/Geography and places',
			'Wikipedia:Good articles/History',
			'Wikipedia:Good articles/Language and literature',
			'Wikipedia:Good articles/Mathematics',
		]);

		let obj2 = await this.getWikicodeForMultiplePages([
			'Wikipedia:Good articles/Media and drama',
			'Wikipedia:Good articles/Music',
			'Wikipedia:Good articles/Natural sciences',
			'Wikipedia:Good articles/Philosophy and religion',
			'Wikipedia:Good articles/Social sciences and society',
			'Wikipedia:Good articles/Sports and recreation',
			'Wikipedia:Good articles/Video games',
			'Wikipedia:Good articles/Warfare',
		]);

		let wikicodeOfGASubPages = {...obj1, ...obj2};

		let html = this.hg.getHTML(this.gaTitle, wikicodeOfGASubPages);
		this.$('#mw-content-text').prepend(html);
	}

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
		if ( ! talkWikicode.match(/\{\{GA nominee/i) ) {
			return false;
		}

		return true;
	}
	
	async writeToLog() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		// always log no matter what. hopefully log some errors so I can fix them
		this.pushStatus('Adding to log');
		let username = this.mw.config.get('wgUserName');
		let textToAppend = this.wg.getLogMessageToAppend(username, this.action, this.reviewTitle, this.reviewRevisionID, this.talkRevisionID, this.gaRevisionID, this.error);
		await this.appendToPage('User:Novem Linguae/Scripts/GANReviewTool/GANReviewLog', this.editSummary, textToAppend);
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
		if ( result['error'] ) return '';
		let wikicode = result['parse']['wikitext']['*'];
		return wikicode;
	}

	/**
	  * @param {Array} listOfTitles
	  * @return {Promise<Object>} {'Page title': 'Page wikicode', 'Page title2': 'Page wikicode2'} Maximum 12MB of result wikicode. Will cut off after that.
	  */
	async getWikicodeForMultiplePages(listOfTitles) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		let api = new this.mw.Api();
		let params = {
			"action": "query",
			"format": "json",
			"prop": "revisions",
			"titles": listOfTitles.join('|'),
			"formatversion": "2",
			"rvprop": "content"
		};
		let result = await api.post(params);
		if ( result['error'] ) return '';
		let simplified = this.simplifyQueryRevisionsObject(result);

		return simplified;
	}

	/**
	  * convert from the complex format returned by API action=query&prop=revisions, to
	  * {'Page title': 'Page wikicode', 'Page title2': 'Page wikicode2'}
	  */
	simplifyQueryRevisionsObject(queryRevisionsObject) {
		let pages = queryRevisionsObject['query']['pages'];
		let newFormat = {};
		for ( let page of pages ) {
			if ( page['missing'] ) continue; // on testwiki, these pages may not be created yet. just skip em
			let key = page['title'];
			let value = page['revisions'][0]['content'];
			newFormat[key] = value;
		}
		newFormat = this.alphabetizeObjectByKeys(newFormat);
		return newFormat;
	}

	/**
	  * Mathias Bynens, CC BY-SA 4.0, https://stackoverflow.com/a/31102605/3480193
	  */
	alphabetizeObjectByKeys(unordered) {
		return Object.keys(unordered).sort().reduce(
			(obj, key) => { 
				obj[key] = unordered[key]; 
				return obj;
			}, 
			{}
		);
	}

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
	 * Lets you append without getting the Wikicode first. Saves an API query.
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

	pushStatus(statusToAdd) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		this.$(`#GANReviewTool-ProcessingMessage > p`).append('<br />' + statusToAdd);
	}

	shouldRunOnThisPageQuickChecks(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		// don't run when not viewing articles
		let action = this.mw.config.get('wgAction');
		if ( action !== 'view' ) return false;

		// don't run when viewing diffs
		let isDiff = this.mw.config.get('wgDiffNewId');
		if ( isDiff ) return false;

		let isDeletedPage = ( ! this.mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) return false;

		// only run in talk namespace
		let namespace = this.mw.config.get('wgNamespaceNumber');
		let isTalkNamespace = ( namespace === 1 );
		if ( ! isTalkNamespace ) return false;

		// only run on pages that end in /GA##
		if ( ! this.isGASubPage(title) ) return false;

		return true;
	}

	isGASubPage(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');
		return Boolean(title.match(/\/GA\d{1,2}$/));
	}

	getGATitle(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');
		title = title.replace('Talk:', '');
		title = title.replace(/_/g, ' ');
		title = title.replace(/\/[^\/]+$/, ''); // chop off /GA1 from the end of title
		return title;
	}

	getGATalkTitle(gaTitle) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');
		return 'Talk:' + gaTitle;
	}

	/**
	 * @param {string} detailedTopic The heading name, with leading and trailing === to denote it as a heading
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