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

		this.mw.util.addPortletLink( 'p-cactions', '#', 'Show only blocked users', 'blocked-user-history' );

		$( '#blocked-user-history' ).on( 'click', async () => {
			this.hideNotBlocked();
		} );
	}

	hideNotBlocked() {
		// Ponor, CC BY-SA 4.0, https://en.wikipedia.org/w/index.php?title=Wikipedia:User_scripts/Requests&diff=prev&oldid=1231068452
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
