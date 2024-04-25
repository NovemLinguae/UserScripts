// <nowiki>

/*
- Adds Watchlist tab and Topic Subscriptions tab to your watchlist and topic subscriptions pages.
*/

$( async function () {
	// could also use mw.config.get('wgCanonicalSpecialPageName')
	const title = mw.config.get( 'wgPageName' ); // includes namespace, underscores instead of spaces
	if ( title === 'Special:Watchlist' || title === 'Special:TopicSubscriptions' ) {
		$( '#mw-content-text' ).before( `
			<style>
				.TopicSubscriptionsTab {
					
				}

				.TopicSubscriptionsTab-Tab {
					display: inline-block;
					border-left: 1px solid black;
					border-top: 1px solid black;
					border-right: 1px solid black;
					padding: 0 10px;
				}
			</style>

			<div class="TopicSubscriptionsTab">
				<div class="TopicSubscriptionsTab-Tab">
					<a href="/wiki/Special:Watchlist">
						Watchlist
					</a>
				</div>
				<div class="TopicSubscriptionsTab-Tab">
					<a href="/wiki/Special:TopicSubscriptions">
						Topic Subscriptions
					</a>
				</div>
			</div>
		` );
	}
} );

// </nowiki>
