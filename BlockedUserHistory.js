// <nowiki>

/*
- Add a "Show only blocked users" link to the More menu on the Special:History page
- When pressed, hides all diffs by non-blocked users, leaving diffs by blocked users
*/

class BlockedUserHistory {
	constructor( mw, $ ) {
		this.mw = mw;
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $;
	}

	async execute() {
		if ( !this.shouldRunOnThisPage() ) {
			return;
		}

		// TODO: switch to MutationObserver
		// check for markblocked HTML classes every second for 20 seconds. when found, execute our user script
		let i = 0;
		const interval = setInterval( function() {
			const markBlockedFinishedLoading = $( 'li[data-mw-revid]' ).has( '.history-user > a.user-blocked-indef, .history-user > a.user-blocked-partial, .history-user > a.user-blocked-temp' );
			if ( markBlockedFinishedLoading || i >= 20 ) {
				this.doStuff();
				clearInterval( interval );
			}
			i++;
		}.bind( this ), 1000);
	}

	doStuff() {
		const urlContainsOnlyShowBlocked = this.getUriParameter('onlyShowBlocked') === '1';
		if ( urlContainsOnlyShowBlocked ) {
			this.hideNotBlocked();
		} else {
			// Note that the pager links at the bottom of the page will automatically include &onlyShowBlocked=1 once you visit this URL. Good job MediaWiki :)
			this.mw.util.addPortletLink( 'p-cactions', window.location.href + '&onlyShowBlocked=1', 'Show only blocked users', 'blocked-user-history' );
		}
	}

	/**
	 * @copyright nickf, CC BY-SA 2.5, https://stackoverflow.com/a/1586333/3480193
	 */
	getUriParameter( uriParameter ) {
		var parts = window.location.search.substr(1).split("&");
		var $_GET = {};
		for (var i = 0; i < parts.length; i++) {
			var temp = parts[i].split("=");
			$_GET[decodeURIComponent(temp[0])] = decodeURIComponent(temp[1]);
		}
		return $_GET[ uriParameter ];
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
		await ( new BlockedUserHistory( mw, $ ) ).execute();
	} );
} );

// </nowiki>
