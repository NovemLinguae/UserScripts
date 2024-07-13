// <nowiki>

/*
- Add a "Show only blocked users" link to the More menu on the Special:History page
- When pressed, hides all diffs by non-blocked users, leaving diffs by blocked users
*/

class BlockedUserHistory {
	constructor( mw, $, window ) {
		this.mw = mw;
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $;
		this.window = window;
	}

	async execute() {
		if ( !this.shouldRunOnThisPage() ) {
			return;
		}

		// TODO: switch to MutationObserver
		// check for markblocked HTML classes every second for 20 seconds. when found, execute our user script
		let i = 0;
		const interval = setInterval( () => {
			const $markBlockedFinishedLoading = $( 'li[data-mw-revid]' ).has( '.history-user > a.user-blocked-indef, .history-user > a.user-blocked-partial, .history-user > a.user-blocked-temp' );
			if ( $markBlockedFinishedLoading || i >= 20 ) {
				this.addLinkOrHideBlocked();
				clearInterval( interval );
			}
			i++;
		}, 1000 );
	}

	addLinkOrHideBlocked() {
		const urlContainsOnlyShowBlocked = this.getUriParameter( 'onlyShowBlocked' ) === '1';
		if ( urlContainsOnlyShowBlocked ) {
			this.hideNotBlocked();
		} else {
			// Note that the pager links at the bottom of the page will automatically include &onlyShowBlocked=1 once you visit this URL. Good job MediaWiki :)
			// Some people are using a per page default as low as 50. Increase this to 1000 so we can see more blocked revisions on a single page.
			// TODO: Nardog suggestion: maybe use sessionStorage or history.pushState() instead of adding &onlyShowBlocked=1 to the URL
			const url = this.setUriParameters( this.window.location.href, {
				onlyShowBlocked: 1,
				limit: 1000
			} );
			this.mw.util.addPortletLink( 'p-cactions', url, 'Show only blocked users', 'blocked-user-history' );
		}
	}

	/**
	 * @copyright nickf, CC BY-SA 2.5, https://stackoverflow.com/a/1586333/3480193
	 */
	getUriParameter( uriParameter ) {
		const parts = this.window.location.search.substr( 1 ).split( '&' );
		const $_GET = {};
		for ( let i = 0; i < parts.length; i++ ) {
			const temp = parts[ i ].split( '=' );
			$_GET[ decodeURIComponent( temp[ 0 ] ) ] = decodeURIComponent( temp[ 1 ] );
		}
		return $_GET[ uriParameter ];
	}

	/**
	 * @param {string} url An entire URL, including protocol, domain, anchors, etc. Example: `https://www.test.com/testPage?param1=hello&param2=lol#This_is_my_anchor`
	 * @param {Object} paramsToChange An associative array, with the key names being the params to change, and the values being the value to change them to. Example: `{ param1: 'newValue', param2: 'anotherNewValue' }`
	 * @return {string} updatedUrl. Example: `https://www.test.com/testPage?param1=newValue&param2=anotherNewValue#This_is_my_anchor`
	 */
	setUriParameters( url, paramsToChange ) {
		const urlObj = new URL( url );
		for ( const key in paramsToChange ) {
			urlObj.searchParams.set( key, paramsToChange[ key ] );
		}
		return urlObj.toString();
	}

	/**
	 * @copyright Ponor, CC BY-SA 4.0, https://en.wikipedia.org/w/index.php?title=Wikipedia:User_scripts/Requests&diff=prev&oldid=1231068452
	 */
	hideNotBlocked() {
		$( 'li[data-mw-revid]' ).hide().has( '.history-user > a.user-blocked-indef, .history-user > a.user-blocked-partial, .history-user > a.user-blocked-temp' ).show();
	}

	shouldRunOnThisPage() {
		const action = this.mw.config.get( 'wgAction' );
		if ( action !== 'history' ) {
			return false;
		}

		return true;
	}

}

$( async () => {
	await mw.loader.using( [ 'mediawiki.util' ], async () => {
		await ( new BlockedUserHistory( mw, $, window ) ).execute();
	} );
} );

// </nowiki>
