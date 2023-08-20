// <nowiki>

class UserHighlighterSimple {
	// data
	/** @type {Object} */
	wmf;
	/** @type {Object} */
	stewards;
	/** @type {Object} */
	arbcom;
	/** @type {Object} */
	bureaucrats;
	/** @type {Object} */
	admins;
	/** @type {Object} */
	formeradmins;
	/** @type {Object} */
	newPageReviewers;
	/** @type {Object} */
	tenThousandEdits;
	/** @type {Object} */
	extendedConfirmed;

	// other variables
	/** @type {JQuery} */
	$link;
	/** @type {string} */
	user;
	/** @type {mw.Title} */
	titleHelper;
	/** @type {boolean} */
	hasAdvancedPermissions;
	/** @type {Object} */
	$;
	/** @type {Object} */
	mw;

	/**
	 * @param {Object} $ jquery
	 * @param {Object} mw mediawiki
	 */
	constructor($, mw) {
		this.$ = $;
		this.mw = mw;
	}

	async execute() {
		await this.getUsernames();
		this.setHighlightColors();
		let that = this;
		this.$('#article a, #bodyContent a, #mw_contentholder a').each(function(index, element) {
			that.$link = that.$(element);
			if ( ! that.linksToAUser() ) {
				return;
			}
			that.user = that.getUserName();
			let isUserSubpage = that.user.includes('/');
			if ( isUserSubpage ) {
				return;
			}
			that.hasAdvancedPermissions = false;
			that.addClassesAndHoverTextToLinkIfNeeded();
			// If the user has any advanced perms, they are likely to have a signature, so be aggressive about overriding the background and foreground color. That way there's no risk their signature is unreadable due to background color and foreground color being too similar. Don't do this for users without advanced perms... being able to see a redlinked username is useful.
			if ( that.hasAdvancedPermissions ) {
				that.$link.addClass(that.$link.attr('class') + ' UHS-override-signature-colors');
			}
		});
	}

	addCSS(htmlClass, cssDeclaration) {
		// .plainlinks is for Wikipedia Signpost articles
		// To support additional custom signature edge cases, add to the selectors here.
		this.mw.util.addCSS(`
			.plainlinks .${htmlClass}.external,
			.${htmlClass},
			.${htmlClass} b,
			.${htmlClass} big,
			.${htmlClass} font,
			.${htmlClass} span {
				${cssDeclaration}
			}
		`);
	}

	async getWikitextFromCache(title) {
		var api = new this.mw.ForeignApi('https://en.wikipedia.org/w/api.php');
		var wikitext = '';
		await api.get( {
			action: 'query',
			prop: 'revisions',
			titles: title,
			rvslots: '*',
			rvprop: 'content',
			formatversion: '2',
			uselang: 'content', // needed for caching
			smaxage: '86400', // cache for 1 day
			maxage: '86400' // cache for 1 day
		} ).then( function ( data ) {
			wikitext = data.query.pages[0].revisions[0].slots.main.content;
		} );
		return wikitext;
	}

	async getUsernames() {
		let dataString = await this.getWikitextFromCache('User:NovemBot/userlist.js');
		let dataJSON = JSON.parse(dataString);

		this.wmf = {
			...dataJSON['founder'],
			...dataJSON['boardOfTrustees'],
			...dataJSON['staff'],
			// WMF is hard-coded a bit further down. The script detects those strings in the username. This is safe to do because the WMF string is blacklisted from names, so has to be specially created.
			// ...dataJSON['sysadmin'],
			// ...dataJSON['global-interface-editor'],
			// ...dataJSON['wmf-supportsafety'],
			// ...dataJSON['mediawikiPlusTwo'],
			// ...dataJSON['global-sysop'],
		};
		this.stewards = dataJSON['steward'];
		this.arbcom = dataJSON['arbcom'];
		this.bureaucrats = dataJSON['bureaucrat'];
		this.admins = dataJSON['sysop'];
		this.formeradmins = dataJSON['formeradmin'];
		this.newPageReviewers = dataJSON['patroller'];
		this.tenThousandEdits = dataJSON['10k'];
		this.extendedConfirmed = {
			...dataJSON['extendedconfirmed'],
			...dataJSON['bot'],
			...dataJSON['productiveIPs'],
		};
	}

	hasHREF(url) {
		return Boolean(url);
	}

	isAnchor(url) {
		return url.charAt(0) === '#';
	}

	isHTTPorHTTPS(url) {
		return url.startsWith("http://", 0) ||
			url.startsWith("https://", 0) ||
			url.startsWith("/", 0);
	}

	/**
	  * Figure out the wikipedia article title of the link
	  * @param {string} url
	  * @param {mw.Uri} urlHelper
	  * @return {String}
	  */
	getTitle(url, urlHelper) {
		// for links in the format /w/index.php?title=Blah
		let titleParameterOfURL = this.mw.util.getParamValue('title', url);
		if ( titleParameterOfURL ) {
			return titleParameterOfURL;
		}

		// for links in the format /wiki/PageName. Slice off the /wiki/ (first 6 characters)
		if ( urlHelper.path.startsWith('/wiki/') ) {
			return decodeURIComponent(urlHelper.path.slice(6));
		}

		return '';
	}

	notInUserOrUserTalkNamespace() {
		let namespace = this.titleHelper.getNamespaceId();
		let notInSpecialUserOrUserTalkNamespace = this.$.inArray(namespace, [2, 3]) === -1;
		return notInSpecialUserOrUserTalkNamespace;
	}

	linksToAUser() {
		let url = this.$link.attr('href');
		
		if ( ! this.hasHREF(url) || this.isAnchor(url) || ! this.isHTTPorHTTPS(url) ) {
			return false;
		}

		url = this.addDomainIfMissing(url);

		// mw.Uri(url) throws an error if it doesn't like the URL. An example of a URL it doesn't like is https://meta.wikimedia.org/wiki/Community_Wishlist_Survey_2022/Larger_suggestions#1%, which has a section link to a section titled 1% (one percent).
		var urlHelper;
		try {
			urlHelper = new this.mw.Uri(url);
		} catch {
			return false;
		}
		
		// Skip links that aren't to user pages
		let isUserPageLink = url.includes('/w/index.php?title=User') || url.includes('/wiki/User');
		if ( ! isUserPageLink ) {
			return false;
		}

		// Even if it is a link to a userpage, skip URLs that have any parameters except title=User, action=edit, and redlink=. We don't want links to diff pages, section editing pages, etc. to be highlighted.
		let urlParameters = urlHelper.query;
		delete urlParameters['title'];
		delete urlParameters['action'];
		delete urlParameters['redlink'];
		let hasNonUserpageParametersInUrl = ! this.$.isEmptyObject(urlParameters);
		if ( hasNonUserpageParametersInUrl ) {
			return false;
		}

		let title = this.getTitle(url, urlHelper);
		this.titleHelper = new this.mw.Title(title);
		
		if ( this.notInUserOrUserTalkNamespace() ) {
			return false;
		}

		return true;
	}

	// Brandon Frohbieter, CC BY-SA 4.0, https://stackoverflow.com/a/4009771/3480193
	countInstances(string, word) {
		return string.split(word).length - 1;
	}

	/**
	 * mw.Uri(url) expects a complete URL. If we get something like /wiki/User:Test, convert it to https://en.wikipedia.org/wiki/User:Test. Without this, UserHighlighterSimple doesn't work on metawiki.
	 */
	addDomainIfMissing(url) {
		if ( url.startsWith('/') ) {
			url = window.location.origin + url;
		}
		return url;
	}

	/**
	 * @return {string}
	 */
	getUserName() {
		var user = this.titleHelper.getMain().replace(/_/g, ' ');
		return user;
	}

	checkForPermission(listOfUsernames, className, descriptionForHover) {
		if ( listOfUsernames[this.user] === 1 ) {
			this.addClassAndHoverText(className, descriptionForHover);
		}
	}

	addClassAndHoverText(className, descriptionForHover) {
		this.$link.addClass(className);

		let title = this.$link.attr("title");
		if ( ! title || title.startsWith("User:") ) {
			this.$link.attr("title", descriptionForHover);
		}

		this.hasAdvancedPermissions = true;
	}

	addClassesAndHoverTextToLinkIfNeeded() {
		// highlight anybody with "WMF" in their name, case insensitive. this should not generate false positives because "WMF" is on the username blacklist. see https://meta.wikimedia.org/wiki/Title_blacklist
		if ( this.user.match(/^[^/]*WMF/i) ) {
			this.addClassAndHoverText('UHS-wmf', 'Wikimedia Foundation (WMF)');
		}

		// TODO: grab the order from an array, so I can keep checkForPermission and addCSS in the same order easily, lowering the risk of the HTML title="" being one thing, and the color being another
		this.checkForPermission(this.wmf, 'UHS-wmf', 'Wikimedia Foundation (WMF)');
		this.checkForPermission(this.stewards, 'UHS-steward', 'Steward');
		this.checkForPermission(this.arbcom, 'UHS-arbitration-committee', 'Arbitration Committee member');
		this.checkForPermission(this.bureaucrats, 'UHS-bureaucrat', 'Bureaucrat');
		this.checkForPermission(this.admins, 'UHS-administrator', 'Admin');
		this.checkForPermission(this.formeradmins, 'UHS-former-administrator', 'Former Admin');
		this.checkForPermission(this.newPageReviewers, 'UHS-new-page-reviewer', 'New page reviewer');
		this.checkForPermission(this.tenThousandEdits, 'UHS-10000edits', 'More than 10,000 edits');
		this.checkForPermission(this.extendedConfirmed, 'UHS-500edits-bot-trustedIP', 'Extended confirmed');

		// If they have no perms, just draw a box around their username, to make it more visible.
		if ( ! this.hasAdvancedPermissions ) {
			this.$link.addClass( "UHS-no-permissions" );
			let title = this.$link.attr("title");
			if ( ! title || title.startsWith("User:")) {
				this.$link.attr("title", "Less than 500 edits");
			}
		}
	}

	setHighlightColors() {
		// Highest specificity goes on bottom. So if you want an admin+steward to be highlighted steward, place the steward CSS below the admin CSS in this section.
		this.addCSS('UHS-override-signature-colors', `
			color: #0645ad !important;
			background-color: transparent !important;
			background: unset !important;
		`);
		this.mw.util.addCSS(`.UHS-no-permissions { border: 1px solid black !important; }`);


		// TODO: grab the order from an array, so I can keep checkForPermission and addCSS in the same order easily, lowering the risk of the HTML title="" being one thing, and the color being another
		this.addCSS('UHS-500edits-bot-trustedIP', `background-color: lightgray !important;`);
		this.addCSS('UHS-10000edits', `background-color: #9c9 !important;`);
		this.addCSS('UHS-new-page-reviewer', `background-color: #99f !important;`);
		this.addCSS('UHS-former-administrator', `background-color: #D3AC8B !important;`);
		this.addCSS('UHS-administrator', `background-color: #9ff !important;`);
		this.addCSS('UHS-bureaucrat', `background-color: orange !important; color: #0645ad !important;`);
		this.addCSS('UHS-arbitration-committee', `background-color: #FF3F3F !important; color: white !important;`);
		this.addCSS('UHS-steward', `background-color: #00FF00 !important;`);
		this.addCSS('UHS-wmf', `background-color: hotpink !important; color: #0645ad !important;`);
	}
}

// TODO: race condition with xtools gadget. sometimes it fails to highlight the xtools gadget's username link
// TODO: hook for after visual editor edit is saved?
mw.hook('wikipage.content').add(async function() {
	await mw.loader.using(['mediawiki.util', 'mediawiki.Uri', 'mediawiki.Title'], async function() {
		let uhs = new UserHighlighterSimple($, mw);
		await uhs.execute();
	});
});

// </nowiki>
