/*
You can import this gadget to other wikis by using mw.loader.load and specifying the local alias for Special:Contributions. For example:
var markblocked_contributions = 'Special:Contributions';
mw.loader.load('//en.wikipedia.org/w/index.php?title=MediaWiki:Gadget-markblocked.js&bcache=1&maxage=259200&action=raw&ctype=text/javascript');

This gadget will pull the user accounts and IPs from the history page and will strike out the users that are currently blocked.

Configuration variables:
- window.markblocked_contributions - Let wikis that are importing this gadget specify the local alias of Special:Contributions
- window.mbIndefStyle - custom CSS to override default CSS for indefinite blocks
- window.mbNoAutoStart - if set to true, doesn't mark blocked until you click "XX" in the "More" menu
- window.mbPartialStyle - custom CSS to override default CSS for partial blocks
- window.mbTempStyle - custom CSS to override default CSS for short duration blocks
- window.mbTipBox - if set to true, loads a yellow box with a pound sign next to blocked usernames. upon hovering over it, displays a tooltip.
- window.mbTipBoxStyle - custom CSS to override default CSS for the tip box (see above)
- window.mbTooltip - custom pattern to use for tooltips. default is '; blocked ($1) by $2: $3 ($4 ago)'

Forked from https://ru.wikipedia.org/w/index.php?title=MediaWiki:Gadget-markblocked.js&oldid=77732587 on July 13, 2016
*/

( () => {
	function execute() {
		if ( [ 'edit', 'submit' ].indexOf( mw.config.get( 'wgAction' ) ) !== -1 ) {
			return;
		}

		const maybeAutostart = $.Deferred();
		if ( window.mbNoAutoStart ) {
			const portletLink = mw.util.addPortletLink( 'p-cactions', '', 'XX', 'ca-showblocks' );
			$( portletLink ).on( 'click', ( e ) => {
				e.preventDefault();
				maybeAutostart.resolve();
			} );
		} else {
			maybeAutostart.resolve();
		}

		$.when(
			$.ready,
			// keep mw.loader.using in case folks are loading this as a user script
			mw.loader.using( [ 'mediawiki.util', 'mediawiki.page.ready', 'mediawiki.Title' ] ),
			maybeAutostart
		).then( () => {
			let firstTime = true;

			mw.hook( 'wikipage.content' ).add( ( $container ) => {
				// On the first call after initial page load, container is mw.util.$content

				// Limit mainspace activity to just the diff definitions
				if ( mw.config.get( 'wgAction' ) === 'view' && mw.config.get( 'wgNamespaceNumber' ) === 0 ) {
					$container = $container.find( '.diff-title' );
				}

				if ( firstTime ) {
					firstTime = false;

					// On page load, also update the namespace tab
					$container = $container.add( '#ca-nstab-user' );

					mw.util.addCSS( '\
						.markblocked-loading a.userlink {opacity:' + ( window.mbLoadingOpacity || 0.85 ) + '}\
						a.user-blocked-temp {' + ( window.mbTempStyle || 'opacity: 0.7; text-decoration: line-through' ) + '}\
						a.user-blocked-indef {' + ( window.mbIndefStyle || 'opacity: 0.4; font-style: italic; text-decoration: line-through' ) + '}\
						a.user-blocked-partial {' + ( window.mbPartialStyle || 'text-decoration: underline; text-decoration-style: dotted' ) + '}\
						.user-blocked-tipbox {' + ( window.mbTipBoxStyle || 'font-size:smaller; background:#FFFFF0; border:1px solid #FEA; padding:0 0.3em; color:#AAA' ) + '}\
					' );
				}

				markBlocked( $container );
			} );
		} );
	}

	function markBlocked( $container ) {
		// Get all aliases for user: & user_talk:
		const userNS = [];
		for ( const ns in mw.config.get( 'wgNamespaceIds' ) ) {
			if ( mw.config.get( 'wgNamespaceIds' )[ ns ] === 2 || mw.config.get( 'wgNamespaceIds' )[ ns ] === 3 ) {
				userNS.push( mw.util.escapeRegExp( ns.replace( /_/g, ' ' ) ) + ':' );
			}
		}

		// Let wikis that are importing this gadget specify the local alias of Special:Contributions
		if ( window.markblocked_contributions === undefined ) {
			window.markblocked_contributions = 'Special:Contributions';
		}

		const userLinks = {};
		getUserLinks( userLinks, $container, userNS );

		// Convert users into array
		const users = [];
		for ( const u in userLinks ) {
			users.push( u );
		}
		if ( users.length === 0 ) {
			return;
		}

		// API request
		let apiRequests = 0;
		$container.addClass( 'markblocked-loading' );
		while ( users.length > 0 ) {
			apiRequests++;
			// TODO: refactor to use mw.Api()
			$.post(
				mw.util.wikiScript( 'api' ) + '?format=json&action=query',
				{
					list: 'blocks',
					bklimit: 100,
					bkusers: users.splice( 0, 50 ).join( '|' ),
					bkprop: 'user|by|timestamp|expiry|reason|restrictions'
					// no need for 'id|flags'
				}
			).done( ( resp, status, xhr ) => {
				markLinks( resp, xhr, userLinks );
				apiRequests--;
				if ( apiRequests === 0 ) { // last response
					$container.removeClass( 'markblocked-loading' );
					$( '#ca-showblocks' ).parent().remove(); // remove added portlet link
				}
			} );
		}
	}

	/**
	 * Receive data and mark links
	 */
	function markLinks( resp, xhr, userLinks ) {
		const serverTime = new Date( xhr.getResponseHeader( 'Date' ) );
		let list, block, tooltipString, links, $link;
		if ( !resp || !( list = resp.query ) || !( list = list.blocks ) ) {
			return;
		}

		for ( let i = 0; i < list.length; i++ ) {
			block = list[ i ];
			const partial = block.restrictions && !Array.isArray( block.restrictions ); // Partial block
			let htmlClass, blockTime;
			if ( /^in/.test( block.expiry ) ) {
				htmlClass = partial ? 'user-blocked-partial' : 'user-blocked-indef';
				blockTime = block.expiry;
			} else {
				htmlClass = partial ? 'user-blocked-partial' : 'user-blocked-temp';
				// Apparently you can subtract date objects in JavaScript. Some kind of
				// magic happens and they are automatically converted to milliseconds.
				blockTime = inHours( parseTimestamp( block.expiry ) - parseTimestamp( block.timestamp ) );
			}
			tooltipString = window.mbTooltip || '; blocked ($1) by $2: $3 ($4 ago)';
			if ( partial ) {
				tooltipString = tooltipString.replace( 'blocked', 'partially blocked' );
			}
			tooltipString = tooltipString.replace( '$1', blockTime )
				.replace( '$2', block.by )
				.replace( '$3', block.reason )
				.replace( '$4', inHours( serverTime - parseTimestamp( block.timestamp ) ) );
			links = userLinks[ block.user ];
			for ( let k = 0; links && k < links.length; k++ ) {
				$link = $( links[ k ] );
				$link = $link.addClass( htmlClass );
				if ( window.mbTipBox ) {
					$( '<span class=user-blocked-tipbox>#</span>' ).attr( 'title', tooltipString ).insertBefore( $link );
				} else {
					$link.attr( 'title', $link.attr( 'title' ) + tooltipString );
				}
			}
		}
	}

	/**
	 * Find all "user" links and save them in userLinks : { 'users': [<link1>, <link2>, ...], 'user2': [<link3>, <link3>, ...], ... }
	 */
	function getUserLinks( userLinks, $container, userNS ) {
		// RegExp for all titles that are  User:| User_talk: | Special:Contributions/ (for userscripts)
		const userTitleRegex = new RegExp( '^(' + userNS.join( '|' ) + '|' + window.markblocked_contributions + '\\/)+([^\\/#]+)$', 'i' );

		// RegExp for links
		// articleRX also matches external links in order to support the noping template
		const articleRegex = new RegExp( mw.config.get( 'wgArticlePath' ).replace( '$1', '' ) + '([^#]+)' );
		const scriptRegex = new RegExp( '^' + mw.config.get( 'wgScript' ) + '\\?title=([^#&]+)' );

		const ipv6Regex = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;

		// Collect all the links in the page's content
		$container.find( 'a' )
			.not( '.mw-changeslist-date, .ext-discussiontools-init-timestamplink, .mw-history-undo > a, .mw-rollback-link > a' )
			.each( ( i, link ) => {
				// guard clauses and username extraction logic

				const $link = $( link );

				const url = $link.attr( 'href' );
				if ( !url ) {
					return;
				}

				const articleMatch = articleRegex.exec( url ),
					scriptMatch = scriptRegex.exec( url );
				let pageTitle;
				if ( articleMatch ) {
					pageTitle = articleMatch[ 1 ];
				} else if ( scriptMatch ) {
					pageTitle = scriptMatch[ 1 ];
				} else {
					return;
				}
				pageTitle = decodeURIComponent( pageTitle ).replace( /_/g, ' ' );

				let user = userTitleRegex.exec( pageTitle );
				if ( !user ) {
					return;
				}

				const userTitle = mw.Title.newFromText( user[ 2 ] );
				if ( !userTitle ) {
					return;
				}

				user = userTitle.getMainText();
				if ( ipv6Regex.test( user ) ) {
					user = user.toUpperCase();
				}

				// OK, let's finally do some stuff that has side effects

				$link.addClass( 'userlink' );

				if ( !userLinks[ user ] ) {
					userLinks[ user ] = [];
				}
				userLinks[ user ].push( link );
			} );
	}

	/**
	 * @param {string} timestamp 20081226220605 or 2008-01-26T06:34:19Z
	 * @return {Date}
	 */
	function parseTimestamp( timestamp ) {
		const matches = timestamp.replace( /\D/g, '' ).match( /(\d\d\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/ );
		return new Date( Date.UTC( matches[ 1 ], matches[ 2 ] - 1, matches[ 3 ], matches[ 4 ], matches[ 5 ], matches[ 6 ] ) );
	}

	/**
	 * @param {number} milliseconds 604800000
	 * @return {string} "2:30" or "5.06d" or "21d"
	 */
	function inHours( milliseconds ) {
		let minutes = Math.floor( milliseconds / 60000 );
		if ( !minutes ) {
			return Math.floor( milliseconds / 1000 ) + 's';
		}
		let hours = Math.floor( minutes / 60 );
		minutes = minutes % 60;
		const days = Math.floor( hours / 24 );
		hours = hours % 24;
		if ( days ) {
			return days + ( days < 10 ? '.' + addLeadingZeroIfNeeded( hours ) : '' ) + 'd';
		}
		return hours + ':' + addLeadingZeroIfNeeded( minutes );
	}

	/**
	 * @param {number} v 9
	 * @return {string} 09
	 */
	function addLeadingZeroIfNeeded( v ) {
		if ( v <= 9 ) {
			v = '0' + v;
		}
		return v;
	}

	execute();
} )();
