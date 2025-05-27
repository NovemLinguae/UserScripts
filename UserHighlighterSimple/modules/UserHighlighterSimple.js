export class UserHighlighterSimple {
	/**
	 * @param {jQuery} $ jquery
	 * @param {Object} mw mediawiki
	 * @param {Window} window
	 */
	constructor( $, mw, window ) {
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $;
		this.mw = mw;
		this.window = window;
	}

	async execute() {
		await this.getUsernames();
		if ( !this.window.userHighlighterSimpleNoColors ) {
			this.setHighlightColors();
		}
		const $links = this.$( '#article a, #bodyContent a, #mw_contentholder a' );
		$links.each( ( index, element ) => {
			this.$link = this.$( element );
			const url = this.$link.attr( 'href' );
			if ( !this.linksToAUser( url ) ) {
				return;
			}

			this.user = this.getUserName();
			const isUserSubpage = this.user.includes( '/' );
			if ( isUserSubpage ) {
				return;
			}

			this.hasAdvancedPermissions = false;
			this.addClassesAndHoverTextToLinkIfNeeded();
			// If the user has any advanced perms, they are likely to have a signature, so be aggressive about overriding the background and foreground color. That way there's no risk their signature is unreadable due to background color and foreground color being too similar. Don't do this for users without advanced perms... being able to see a redlinked username is useful.
			if ( this.hasAdvancedPermissions ) {
				this.$link.addClass( this.$link.attr( 'class' ) + ' UHS-override-signature-colors' );
			}
		} );
	}

	async getUsernames() {
		const dataString = await this.getWikitextFromCache( 'User:NovemBot/userlist.js' );
		const dataJSON = JSON.parse( dataString );

		this.wmf = {
			...dataJSON.founder,
			...dataJSON.boardOfTrustees,
			...dataJSON.staff
			// WMF is hard-coded a bit further down. The script detects those strings in the username. This is safe to do because the WMF string is blacklisted from names, so has to be specially created.
			// ...dataJSON['sysadmin'],
			// ...dataJSON['global-interface-editor'],
			// ...dataJSON['wmf-supportsafety'],
			// ...dataJSON['mediawikiPlusTwo'],
			// ...dataJSON['global-sysop'],
		};
		this.stewards = dataJSON.steward;
		this.arbcom = dataJSON.arbcom;
		this.bureaucrats = dataJSON.bureaucrat;
		this.admins = dataJSON.sysop;
		this.formerAdmins = dataJSON.formeradmin;
		this.newPageReviewers = dataJSON.patroller;
		this.tenThousandEdits = dataJSON[ '10k' ];
		this.extendedConfirmed = {
			...dataJSON.extendedconfirmed,
			...dataJSON.bot,
			...dataJSON.productiveIPs
		};
	}

	async getWikitextFromCache( title ) {
		const api = new this.mw.ForeignApi( 'https://en.wikipedia.org/w/api.php' );
		let wikitext = '';
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
		} ).then( ( data ) => {
			wikitext = data.query.pages[ 0 ].revisions[ 0 ].slots.main.content;
		} );
		return wikitext;
	}

	setHighlightColors() {
		// Highest specificity goes on bottom. So if you want an admin+steward to be highlighted steward, place the steward CSS below the admin CSS in this section.
		this.addCSS( 'UHS-override-signature-colors', `
			color: #0645ad !important;
			background-color: transparent !important;
			background: unset !important;
		` );

		this.mw.util.addCSS( '.UHS-no-permissions { border: 1px solid black !important; }' );

		// TODO: grab the order from an array, so I can keep checkForPermission and addCSS in the same order easily, lowering the risk of the HTML title="" being one thing, and the color being another
		this.addCSS( 'UHS-500edits-bot-trustedIP', 'background-color: lightgray !important;' );
		this.addCSS( 'UHS-10000edits', 'background-color: #9c9 !important;' );
		this.addCSS( 'UHS-new-page-reviewer', 'background-color: #99f !important;' );
		this.addCSS( 'UHS-former-administrator', 'background-color: #D3AC8B !important;' );
		this.addCSS( 'UHS-administrator', 'background-color: #9ff !important;' );
		this.addCSS( 'UHS-bureaucrat', 'background-color: orange !important; color: #0645ad !important;' );
		this.addCSS( 'UHS-arbitration-committee', 'background-color: #FF3F3F !important; color: white !important;' );
		this.addCSS( 'UHS-steward', 'background-color: #00FF00 !important;' );
		this.addCSS( 'UHS-wmf', 'background-color: hotpink !important; color: #0645ad !important;' );
	}

	addCSS( htmlClass, cssDeclaration ) {
		// .plainlinks is for Wikipedia Signpost articles
		// To support additional custom signature edge cases, add to the selectors here.
		this.mw.util.addCSS( `
			.plainlinks .${ htmlClass }.external,
			.${ htmlClass },
			.${ htmlClass } b,
			.${ htmlClass } big,
			.${ htmlClass } font,
			.${ htmlClass } kbd,
			.${ htmlClass } small,
			.${ htmlClass } span {
				${ cssDeclaration }
			}
		` );
	}

	linksToAUser( url ) {
		if ( !this.hasHref( url ) || this.isAnchor( url ) || !this.isHttpOrHttps( url ) ) {
			return false;
		}

		url = this.addDomainIfMissing( url );

		let urlHelper;
		try {
			urlHelper = new URL( url );
		} catch {
			return false;
		}

		// Skip links that aren't to user pages
		const isUserPageLink = url.includes( '/w/index.php?title=User:' ) ||
			url.includes( '/w/index.php?title=User_talk:' ) ||
			url.includes( '/w/index.php?title=User%20talk:' ) ||
			url.includes( '/w/index.php?title=User talk:' ) ||
			url.includes( '/wiki/User:' ) ||
			url.includes( '/wiki/User_talk:' ) ||
			url.includes( '/wiki/User%20talk:' ) ||
			url.includes( '/wiki/User talk:' );
		if ( !isUserPageLink ) {
			return false;
		}

		// Even if it is a link to a userpage, skip URLs that have any parameters except title=User, action=edit, and redlink=. We don't want links to diff pages, section editing pages, etc. to be highlighted.
		const urlParameters = this.getObjectWithUriParamsFromQueryString( urlHelper );
		delete urlParameters.title;
		delete urlParameters.action;
		delete urlParameters.redlink;
		const hasNonUserpageParametersInUrl = Object.keys( urlParameters ).length > 0;
		if ( hasNonUserpageParametersInUrl ) {
			return false;
		}

		const title = this.getTitle( url );

		// Handle edge cases such as https://web.archive.org/web/20231105033559/https://en.wikipedia.org/wiki/User:SandyGeorgia/SampleIssue, which shows up as isUserPageLink = true but isn't really a user page.
		try {
			this.titleHelper = new this.mw.Title( title );
		} catch {
			return false;
		}

		const isDiscussionToolsSectionLink = url.includes( '#' );
		if ( isDiscussionToolsSectionLink ) {
			return false;
		}

		return true;
	}

	getObjectWithUriParamsFromQueryString( url ) {
		const params = {};
		const queryString = url.search;
		const urlParams = new URLSearchParams( queryString );
		for ( const [ key, value ] of urlParams.entries() ) {
			params[ key ] = value;
		}
		return params;
	}

	hasHref( url ) {
		return Boolean( url );
	}

	isAnchor( url ) {
		return url.charAt( 0 ) === '#';
	}

	isHttpOrHttps( url ) {
		return url.startsWith( 'http://', 0 ) ||
			url.startsWith( 'https://', 0 ) ||
			url.startsWith( '/', 0 );
	}

	/**
	 * URL( url ) expects a complete URL. If we get something like /wiki/User:Test, convert it to https://en.wikipedia.org/wiki/User:Test. Without this, UserHighlighterSimple doesn't work on metawiki.
	 *
	 * @param {string} url
	 * @return {string} url
	 */
	addDomainIfMissing( url ) {
		if ( url.startsWith( '/' ) ) {
			url = this.window.location.origin + url;
		}
		return url;
	}

	/**
	 * Figure out the wikipedia article title of the link
	 *
	 * @param {string} url
	 * @return {string}
	 */
	getTitle( url ) {
		// for links in the format /w/index.php?title=Blah
		const titleParameterOfUrl = this.mw.util.getParamValue( 'title', url );
		if ( titleParameterOfUrl ) {
			return titleParameterOfUrl;
		}

		// for links in the format /wiki/PageName. Slice off the /wiki/ (first 6 characters)
		const urlHelper = new URL( url );
		if ( urlHelper.pathname.startsWith( '/wiki/' ) ) {
			return decodeURIComponent( urlHelper.pathname.slice( 6 ) );
		}

		return '';
	}

	/**
	 * @return {string}
	 */
	getUserName() {
		const user = this.titleHelper.getMain().replace( /_/g, ' ' );
		return user;
	}

	addClassesAndHoverTextToLinkIfNeeded() {
		// highlight anybody with "WMF" in their name, case insensitive. this should not generate false positives because "WMF" is on the username blacklist. see https://meta.wikimedia.org/wiki/Title_blacklist
		if ( this.user.match( /^[^/]*WMF/i ) ) {
			this.addClassAndHoverText( 'UHS-wmf', 'Wikimedia Foundation (WMF)' );
		}

		// TODO: grab the order from an array, so I can keep checkForPermission and addCSS in the same order easily, lowering the risk of the HTML title="" being one thing, and the color being another
		this.checkForPermission( this.wmf, 'UHS-wmf', 'Wikimedia Foundation (WMF)' );
		this.checkForPermission( this.stewards, 'UHS-steward', 'Steward or Ombud' );
		this.checkForPermission( this.arbcom, 'UHS-arbitration-committee', 'Arbitration Committee member' );
		this.checkForPermission( this.bureaucrats, 'UHS-bureaucrat', 'Bureaucrat' );
		this.checkForPermission( this.admins, 'UHS-administrator', 'Admin' );
		this.checkForPermission( this.formerAdmins, 'UHS-former-administrator', 'Former Admin' );
		this.checkForPermission( this.newPageReviewers, 'UHS-new-page-reviewer', 'New page reviewer' );
		this.checkForPermission( this.tenThousandEdits, 'UHS-10000edits', 'More than 10,000 edits' );
		this.checkForPermission( this.extendedConfirmed, 'UHS-500edits-bot-trustedIP', 'Extended confirmed' );

		// If they have no perms, just draw a box around their username, to make it more visible.
		if ( !this.hasAdvancedPermissions ) {
			this.$link.addClass( 'UHS-no-permissions' );
			const title = this.$link.attr( 'title' );
			if ( !title || title.startsWith( 'User:' ) ) {
				this.$link.attr( 'title', 'Less than 500 edits' );
			}
		}
	}

	checkForPermission( listOfUsernames, className, descriptionForHover ) {
		if ( listOfUsernames[ this.user ] === 1 ) {
			this.addClassAndHoverText( className, descriptionForHover );
		}
	}

	addClassAndHoverText( className, descriptionForHover ) {
		this.$link.addClass( className );

		const title = this.$link.attr( 'title' );
		if ( !title || title.startsWith( 'User:' ) ) {
			this.$link.attr( 'title', descriptionForHover );
		}

		this.hasAdvancedPermissions = true;
	}
}
