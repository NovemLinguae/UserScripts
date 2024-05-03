/*
You can import this gadget to other wikis by using mw.loader.load and specifying the local alias for Special:Contributions. For example:
var markblocked_contributions = 'Special:Contributions';
mw.loader.load('//en.wikipedia.org/w/index.php?title=MediaWiki:Gadget-markblocked.js&bcache=1&maxage=259200&action=raw&ctype=text/javascript');

This gadget will pull the user accounts and IPs from the history page and will strike out the users that are currently blocked.
*/
function markBlocked( container ) {
	const ipv6Regex = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;

	// Collect all the links in the page's content
	const contentLinks = $( container ).find( 'a' );

	const tooltipPreference = window.mbTooltip || '; blocked ($1) by $2: $3 ($4 ago)';

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
	// RegExp for all titles that are  User:| User_talk: | Special:Contributions/ (for userscripts)
	const userTitleRegex = new RegExp( '^(' + userNS.join( '|' ) + '|' + window.markblocked_contributions + '\\/)+([^\\/#]+)$', 'i' );

	// RegExp for links
	// articleRX also matches external links in order to support the noping template
	const articleRegex = new RegExp( mw.config.get( 'wgArticlePath' ).replace( '$1', '' ) + '([^#]+)' );
	const scriptRegex = new RegExp( '^' + mw.config.get( 'wgScript' ) + '\\?title=([^#&]+)' );

	const userLinks = {};
	let user, url, pageTitle;

	// Find all "user" links and save them in userLinks : { 'users': [<link1>, <link2>, ...], 'user2': [<link3>, <link3>, ...], ... }
	contentLinks.each( function ( i, link ) {
		if ( $( link ).hasClass( 'mw-changeslist-date' ) || $( link ).parent( 'span' ).hasClass( 'mw-history-undo' ) || $( link ).parent( 'span' ).hasClass( 'mw-rollback-link' ) ) {
			return;
		}
		url = $( link ).attr( 'href' );
		if ( !url ) {
			return;
		}
		const articleMatch = articleRegex.exec( url ),
			scriptMatch = scriptRegex.exec( url );
		if ( articleMatch ) {
			pageTitle = articleMatch[ 1 ];
		} else if ( scriptMatch ) {
			pageTitle = scriptMatch[ 1 ];
		} else {
			return;
		}
		pageTitle = decodeURIComponent( pageTitle ).replace( /_/g, ' ' );
		user = userTitleRegex.exec( pageTitle );
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
		$( link ).addClass( 'userlink' );
		if ( !userLinks[ user ] ) {
			userLinks[ user ] = [];
		}
		userLinks[ user ].push( link );
	} );

	// Convert users into array
	const users = [];
	for ( const u in userLinks ) {
		users.push( u );
	}
	if ( users.length === 0 ) {
		return;
	}

	// API request
	let serverTime, apiRequests = 0;
	container.addClass( 'markblocked-loading' );
	while ( users.length > 0 ) {
		apiRequests++;
		$.post(
			mw.util.wikiScript( 'api' ) + '?format=json&action=query',
			{
				list: 'blocks',
				bklimit: 100,
				bkusers: users.splice( 0, 50 ).join( '|' ),
				bkprop: 'user|by|timestamp|expiry|reason|restrictions'
				// no need for 'id|flags'
			},
			markLinks
		);
	}

	return; // the end

	// Callback: receive data and mark links
	function markLinks( resp, status, xhr ) {
		serverTime = new Date( xhr.getResponseHeader( 'Date' ) );
		let list, block, tooltipString, links, link;
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
				blockTime = inHours( parseTimestamp( block.expiry ) - parseTimestamp( block.timestamp ) );
			}
			tooltipString = tooltipPreference;
			if ( partial ) {
				tooltipString = tooltipString.replace( 'blocked', 'partially blocked' );
			}
			tooltipString = tooltipString.replace( '$1', blockTime )
				.replace( '$2', block.by )
				.replace( '$3', block.reason )
				.replace( '$4', inHours( serverTime - parseTimestamp( block.timestamp ) ) );
			links = userLinks[ block.user ];
			for ( let k = 0; links && k < links.length; k++ ) {
				link = $( links[ k ] );
				link = link.addClass( htmlClass );
				if ( window.mbTipBox ) {
					$( '<span class=user-blocked-tipbox>#</span>' ).attr( 'title', tooltipString ).insertBefore( link );
				} else {
					link.attr( 'title', link.attr( 'title' ) + tooltipString );
				}
			}
		}

		if ( --apiRequests === 0 ) { // last response
			container.removeClass( 'markblocked-loading' );
			$( '#ca-showblocks' ).parent().remove(); // remove added portlet link
		}

	}

	// --------AUX functions

	// 20081226220605  or  2008-01-26T06:34:19Z   -> date
	function parseTimestamp( ts ) {
		const m = ts.replace( /\D/g, '' ).match( /(\d\d\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/ );
		return new Date( Date.UTC( m[ 1 ], m[ 2 ] - 1, m[ 3 ], m[ 4 ], m[ 5 ], m[ 6 ] ) );
	}

	function inHours( ms ) { // milliseconds -> "2:30" or 5,06d or 21d
		let mm = Math.floor( ms / 60000 );
		if ( !mm ) {
			return Math.floor( ms / 1000 ) + 's';
		}
		let hh = Math.floor( mm / 60 );
		mm = mm % 60;
		const dd = Math.floor( hh / 24 );
		hh = hh % 24;
		if ( dd ) {
			return dd + ( dd < 10 ? '.' + zz( hh ) : '' ) + 'd';
		}
		return hh + ':' + zz( mm );
	}

	function zz( v ) { // 6 -> '06'
		if ( v <= 9 ) {
			v = '0' + v;
		}
		return v;
	}
}

// Start on some pages
let maybeAutostart;
switch ( mw.config.get( 'wgAction' ) ) {
	case 'edit':
	case 'submit':
		break;
	default: // 'view', 'history', 'purge', ...
		maybeAutostart = $.Deferred();
		if ( window.mbNoAutoStart ) {
			const portletLink = mw.util.addPortletLink( 'p-cactions', '', 'XX', 'ca-showblocks' );
			$( portletLink ).on( 'click', function ( e ) {
				e.preventDefault();
				maybeAutostart.resolve();
			} );
		} else {
			maybeAutostart.resolve();
		}

		$.when( $.ready, mw.loader.using( 'mediawiki.util' ), maybeAutostart ).then( function () {
			let firstTime = true;

			mw.hook( 'wikipage.content' ).add( function ( container ) {
				// On the first call after initial page load, container is mw.util.$content

				// Used to limit mainspace activity to just the diff definitions
				if ( mw.config.get( 'wgAction' ) === 'view' && mw.config.get( 'wgNamespaceNumber' ) === 0 ) {
					container = container.find( '.diff-title' );
				}

				if ( firstTime ) {
					firstTime = false;

					// On page load, also update the namespace tab
					container = container.add( '#ca-nstab-user' );

					mw.util.addCSS( '\
						.markblocked-loading a.userlink {opacity:' + ( window.mbLoadingOpacity || 0.85 ) + '}\
						a.user-blocked-temp {' + ( window.mbTempStyle || 'opacity: 0.7; text-decoration: line-through' ) + '}\
						a.user-blocked-indef {' + ( window.mbIndefStyle || 'opacity: 0.4; font-style: italic; text-decoration: line-through' ) + '}\
						a.user-blocked-partial {' + ( window.mbPartialStyle || 'text-decoration: underline; text-decoration-style: dotted' ) + '}\
						.user-blocked-tipbox {' + ( window.mbTipBoxStyle || 'font-size:smaller; background:#FFFFF0; border:1px solid #FEA; padding:0 0.3em; color:#AAA' ) + '}\
					' );
				}

				markBlocked( container );
			} );
		} );
}
