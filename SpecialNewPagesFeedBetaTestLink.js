// Load the Vue rewrite of the PageTriage Page Curation toolbar
// current status as of March 2025: the vue toolbar rewrite is the default, and the old toolbar can be turned back on with ?pagetriage_ui=old

$.when( mw.loader.using( [ 'mediawiki.util' ] ), $.ready ).then( () => {
	mw.util.addPortletLink(
		'p-navigation',
		mw.util.getUrl( 'Special:NewPagesFeed' ),
		'New pages feed (beta)',
		'pt-pagecuration-beta',
		'View the new pages feed'
	);

	mw.util.addPortletLink(
		'p-navigation',
		mw.util.getUrl( 'Special:NewPagesFeed' ) + '?pagetriage_ui=old',
		'New pages feed (old)',
		'pt-pagecuration-beta',
		'View the new pages feed'
	);
} );
