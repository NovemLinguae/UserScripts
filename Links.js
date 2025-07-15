// <nowiki>

/*
	This script adds a left menu below the toolbox called "More tools", and includes some links:

	- userspace only
		- common.js
		- global.js
		- vector.js
		- common.css
		- global.css
		- central auth (good for seeing what global permissions people have)
		- rename log
		- global lock log
		- Twinkle CSD log
		- Twinkle PROD log
		- Twinkle XfD log
		- Draftify log
		- Page curation log

	- all namespaces
		- subpages

	This script also adds "Pending changes" to the left main menu.

	Skin support
		- left menu
			- vector
			- modern
			- monobook
			- timeless
		- right menu (tools menu)
			- vector-2022
		- not displayed at all
			- minerva
*/

class Links {
	constructor( mw ) {
		this.mw = mw;
	}

	async execute() {
		this.mw.util.addPortletLink( 'p-navigation', this.mw.util.getUrl( 'Special:PendingChanges' ), 'Pending changes' );
		this.pageName = this.mw.config.get( 'wgPageName' );
		this.createBottomLeftMenuContainer();
		this.username = this.getFirstMatch( this.pageName, /(?:User:|User_talk:)([^/]+).*/ );
		if ( this.username ) {
			await this.generateUserspaceLinks();
		}
		await this.generateSubpageLink();
	}

	createBottomLeftMenuContainer() {
		// Works as expected in vector, modern, monobook, timeless. Is in right menu instead of left menu in vector-2022. Doesn't show up at all in minerva.
		// Could fix in those skins by adding it before an existing nearby portlet, then using the p.parentNode.appendChild( p ); trick.
		this.mw.util.addPortlet( 'p-links', 'More tools', '#p-coll-print_export' );
	}

	async generateUserspaceLinks() {
		this.username = 'User:' + this.username;
		this.usernameURI = encodeURIComponent( this.username.replace( /_/g, ' ' ).replace( /^User:/, '' ) );

		this.mw.util.addPortletLink( 'p-links', `/wiki/${ this.username }/common.js`, 'common.js' );
		this.mw.util.addPortletLink( 'p-links', `https://meta.wikimedia.org/wiki/${ this.username }/global.js`, 'global.js' );
		this.mw.util.addPortletLink( 'p-links', `/wiki/${ this.username }/vector.js`, 'vector.js' );
		this.mw.util.addPortletLink( 'p-links', `/wiki/${ this.username }/common.css`, 'common.css' );
		this.mw.util.addPortletLink( 'p-links', `https://meta.wikimedia.org/wiki/${ this.username }/global.css`, 'global.css' );
		// point this one to meta. Speical:CentralAuth works locally, but does not show the "previous global account changes" log when used locally
		this.mw.util.addPortletLink( 'p-links', `https://meta.wikimedia.org/wiki/Special:CentralAuth?target=${ this.usernameURI }`, 'Central auth' );
		this.mw.util.addPortletLink( 'p-links', `/wiki/Special:Log?type=rights&user=&page=${ this.usernameURI }`, 'User rights log' );
		this.mw.util.addPortletLink( 'p-links', `https://meta.wikimedia.org/wiki/Special:Log?type=rights&user=&page=${ this.usernameURI }@enwiki`, 'User rights log (meta 1)' );
		this.mw.util.addPortletLink( 'p-links', `https://meta.wikimedia.org/wiki/Special:Log?type=rights&user=&page=${ this.usernameURI }`, 'User rights log (meta 2)' );

		this.generateRenameLogLinks();

		this.mw.util.addPortletLink( 'p-links', `https://meta.wikimedia.org/wiki/Special:Log?page=User%3A${ this.usernameURI }%40global`, 'Global lock log' );

		await this.generateTwinkleLogLinks();

		this.mw.util.addPortletLink( 'p-links', `/wiki/Special:Log?type=pagetriage-curation&subtype=review&user=User%3A${ this.usernameURI }`, 'Page curation log' );
	}

	generateSubpageLink() {
		let parentName = this.pageName + '/';
		if ( this.pageName.includes( '/' ) ) {
			parentName = this.getFirstMatch( this.pageName, /^([^/]+\/)/ );
		}
		this.mw.util.addPortletLink( 'p-links', `/wiki/Special:PrefixIndex/${ parentName }`, 'Subpages' );
	}

	async generateTwinkleLogLinks() {
		// twinkle logs (csd, prod, xfd) and draftify log
		// check if they exist with an API query before adding links
		const logPages = await this.pagesExist( [
			`${ this.username }/CSD log`,
			`${ this.username }/PROD log`,
			`${ this.username }/XfD log`,
			`${ this.username }/Draftify log`
		] );
		for ( const title of logPages ) {
			const shortTitle = title.replace( /^.*\//, '' );
			this.mw.util.addPortletLink( 'p-links', `/wiki/${ title }`, shortTitle );
		}
	}

	generateRenameLogLinks() {
		// All modern renames seem to be put into both en:Special:Log->User rename log AND meta:Special:Log->User rename log.
		// One older rename was put only into meta:Special:Log->User rename log.
		// Another older rename was put only into en:Special:Log->User rename log, and was complicated by the fact that ~enwiki had been added to the end of it.
		// Spaces vs underscores don't seem to matter. User: or no User: doesn't seem to matter.
		this.mw.util.addPortletLink( 'p-links', `https://meta.wikimedia.org/wiki/Special:GlobalRenameProgress?username=${ this.usernameURI }`, 'Rename log 1' );
		this.mw.util.addPortletLink( 'p-links', `https://meta.wikimedia.org/wiki/Special:Log?type=renameuser&user=&page=${ this.usernameURI }`, 'Rename log 2' );
		this.mw.util.addPortletLink( 'p-links', `/wiki/Special:Log?type=renameuser&user=&page=${ this.usernameURI }%7Eenwiki`, 'Rename log 3' );
	}

	getFirstMatch( string, regex ) {
		const matches = string.match( regex );
		if ( matches && matches[ 1 ] ) {
			return matches[ 1 ];
		}
		return '';
	}

	/**
		* @param {Array} titles
	 */
	async pagesExist( titles ) {
		const api = new this.mw.Api();
		let response = await api.get( {
			action: 'query',
			format: 'json',
			prop: 'revisions',
			titles: titles.join( '|' )
		} );
		response = response.query.pages;
		const pages = [];
		for ( const key in response ) {
			// the Number class will convert any non-numbers to 0
			// the API will return -1 for non-existent pages
			// the API will return the page ID for existing pages
			if ( Number( key ) > 0 ) {
				pages.push( response[ key ].title );
			}
		}
		return pages;
	}
}

$( async () => {
	await mw.loader.using( [ 'mediawiki.api' ], async () => {
		await ( new Links( mw ) ).execute();
	} );
} );

// </nowiki>
