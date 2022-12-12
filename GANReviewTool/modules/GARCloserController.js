import { GARCloserHTMLGenerator } from "./GARCloserHTMLGenerator";
import { GARCloserWikicodeGenerator } from "./GARCloserWikicodeGenerator";

export class GARCloserController {
	/**
	 * @param {function} $ jQuery
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
		this.$('#mw-content-text').prepend(hg.getHTML())

		this.$(`#GARCloser-Keep`).on('click', async () => {
			await this.clickKeep();
		});

		this.$(`#GARCloser-Delist`).on('click', async () => {
			await this.clickDelist();
		});
	}

	/**
	 * @private
	 */
	async clickKeep() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		// TODO: {{subst:GAR/result|result=outcome}} ~~~~ ? Ask Femke. May need to check if user already did it. Would do for both keep and delist.

		try {
			this.editSummary = `close GAR [[${this.garPageTitle}]] as keep` + this.editSummarySuffix;
			this.deactivateBothButtons();
			await this.processKeepForGARPage();
			await this.processKeepForTalkPage();
			if ( this.isCommunityAssessment() ) {
				await this.makeCommunityAssessmentLogEntry();
			}
		} catch(err) {
			this.error = err;
			console.error(err);
		}

		await this.makeScriptLogEntry('keep');

		if ( ! this.error ) {
			this.pushStatus(`Done! Reloading...`);
			location.reload();
		} else {
			this.pushStatus(`<span class="GARCloserTool-ErrorNotice">An error occurred :(</span>`);
		}
	}

	/**
	 * @private
	 */
	async clickDelist() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		try {
			this.editSummary = `close GAR [[${this.garPageTitle}]] as delist` + this.editSummarySuffix;
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
			console.error(err);
		}

		await this.makeScriptLogEntry('delist');

		if ( ! this.error ) {
			this.pushStatus(`Done! Reloading...`);
			location.reload();
		} else {
			this.pushStatus(`<span class="GARCloserTool-ErrorNotice">An error occurred :(</span>`);
		}
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
	async hasGARLinkTemplate(title) {
		let wikicode = await this.getWikicode(title);
		return Boolean(wikicode.match(/\{\{GAR\/link/i));
	}

	/**
	 * @private
	 */
	async hasATOP(title) {
		let wikicode = await this.getWikicode(title);
		return Boolean(wikicode.match(/\{\{Atop/i));
		// TODO: don't match a small ATOP, must be ATOP of entire talk page
	}

	/**
	 * @private
	 */
	deactivateBothButtons() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.$(`#GARCloser-Keep`).prop('disabled', true);
		this.$(`#GARCloser-Delist`).prop('disabled', true);
	}

	/**
	 * @private
	 */
	async processKeepForGARPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Place {{atop}} on GAR page. Replace {{GAR/current}} if present.`);
		let wikicode = await this.getWikicode(this.garPageTitle);
		let message = this.$(`#GARCloser-Message`).val();
		wikicode = this.wg.processKeepForGARPage(wikicode, message, this.isCommunityAssessment());
		this.garPageRevisionID = await this.makeEdit(this.garPageTitle, this.editSummary, wikicode);
		if ( this.garPageRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	/**
	 * @private
	 */
	async processDelistForGARPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Place {{atop}} on GAR page`);
		let wikicode = await this.getWikicode(this.garPageTitle);
		let message = this.$(`#GARCloser-Message`).val();
		wikicode = this.wg.processDelistForGARPage(wikicode, message, this.isCommunityAssessment());
		this.garPageRevisionID = await this.makeEdit(this.garPageTitle, this.editSummary, wikicode);
		if ( this.garPageRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	/**
	 * @private
	 */
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

	/**
	 * @private
	 */
	isCommunityAssessment() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		if ( this.garPageTitle.startsWith('Wikipedia:Good article reassessment/') ) {
			return true;
		}
		return false;
	}

	/**
	 * @private
	 */
	async makeCommunityAssessmentLogEntry() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Add entry to community assessment log`);
		let archiveTitle = await this.getHighestNumberedPage("Wikipedia:Good article reassessment/Archive ");
		// TODO: handle no existing log pages at all
		let wikicode = await this.getWikicode(archiveTitle);
		let garTemplateCount = this.countGARTemplates(wikicode);
		let maximumNumberOfHeadingsAllowedInArchive = 82;
		let newArchive = false;
		if ( garTemplateCount >= maximumNumberOfHeadingsAllowedInArchive ) {
			archiveTitle = this.incrementArchiveTitle(archiveTitle);
			newArchive = true;
			wikicode = ``;
			this.incrementGARArchiveTemplate(archiveTitle);
		}
		let newWikicode = this.wg.makeCommunityAssessmentLogEntry(this.garPageTitle, wikicode, newArchive, archiveTitle);
		this.garLogRevisionID = await this.makeEdit(archiveTitle, this.editSummary, newWikicode)
		if ( this.garLogRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	/**
	 * @private
	 */
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
	 * @private
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
	 * @private
	 */
	countGARTemplates(wikicode) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		return this.countOccurrencesInString(/\{\{Wikipedia:Good article reassessment\//g, wikicode);
	}

	/**
	 * CC BY-SA 4.0, Lorenz Lo Sauer, https://stackoverflow.com/a/10671743/3480193
	 * @param {RegExp} needleRegEx Make sure to set the /g parameter.
	 * @private
	 */
	countOccurrencesInString(needleRegEx, haystack) {
		if ( arguments.length !== 2 ) throw new Error('Incorrect # of arguments');

		return (haystack.match(needleRegEx)||[]).length;
	}

	/**
	 * @param {'keep'|'delist'} keepOrDelist
	 * @private
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
			this.error
		);
		await this.appendToPage(this.scriptLogTitle, this.editSummary, wikicode);
	}

	/**
	 * @private
	 */
	async processDelistForTalkPage() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Remove {{GAR/link}} from talk page, update {{Article history}}, remove |class=GA`);
		let wikicode = await this.getWikicode(this.talkPageTitle);
		this.gaListTitle = this.getGAListTitleFromTalkPageWikicode(wikicode);
		let oldid = await this.getRevisionIDOfNewestRevision(this.parentArticle);
		wikicode = this.wg.processDelistForTalkPage(wikicode, this.garPageTitle, this.talkPageTitle, oldid);
		this.talkRevisionID = await this.makeEdit(this.talkPageTitle, this.editSummary, wikicode);
		if ( this.talkRevisionID === undefined ) {
			throw new Error('Generated wikicode and page wikicode were identical, resulting in a null edit.');
		}
	}

	/**
	 * @private
	 */
	getGAListTitleFromTalkPageWikicode(wikicode) {
		let dictionary = {
			'agriculture': 'Wikipedia:Good articles/Agriculture, food and drink',
			'agriculture, food, and drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			'cuisine': 'Wikipedia:Good articles/Agriculture, food and drink',
			'cuisines': 'Wikipedia:Good articles/Agriculture, food and drink',
			'cultivation': 'Wikipedia:Good articles/Agriculture, food and drink',
			'drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			'farming and cultivation': 'Wikipedia:Good articles/Agriculture, food and drink',
			'farming': 'Wikipedia:Good articles/Agriculture, food and drink',
			'food and drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			'food': 'Wikipedia:Good articles/Agriculture, food and drink',

			'art': 'Wikipedia:Good articles/Art and architecture',
			'architecture': 'Wikipedia:Good articles/Art and architecture',
			'art and architecture': 'Wikipedia:Good articles/Art and architecture',

			'engtech': 'Wikipedia:Good articles/Engineering and technology',
			'applied sciences and technology': 'Wikipedia:Good articles/Engineering and technology',
			'applied sciences': 'Wikipedia:Good articles/Engineering and technology',
			'computers': 'Wikipedia:Good articles/Engineering and technology',
			'computing and engineering': 'Wikipedia:Good articles/Engineering and technology',
			'computing': 'Wikipedia:Good articles/Engineering and technology',
			'eng': 'Wikipedia:Good articles/Engineering and technology',
			'engineering': 'Wikipedia:Good articles/Engineering and technology',
			'technology': 'Wikipedia:Good articles/Engineering and technology',
			'transport': 'Wikipedia:Good articles/Engineering and technology',

			'geography': 'Wikipedia:Good articles/Geography and places',
			'geography and places': 'Wikipedia:Good articles/Geography and places',
			'places': 'Wikipedia:Good articles/Geography and places',

			'history': 'Wikipedia:Good articles/History',
			'archaeology': 'Wikipedia:Good articles/History',
			'heraldry': 'Wikipedia:Good articles/History',
			'nobility': 'Wikipedia:Good articles/History',
			'royalty': 'Wikipedia:Good articles/History',
			'royalty, nobility and heraldry': 'Wikipedia:Good articles/History',
			'world history': 'Wikipedia:Good articles/History',

			'langlit': 'Wikipedia:Good articles/Language and literature',
			'language and literature': 'Wikipedia:Good articles/Language and literature',
			'languages and linguistics': 'Wikipedia:Good articles/Language and literature',
			'languages and literature': 'Wikipedia:Good articles/Language and literature',
			'languages': 'Wikipedia:Good articles/Language and literature',
			'linguistics': 'Wikipedia:Good articles/Language and literature',
			'lit': 'Wikipedia:Good articles/Language and literature',
			'literature': 'Wikipedia:Good articles/Language and literature',

			'math': 'Wikipedia:Good articles/Mathematics',
			'mathematics and mathematicians': 'Wikipedia:Good articles/Mathematics',
			'mathematics': 'Wikipedia:Good articles/Mathematics',
			'maths': 'Wikipedia:Good articles/Mathematics',

			'drama': 'Wikipedia:Good articles/Media and drama',
			'ballet': 'Wikipedia:Good articles/Media and drama',
			'dance': 'Wikipedia:Good articles/Media and drama',
			'film': 'Wikipedia:Good articles/Media and drama',
			'films': 'Wikipedia:Good articles/Media and drama',
			'media and drama': 'Wikipedia:Good articles/Media and drama',
			'media': 'Wikipedia:Good articles/Media and drama',
			'opera': 'Wikipedia:Good articles/Media and drama',
			'television': 'Wikipedia:Good articles/Media and drama',
			'theater': 'Wikipedia:Good articles/Media and drama',
			'theatre': 'Wikipedia:Good articles/Media and drama',
			'theatre, film and drama': 'Wikipedia:Good articles/Media and drama',

			'music': 'Wikipedia:Good articles/Music',
			'albums': 'Wikipedia:Good articles/Music',
			'classical compositions': 'Wikipedia:Good articles/Music',
			'other music articles': 'Wikipedia:Good articles/Music',
			'songs': 'Wikipedia:Good articles/Music',

			'natsci': 'Wikipedia:Good articles/Natural sciences',
			'astronomy': 'Wikipedia:Good articles/Natural sciences',
			'astrophysics': 'Wikipedia:Good articles/Natural sciences',
			'atmospheric science': 'Wikipedia:Good articles/Natural sciences',
			'biology and medicine': 'Wikipedia:Good articles/Natural sciences',
			'biology': 'Wikipedia:Good articles/Natural sciences',
			'chemistry and materials science': 'Wikipedia:Good articles/Natural sciences',
			'chemistry': 'Wikipedia:Good articles/Natural sciences',
			'cosmology': 'Wikipedia:Good articles/Natural sciences',
			'earth science': 'Wikipedia:Good articles/Natural sciences',
			'earth sciences': 'Wikipedia:Good articles/Natural sciences',
			'geology': 'Wikipedia:Good articles/Natural sciences',
			'geophysics': 'Wikipedia:Good articles/Natural sciences',
			'medicine': 'Wikipedia:Good articles/Natural sciences',
			'meteorology and atmospheric sciences': 'Wikipedia:Good articles/Natural sciences',
			'meteorology': 'Wikipedia:Good articles/Natural sciences',
			'mineralogy': 'Wikipedia:Good articles/Natural sciences',
			'natural science': 'Wikipedia:Good articles/Natural sciences',
			'natural sciences': 'Wikipedia:Good articles/Natural sciences',
			'physics and astronomy': 'Wikipedia:Good articles/Natural sciences',
			'physics': 'Wikipedia:Good articles/Natural sciences',

			'philrelig': 'Wikipedia:Good articles/Philosophy and religion',
			'mysticism': 'Wikipedia:Good articles/Philosophy and religion',
			'myth': 'Wikipedia:Good articles/Philosophy and religion',
			'mythology': 'Wikipedia:Good articles/Philosophy and religion',
			'phil': 'Wikipedia:Good articles/Philosophy and religion',
			'philosophy and religion': 'Wikipedia:Good articles/Philosophy and religion',
			'philosophy': 'Wikipedia:Good articles/Philosophy and religion',
			'relig': 'Wikipedia:Good articles/Philosophy and religion',
			'religion': 'Wikipedia:Good articles/Philosophy and religion',
			'religion, mysticism and mythology': 'Wikipedia:Good articles/Philosophy and religion',

			'socsci': 'Wikipedia:Good articles/Social sciences and society',
			'business and economics': 'Wikipedia:Good articles/Social sciences and society',
			'business': 'Wikipedia:Good articles/Social sciences and society',
			'culture and society': 'Wikipedia:Good articles/Social sciences and society',
			'culture': 'Wikipedia:Good articles/Social sciences and society',
			'culture, society and psychology': 'Wikipedia:Good articles/Social sciences and society',
			'economics and business': 'Wikipedia:Good articles/Social sciences and society',
			'economics': 'Wikipedia:Good articles/Social sciences and society',
			'education': 'Wikipedia:Good articles/Social sciences and society',
			'gov': 'Wikipedia:Good articles/Social sciences and society',
			'government': 'Wikipedia:Good articles/Social sciences and society',
			'journalism and media': 'Wikipedia:Good articles/Social sciences and society',
			'journalism': 'Wikipedia:Good articles/Social sciences and society',
			'law': 'Wikipedia:Good articles/Social sciences and society',
			'magazines and print journalism': 'Wikipedia:Good articles/Social sciences and society',
			'media and journalism': 'Wikipedia:Good articles/Social sciences and society',
			'politics and government': 'Wikipedia:Good articles/Social sciences and society',
			'politics': 'Wikipedia:Good articles/Social sciences and society',
			'psychology': 'Wikipedia:Good articles/Social sciences and society',
			'social science': 'Wikipedia:Good articles/Social sciences and society',
			'social sciences and society': 'Wikipedia:Good articles/Social sciences and society',
			'social sciences': 'Wikipedia:Good articles/Social sciences and society',
			'society': 'Wikipedia:Good articles/Social sciences and society',

			'sports': 'Wikipedia:Good articles/Sports and recreation',
			'everyday life': 'Wikipedia:Good articles/Sports and recreation',
			'everydaylife': 'Wikipedia:Good articles/Sports and recreation',
			'games': 'Wikipedia:Good articles/Sports and recreation',
			'recreation': 'Wikipedia:Good articles/Sports and recreation',
			'sport and recreation': 'Wikipedia:Good articles/Sports and recreation',
			'sport': 'Wikipedia:Good articles/Sports and recreation',
			'sports and recreation': 'Wikipedia:Good articles/Sports and recreation',

			'video games': 'Wikipedia:Good articles/Video games',
			'video and computer games': 'Wikipedia:Good articles/Video games',

			'war': 'Wikipedia:Good articles/Warfare',
			'aircraft': 'Wikipedia:Good articles/Warfare',
			'battles and exercises': 'Wikipedia:Good articles/Warfare',
			'battles': 'Wikipedia:Good articles/Warfare',
			'decorations and memorials': 'Wikipedia:Good articles/Warfare',
			'military': 'Wikipedia:Good articles/Warfare',
			'military people': 'Wikipedia:Good articles/Warfare',
			'units': 'Wikipedia:Good articles/Warfare',
			'war and military': 'Wikipedia:Good articles/Warfare',
			'warfare': 'Wikipedia:Good articles/Warfare',
			'warships': 'Wikipedia:Good articles/Warfare',
			'weapons and buildings': 'Wikipedia:Good articles/Warfare',
			'weapons': 'Wikipedia:Good articles/Warfare',
		}
		let topic = wikicode.match(/\|\s*(?:sub)?topic\s*=\s*([^\|\}\n]+)/i)[1];
		topic = topic.toLowerCase();
		return dictionary[topic];
	}

	/**
	 * @private
	 */
	async processDelistForArticle() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Remove {{Good article}} from article`);
		let wikicode = await this.getWikicode(this.parentArticle);
		wikicode = this.wg.processDelistForArticle(wikicode);
		this.articleRevisionID = await this.makeEdit(this.parentArticle, this.editSummary, wikicode);
		// If we can't remove {{Good article}}, don't throw an error like in the other code paths, just continue. There are cases where this is desirable. For example, maybe the GA got merged and redirected, so the {{Good article}} template itself is no longer present.
	}

	/**
	 * @private
	 */
	async processDelistForGAList() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		this.pushStatus(`Remove article from list of good articles`);
		let wikicode = await this.getWikicode(this.gaListTitle);
		wikicode = this.wg.processDelistForGAList(wikicode, this.parentArticle);
		this.gaListRevisionID = await this.makeEdit(this.gaListTitle, this.editSummary, wikicode);
		// Don't throw an error if we can't find the link to delete. Probably means it was already deleted.
	}

	/**
	 * This also checks if GARCloser should run at all. A falsey result means that the supplied title is not a GAR page.
	 * @private
	 */
	async confirmGARAndGetArticleName() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

		let parentArticle = ``;
		
		// CASE 1: INDIVIDUAL ==================================
		let namespace = this.mw.config.get('wgNamespaceNumber');
		let isTalkNamespace = ( namespace === 1 );
		let isGASubPage = this.isGASubPage(this.garPageTitle);

		let garPageWikicode = await this.getWikicode(this.garPageTitle);
		let hasGARCurrentTemplate = garPageWikicode.match(/\{\{GAR\/current\}\}/i);

		let couldBeIndividualReassessment = isTalkNamespace && isGASubPage && hasGARCurrentTemplate;

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
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		return title.match(/Talk:(.*)\/GA/)[1];
	}

	/**
	 * @private
	 */
	getCommunityReassessmentParentArticle(title) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		return title.match(/Wikipedia:Good article reassessment\/(.*)\/\d/)[1];
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

	/**
	  * @private
	  */
	pushStatus(statusToAdd) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		this.$(`#GARCloserTool-Status`).show();
		this.$(`#GARCloserTool-Status > p`).append('<br />' + statusToAdd);
	}

	/**
	 * @private
	 */
	shouldRunOnThisPageQuickChecks() {
		if ( arguments.length !== 0 ) throw new Error('Incorrect # of arguments');

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
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		return Boolean(title.match(/\/GA\d{1,2}$/));
	}
}