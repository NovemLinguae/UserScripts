// <nowiki>

/*
	This script adds a left menu below the toolbox called "More tools", and includes some links:

	- userspace only
		- common.js
		- global.js
		- vector.js
		- common.css
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

	| skins = minerva, modern, monobook, timeless, vector, vector-2022
*/

class Links {
	async execute() {
		this._addPendingChangesToLeftMenu();
		this.pageName = mw.config.get( 'wgPageName' );
		await this._generateLinksForUserSpace();
		await this._generateLinksForAllNameSpaces();
		this._insertLinksInLeftMenu();
	}

	async _generateLinksForUserSpace() {
		this.username = this._getFirstMatch( this.pageName, /(?:User:|User_talk:)([^/]+).*/ );
		this.userLinks = '';
		if ( this.username ) {
			this.username = 'User:' + this.username;
			this.usernameURI = encodeURIComponent( this.username.replace( /_/g, ' ' ).replace( /^User:/, '' ) );

			this._generateUserSpaceJsCssLinks();
			this.userLinks += `<li><a href="/wiki/Special:CentralAuth?target=${ this.usernameURI }">Central auth</a></li>`;
			this._generateUserRightsLinks();
			this._generateRenameLogLinks();
			this.userLinks += `<li><a href="https://meta.wikimedia.org/wiki/Special:Log?page=User%3A${ this.usernameURI }%40global">Global lock log</a></li>`;
			await this._generateTwinkleLogLinks();
			this.userLinks += `<li><a href="https://en.wikipedia.org/wiki/Special:Log?type=pagetriage-curation&subtype=review&user=User%3A${ this.usernameURI }">Page curation log</a></li>`;
		}
	}

	_insertLinksInLeftMenu() {
		const menuTitle = 'More tools';
		let html = '';
		const skin = mw.config.get( 'skin' );
		switch ( skin ) {
			case 'minerva':
				// TODO: insert into the "More" menu, rather than the hamburger

				html = `
					<ul id="p-npp-links">
						${ this.userLinks }
						${ this.allPageLinks }
					</ul>`;

				html = html.replace( /<li>/g, '<li class="menu__item--preferences">' );
				html = html.replace( /(<a[^>]*>)/g, '$1<span class="mw-ui-icon"></span><span>' );
				html = html.replace( /<\/a>/g, '<span></a>' );

				$( '#p-navigation' ).after( html );
				break;
			case 'monobook':
				html = `
					<div role="navigation" class="portlet mw-portlet mw-portlet-npp-links" id="p-npp-links" aria-labelledby="p-npp-links-label">
						<h3 id="p-npp-links-label">
							${ menuTitle }
						</h3>
						<div class="pBody">
							<ul>
								${ this.userLinks }
								${ this.allPageLinks }
							</ul>
						</div>
					</div>
				`;
				$( '#p-tb' ).after( html );
				break;
			case 'modern':
				html = `
					<div class="portlet mw-portlet mw-portlet-npp-links" d="p-npp-links" role="navigation">
						<h3 id="p-npp-links-label" lang="en" dir="ltr">
							${ menuTitle }
						</h3>
						<div class="mw-portlet-body">
							<ul lang="en" dir="ltr">
								${ this.userLinks }
								${ this.allPageLinks }
							</ul>
						</div>
					</div>
				`;
				$( '#p-tb' ).after( html );
				break;
			case 'timeless':
				html = `
					<div role="navigation" class="mw-portlet" id="p-npp-links" aria-labelledby="p-npp-links-label">
						<h3 id="p-npp-links-label" lang="en" dir="ltr">
							${ menuTitle }
						</h3>
						<div class="mw-portlet-body">
							<ul lang="en" dir="ltr">
								${ this.userLinks }
								${ this.allPageLinks }
							</ul>
						</div>
					</div>
				`;
				$( '#p-tb' ).after( html );
				break;
			case 'vector-2022':
				html = `
					<nav id="p-npp-links" class="vector-main-menu-group vector-menu mw-portlet mw-portlet-interaction">
						<div class="vector-menu-heading">
							<span class="vector-menu-heading-label">
								${ menuTitle }
							</span>
						</div>
						<div class="vector-menu-content">
							<ul class="vector-menu-content-list">
								${ this.userLinks }
								${ this.allPageLinks }
							</ul>
						</div>
					</nav>
				`;
				$( '#p-tb' ).after( html );
				break;
			case 'vector':
			default:
				html = `
					<nav id="p-npp-links" class="mw-portlet mw-portlet-npp-links vector-menu vector-menu-portal portal" aria-labelledby="p-npp-links-label" role="npp-links">
						<h3 id="p-npp-links-label" class="vector-menu-heading">
							${ menuTitle }
						</h3>
						<div class="vector-menu-content">
							<ul class="vector-menu-content-list">
								${ this.userLinks }
								${ this.allPageLinks }
							</ul>
						</div>
					</nav>
				`;
				$( '#p-tb' ).after( html );
				break;
		}
	}

	_generateLinksForAllNameSpaces() {
		let parentName = this.pageName + '/';
		this.allPageLinks = '';
		if ( this.pageName.includes( '/' ) ) {
			parentName = this._getFirstMatch( this.pageName, /^([^/]+\/)/ );
		}
		this.allPageLinks += `<li><a href="/wiki/Special:PrefixIndex/${ parentName }">Subpages</a></li>`;
	}

	async _generateTwinkleLogLinks() {
		// twinkle logs (csd, prod, xfd) and draftify log
		// check if they exist with an API query before adding links
		const logPages = await this._pagesExist( [
			`${ this.username }/CSD log`,
			`${ this.username }/PROD log`,
			`${ this.username }/XfD log`,
			`${ this.username }/Draftify log`
		] );
		for ( const title of logPages ) {
			const shortTitle = title.replace( /^.*\//, '' );
			this.userLinks += `<li><a href="https://en.wikipedia.org/wiki/${ title }">${ shortTitle }</a></li>`;
		}
	}

	_generateRenameLogLinks() {
		// All modern renames seem to be put into both en:Special:Log->User rename log AND meta:Special:Log->User rename log.
		// One older rename was put only into meta:Special:Log->User rename log.
		// Another older rename was put only into en:Special:Log->User rename log, and was complicated by the fact that ~enwiki had been added to the end of it.
		// Spaces vs underscores don't seem to matter. User: or no User: doesn't seem to matter.
		this.userLinks += `<li><a href="https://meta.wikimedia.org/wiki/Special:GlobalRenameProgress?username=${ this.usernameURI }">Rename log 1</a></li>`;
		this.userLinks += `<li><a href="https://meta.wikimedia.org/wiki/Special:Log?type=renameuser&user=&page=${ this.usernameURI }">Rename log 2</a></li>`;
		this.userLinks += `<li><a href="https://en.wikipedia.org/wiki/Special:Log?type=renameuser&user=&page=${ this.usernameURI }%7Eenwiki">Rename log 3</a></li>`;
	}

	_generateUserRightsLinks() {
		this.userLinks += `<li><a href="/wiki/Special:Log?type=rights&user=&page=${ this.usernameURI }">User rights log</a></li>`;
		this.userLinks += `<li><a href="https://meta.wikimedia.org/wiki/Special:Log?type=rights&user=&page=${ this.usernameURI }@enwiki">User rights log (meta)</a></li>`;
	}

	/** common.js and similar */
	_generateUserSpaceJsCssLinks() {
		this.userLinks += `<li><a href="/wiki/${ this.username }/common.js">common.js</a></li>`;
		this.userLinks += `<li><a href="https://meta.wikimedia.org/wiki/${ this.username }/global.js">global.js</a></li>`;
		this.userLinks += `<li><a href="/wiki/${ this.username }/vector.js">vector.js</a></li>`;
		this.userLinks += `<li><a href="/wiki/${ this.username }/common.css">common.css</a></li>`;
	}

	_addPendingChangesToLeftMenu() {
		mw.util.addPortletLink(
			'p-navigation',
			mw.util.getUrl( 'Special:PendingChanges' ),
			'Pending changes' // can't put comma here, silent error
		);
	}

	_getFirstMatch( string, regex ) {
		const matches = string.match( regex );
		if ( matches && matches[ 1 ] ) {
			return matches[ 1 ];
		}
		return '';
	}

	/**
		* @param {Array} titles
	 */
	async _pagesExist( titles ) {
		const api = new mw.Api();
		let response = await api.get( {
			action: 'query',
			format: 'json',
			prop: 'revisions',
			titles: titles.join( '|' )
		} );

		/*
		Example format if exists:

		"66442411": {
			"pageid": 66442411,
			"ns": 2,
			"title": "User:Novem Linguae/CSD log",
			"revisions": [
				{
					"revid": 1091295780,
					"parentid": 1091255744,
					"user": "Novem Linguae",
					"timestamp": "2022-06-03T11:38:00Z",
					"comment": "Logging speedy deletion nomination of [[:Liquorose]]."
				}
			]
		},

		Example format if doesn't exist:

		"-1": {
			"ns": 2,
			"title": "User:Jmcclaskey54/CSD log",
			"missing": ""
		},
		*/
		response = response.query.pages;
		const pages = [];
		for ( const key in response ) {
			// the Number class will convert any non-numbers to zero
			if ( Number( key ) > 0 ) {
				pages.push( response[ key ].title );
			}
		}

		return pages;
	}
}

$( async function () {
	await ( new Links() ).execute();
} );

// </nowiki>
